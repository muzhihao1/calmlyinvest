import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskGauge } from "@/components/risk-gauge";
import { MetricsCard } from "@/components/metrics-card";
import { HoldingsTable } from "@/components/holdings-table";
import { OptionsTable } from "@/components/options-table";
import { RiskAnalysis } from "@/components/risk-analysis";
import { SmartSuggestions } from "@/components/smart-suggestions";
import { SettingsPanel } from "@/components/settings-panel";
import { AddHoldingDialog } from "@/components/add-holding-dialog";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { ChartLine, Settings, Clock, RotateCcw, Upload, Download, LogOut, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient-supabase";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import type { Portfolio, StockHolding, OptionHolding, RiskSettings } from "@shared/schema-types";
import type { Suggestion } from "@/components/smart-suggestions";

export default function Dashboard() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"stock" | "option">("stock");
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const { toast } = useToast();
  const { user, signOut, isGuest } = useAuth();

  // Get userId from Supabase user or use guest mode
  const userId = user?.id || "guest-user";
  const isLoggedIn = !isGuest && !!user;
  
  // Mutation to create default portfolio
  const createPortfolioMutation = useMutation({
    mutationFn: async () => {
      const defaultPortfolio = {
        name: isGuest ? "访客演示组合" : "我的投资组合",
        totalEquity: "1000000",
        cashBalance: "300000",
        marginUsed: "0",
        userId
      };
      const response = await apiRequest("POST", "/api/portfolios", defaultPortfolio);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-portfolios-simple?userId=${userId}`] });
    }
  });

  // Fetch user's portfolios
  const { data: portfolios = [], isLoading: portfoliosLoading } = useQuery<Portfolio[]>({
    queryKey: [`/api/user-portfolios-simple?userId=${userId}`],
    enabled: !!userId,
  });
  
  // Create default portfolio if none exists (but not for guest users)
  useEffect(() => {
    if (!portfoliosLoading && portfolios.length === 0 && userId && !isGuest) {
      createPortfolioMutation.mutate();
    }
  }, [portfoliosLoading, portfolios, userId, isGuest]);
  
  // Use the first portfolio or demo portfolio for guests
  const portfolioId = portfolios[0]?.id || (isGuest ? "demo-portfolio-1" : null);
  

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<Portfolio>({
    queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId,
  });

  // Custom state for guest mode stock holdings
  const [guestStocks, setGuestStocks] = useState<StockHolding[]>([]);
  
  // Load guest stocks from localStorage on mount and when portfolioId changes
  useEffect(() => {
    const loadGuestStocks = () => {
      if (isGuest && portfolioId === 'demo-portfolio-1') {
        try {
          const stored = localStorage.getItem('guest_stocks');
          const allStocks = stored ? JSON.parse(stored) : {};
          const portfolioStocks = allStocks[portfolioId] || [];
          setGuestStocks(portfolioStocks);
        } catch (error) {
          console.error('Error loading guest stocks from localStorage:', error);
          setGuestStocks([]);
        }
      }
    };

    // Load on mount and portfolio change
    loadGuestStocks();

    // Listen for guest stock updates
    const handleGuestStocksUpdate = () => {
      loadGuestStocks();
    };

    if (isGuest) {
      window.addEventListener('guestStocksUpdated', handleGuestStocksUpdate);
      return () => {
        window.removeEventListener('guestStocksUpdated', handleGuestStocksUpdate);
      };
    }
  }, [isGuest, portfolioId]);

  const { data: stockHoldings = [], isLoading: stocksLoading } = useQuery<StockHolding[]>({
    queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId && !isGuest,
  });
  
  // Use guest stocks for guests, API data for authenticated users
  const actualStockHoldings = isGuest ? guestStocks : stockHoldings;

  const { data: optionHoldings = [], isLoading: optionsLoading } = useQuery<OptionHolding[]>({
    queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId,
  });

  const { data: riskMetrics = {}, isLoading: riskLoading, refetch: refetchRisk } = useQuery<any>({
    queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId,
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<Suggestion[]>({
    queryKey: [`/api/portfolio-suggestions-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId,
  });

  const { data: riskSettings } = useQuery<RiskSettings>({
    queryKey: [`/api/user-risk-settings-simple?userId=${userId}`],
  });

  const handleRefresh = async () => {
    if (!portfolioId) {
      toast({
        title: "无投资组合",
        description: "请先创建投资组合",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Refresh market prices first
      const response = await apiRequest("POST", `/api/portfolio/${portfolioId}/refresh-prices`);
      const result = await response.json();
      
      // Then refresh all data
      await refetchRisk();
      queryClient.invalidateQueries();
      setLastUpdate(new Date());
      
      toast({
        title: "数据已更新",
        description: `${result.message || "风险指标已重新计算"}`,
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: "无法刷新数据，请稍后重试",
        variant: "destructive",
      });
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleExportData = () => {
    if (!stockHoldings || !optionHoldings) {
      toast({
        title: "No data to export",
        description: "Please wait for data to load",
        variant: "destructive"
      });
      return;
    }

    // Export stock holdings
    const stockHeaders = ["symbol", "name", "quantity", "costPrice", "currentPrice", "beta"];
    const stockRows = stockHoldings.map(h => [
      h.symbol,
      h.name || "",
      h.quantity,
      h.costPrice,
      h.currentPrice || "",
      h.beta || ""
    ]);
    const stockCsv = [stockHeaders, ...stockRows].map(row => row.join(",")).join("\n");

    // Create and download CSV
    const blob = new Blob([stockCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio_stocks_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Stock holdings exported to CSV"
    });
  };

  if (portfolioLoading || stocksLoading || optionsLoading || riskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // If no portfolio and user is logged in, show create portfolio message
  // Otherwise, guest mode will handle showing demo data

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <ChartLine className="text-primary text-2xl mr-3" />
                <h1 className="text-xl font-bold text-white">智能仓位管家</h1>
              </div>
              <span className="text-sm text-gray-400 hidden lg:inline">Stock Portfolio Risk Manager</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <span className="text-sm text-gray-300">
                  {user?.email}
                </span>
              ) : (
                <span className="text-sm text-yellow-400 hidden md:inline">
                  访客模式 - 数据仅保存在本地
                </span>
              )}
              <div className="text-sm text-gray-400 flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                最后更新: <span className="ml-1">{formatLastUpdate(lastUpdate)}</span>
              </div>
              
              <Button onClick={handleRefresh} className="bg-primary hover:bg-blue-600">
                <RotateCcw className="mr-2 h-4 w-4" />
                刷新数据
              </Button>
              
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Settings className="h-5 w-5" />
              </Button>
              
              {isLoggedIn ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={async () => {
                    try {
                      await signOut();
                      toast({
                        title: "已退出登录",
                        description: "期待您的再次使用",
                      });
                    } catch (error) {
                      toast({
                        title: "退出失败",
                        description: "请稍后重试",
                        variant: "destructive",
                      });
                    }
                  }}
                  title="退出登录"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => {
                    window.location.href = "/login";
                  }}
                  title="登录账号"
                >
                  <LogIn className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Risk Overview Dashboard */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge */}
            <div className="lg:col-span-1">
              <RiskGauge 
                leverageRatio={parseFloat(riskMetrics?.leverageRatio || "0")} 
                riskLevel={riskMetrics?.riskLevel || "GREEN"}
              />
            </div>
            
            {/* Key Metrics */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4 h-full">
                <MetricsCard
                  title="投资组合Beta值"
                  value={riskMetrics?.portfolioBeta || "0.00"}
                  description={parseFloat(riskMetrics?.portfolioBeta || "0") > 1.2 ? "高于市场波动" : "波动适中"}
                  type={parseFloat(riskMetrics?.portfolioBeta || "0") > 1.2 ? "warning" : "success"}
                  tooltip="衡量相对市场的波动性"
                />
                <MetricsCard
                  title="最大持仓集中度"
                  value={`${riskMetrics?.maxConcentration || "0"}%`}
                  description={parseFloat(riskMetrics?.maxConcentration || "0") > 20 ? "超过建议上限" : "集中度适中"}
                  type={parseFloat(riskMetrics?.maxConcentration || "0") > 20 ? "danger" : "success"}
                  tooltip="单个标的占总投资组合比例"
                />
                <MetricsCard
                  title="保证金使用率"
                  value={`${riskMetrics?.marginUsageRatio || "0"}%`}
                  description={parseFloat(riskMetrics?.marginUsageRatio || "0") > 80 ? "接近保证金上限" : "使用率适中"}
                  type={parseFloat(riskMetrics?.marginUsageRatio || "0") > 80 ? "warning" : "success"}
                  tooltip="已用保证金占总保证金比例"
                />
                <MetricsCard
                  title="剩余流动性"
                  value={`${riskMetrics?.remainingLiquidity || "0"}%`}
                  description={parseFloat(riskMetrics?.remainingLiquidity || "0") < 30 ? "低于建议30%" : "流动性充足"}
                  type={parseFloat(riskMetrics?.remainingLiquidity || "0") < 30 ? "danger" : "success"}
                  tooltip="剩余流动性占净清算价值比例"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="holdings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 overflow-x-auto">
            <TabsTrigger value="holdings" className="data-[state=active]:bg-primary text-xs md:text-sm">
              <ChartLine className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">持仓管理</span>
              <span className="sm:hidden">持仓</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-primary text-xs md:text-sm">
              <ChartLine className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">图表分析</span>
              <span className="sm:hidden">图表</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-primary text-xs md:text-sm">
              <ChartLine className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">风险分析</span>
              <span className="sm:hidden">风险</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="data-[state=active]:bg-primary text-xs md:text-sm">
              <ChartLine className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">智能建议</span>
              <span className="sm:hidden">建议</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary text-xs md:text-sm">
              <Settings className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">设置</span>
              <span className="sm:hidden">设置</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-6">
            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">净清算价值</div>
                <div className="text-2xl font-bold text-white">
                  ${parseFloat(portfolio?.totalEquity || "0").toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">市场价值</div>
                <div className="text-2xl font-bold text-white">
                  ${parseFloat(riskMetrics?.stockValue || "0").toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">维持保证金</div>
                <div className="text-2xl font-bold text-yellow-500">
                  ${parseFloat(portfolio?.marginUsed || "0").toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">现金余额</div>
                <div className="text-2xl font-bold text-primary">
                  ${parseFloat(portfolio?.cashBalance || "0").toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button 
                onClick={() => { 
                  if (!portfolioId) {
                    toast({
                      title: "请稍候",
                      description: "正在创建投资组合...",
                    });
                    return;
                  }
                  console.log("添加股票按钮被点击");
                  setAddDialogType("stock"); 
                  setAddDialogOpen(true); 
                }}
                className="bg-primary hover:bg-blue-600"
                disabled={!portfolioId || createPortfolioMutation.isPending}
              >
                <ChartLine className="mr-2 h-4 w-4" />
                添加股票持仓
              </Button>
              <Button 
                onClick={() => { 
                  if (!portfolioId) {
                    toast({
                      title: "请稍候",
                      description: "正在创建投资组合...",
                    });
                    return;
                  }
                  setAddDialogType("option"); 
                  setAddDialogOpen(true); 
                }}
                className="bg-primary hover:bg-blue-600"
                disabled={!portfolioId || createPortfolioMutation.isPending}
              >
                <Settings className="mr-2 h-4 w-4" />
                添加期权持仓
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setCsvImportOpen(true)}
                disabled={!portfolioId || createPortfolioMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                导入CSV
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleExportData()}
                disabled={!stockHoldings?.length && !optionHoldings?.length}
              >
                <Download className="mr-2 h-4 w-4" />
                导出数据
              </Button>
            </div>

            {/* Holdings Tables */}
            <HoldingsTable holdings={actualStockHoldings || []} portfolioId={portfolioId || ''} />
            <OptionsTable holdings={optionHoldings || []} portfolioId={portfolioId || ''} />
          </TabsContent>

          <TabsContent value="charts">
            <PortfolioCharts 
              stockHoldings={stockHoldings || []} 
              optionHoldings={optionHoldings || []}
              riskMetrics={riskMetrics}
              portfolio={portfolio}
            />
          </TabsContent>

          <TabsContent value="analysis">
            <RiskAnalysis 
              stockHoldings={stockHoldings || []} 
              optionHoldings={optionHoldings || []}
              riskMetrics={riskMetrics}
            />
          </TabsContent>

          <TabsContent value="suggestions">
            <SmartSuggestions 
              suggestions={suggestions || []} 
              isLoading={suggestionsLoading}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel 
              userId={userId || ''}
              currentSettings={riskSettings}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddHoldingDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={addDialogType}
        portfolioId={portfolioId}
      />
      
      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        portfolioId={portfolioId || ''}
      />
    </div>
  );
}
