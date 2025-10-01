import { useState, useEffect, useRef } from "react";
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
import { ChartLine, Settings, Clock, RotateCcw, Upload, Download, LogOut, LogIn, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient-supabase";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import type { Portfolio, StockHolding, OptionHolding, RiskSettings } from "@shared/schema-types";
import type { Suggestion } from "@/components/smart-suggestions";

export default function Dashboard() {
  // Diagnostic: Track render count
  const renderCount = useRef(0);
  renderCount.current += 1;

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"stock" | "option">("stock");
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const { toast } = useToast();
  const { user, signOut, isGuest, session, loading: authLoading } = useAuth();

  // Get userId from Supabase user or use guest mode
  const userId = user?.id || "guest-user";
  const isLoggedIn = !isGuest && !!user;
  
  // Fetch user's portfolios (API handles portfolio creation automatically)
  const { data: portfolios = [], isLoading: portfoliosLoading, error: portfoliosError } = useQuery<Portfolio[]>({
    queryKey: [`/api/user-portfolios-simple?userId=${userId}`],
    enabled: !!userId && !isGuest && !authLoading, // Only enabled for authenticated users after auth is ready
  });

  // Use the first portfolio or demo portfolio for guests
  // Note: API automatically creates a default portfolio if user has none
  const portfolioId = portfolios[0]?.id || (isGuest ? "demo-portfolio-1" : null);
  
  console.log('Debug Dashboard:', {
    isGuest,
    userId,
    portfoliosLength: portfolios.length,
    portfolioId,
    isLoggedIn,
    portfoliosLoading,
    portfoliosError,
    session,
    user
  });
  

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<Portfolio>({
    queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId,
  });

  // Custom state for guest mode stock holdings
  const [guestStocks, setGuestStocks] = useState<StockHolding[]>([]);
  const [guestOptions, setGuestOptions] = useState<OptionHolding[]>([]);
  const [guestCashBalance, setGuestCashBalance] = useState<number>(0);
  const [editingCash, setEditingCash] = useState(false);
  const [tempCashValue, setTempCashValue] = useState<string>("");

  // Load guest data from localStorage on mount and when portfolioId changes
  useEffect(() => {
    const loadGuestData = () => {
      if (isGuest && portfolioId === 'demo-portfolio-1') {
        try {
          // Load stocks
          const stocksStored = localStorage.getItem('guest_stocks');
          const allStocks = stocksStored ? JSON.parse(stocksStored) : {};
          const portfolioStocks = allStocks[portfolioId] || [];
          setGuestStocks(portfolioStocks);

          // Load portfolio settings (cash balance)
          const settingsStored = localStorage.getItem('guest_portfolio_settings');
          const allSettings = settingsStored ? JSON.parse(settingsStored) : {};
          const portfolioSettings = allSettings[portfolioId] || { cashBalance: 0 };
          setGuestCashBalance(portfolioSettings.cashBalance !== undefined ? portfolioSettings.cashBalance : 0);
        } catch (error) {
          console.error('Error loading guest data from localStorage:', error);
          setGuestStocks([]);
          setGuestCashBalance(0);
        }
      }
    };

    // Load on mount and portfolio change
    loadGuestData();

    // Listen for guest stock updates
    const handleGuestStocksUpdate = () => {
      loadGuestData();
    };

    if (isGuest) {
      window.addEventListener('guestStocksUpdated', handleGuestStocksUpdate);
      return () => {
        window.removeEventListener('guestStocksUpdated', handleGuestStocksUpdate);
      };
    }
  }, [isGuest, portfolioId]);

  // Load guest options from localStorage on mount and when portfolioId changes
  useEffect(() => {
    const loadGuestOptions = () => {
      if (isGuest && portfolioId === 'demo-portfolio-1') {
        try {
          const stored = localStorage.getItem('guest_options');
          const allOptions = stored ? JSON.parse(stored) : {};
          const portfolioOptions = allOptions[portfolioId] || [];
          setGuestOptions(portfolioOptions);
        } catch (error) {
          console.error('Error loading guest options from localStorage:', error);
          setGuestOptions([]);
        }
      }
    };

    // Load on mount and portfolio change
    loadGuestOptions();

    // Listen for guest option updates
    const handleGuestOptionsUpdate = () => {
      loadGuestOptions();
    };

    if (isGuest) {
      window.addEventListener('guestOptionsUpdated', handleGuestOptionsUpdate);
      return () => {
        window.removeEventListener('guestOptionsUpdated', handleGuestOptionsUpdate);
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
    enabled: !!portfolioId && !isGuest,
  });
  
  // Use guest options for guests, API data for authenticated users
  const actualOptionHoldings = isGuest ? guestOptions : optionHoldings;

  // Client-side risk calculations for guest mode
  const calculateGuestRiskMetrics = (stocks: StockHolding[], options: OptionHolding[]) => {
    const totalStockValue = stocks.reduce((sum, stock) => 
      sum + (stock.quantity * parseFloat(stock.currentPrice || "0")), 0);
    
    const portfolioBeta = stocks.length > 0 ? 
      stocks.reduce((sum, stock) => {
        const value = stock.quantity * parseFloat(stock.currentPrice || "0");
        const beta = parseFloat(stock.beta || "1.0");
        return sum + (beta * value);
      }, 0) / totalStockValue : 0;
    
    const maxConcentration = stocks.length > 0 ? 
      Math.max(...stocks.map(stock => {
        const value = stock.quantity * parseFloat(stock.currentPrice || "0");
        return totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
      })) : 0;
    
    // Simple leverage calculation: (Stock Value + Option Value) / Net Liquidation Value
    const optionValue = options.reduce((sum, option) => 
      sum + (option.contracts * parseFloat(option.currentPrice || "0") * 100), 0);
    const totalMarketValue = totalStockValue + optionValue;
    const cashBalance = guestCashBalance; // Use editable cash balance
    const netLiquidationValue = totalStockValue + optionValue + cashBalance;
    const leverageRatio = netLiquidationValue > 0 ? totalMarketValue / netLiquidationValue : 0;
    
    return {
      stockValue: totalStockValue.toFixed(2),
      portfolioBeta: portfolioBeta.toFixed(2),
      maxConcentration: maxConcentration.toFixed(1),
      leverageRatio: leverageRatio.toFixed(2),
      marginUsageRatio: "0",
      remainingLiquidity: "100",
      riskLevel: leverageRatio > 1.5 ? "RED" : leverageRatio > 1.2 ? "YELLOW" : "GREEN"
    };
  };

  const calculateGuestPortfolio = (stocks: StockHolding[], options: OptionHolding[]) => {
    const stockValue = stocks.reduce((sum, stock) => 
      sum + (stock.quantity * parseFloat(stock.currentPrice || "0")), 0);
    
    const optionValue = options.reduce((sum, option) => 
      sum + (option.contracts * parseFloat(option.currentPrice || "0") * 100), 0);
    
    const cashBalance = guestCashBalance; // Use editable cash balance
    const marginUsed = 0; // No margin for demo
    const totalEquity = stockValue + optionValue + cashBalance - marginUsed;
    
    return {
      id: "demo-portfolio-1",
      name: "访客演示组合",
      totalEquity: totalEquity.toFixed(2),
      cashBalance: cashBalance.toFixed(2),
      marginUsed: marginUsed.toFixed(2),
      userId: "guest-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Function to save cash balance to localStorage
  const saveCashBalance = (newBalance: number) => {
    try {
      const stored = localStorage.getItem('guest_portfolio_settings');
      const allSettings = stored ? JSON.parse(stored) : {};
      
      if (!allSettings[portfolioId]) {
        allSettings[portfolioId] = {};
      }
      allSettings[portfolioId].cashBalance = newBalance;
      
      localStorage.setItem('guest_portfolio_settings', JSON.stringify(allSettings));
      setGuestCashBalance(newBalance);
    } catch (error) {
      console.error('Error saving cash balance:', error);
    }
  };

  // Function to calculate total portfolio performance
  const calculatePortfolioPerformance = (stocks: StockHolding[], options: OptionHolding[]) => {
    const totalCost = stocks.reduce((sum, stock) => 
      sum + (stock.quantity * parseFloat(stock.costPrice)), 0) + 
      options.reduce((sum, option) => 
        sum + (option.contracts * parseFloat(option.costPrice) * 100), 0);
    
    const totalMarketValue = stocks.reduce((sum, stock) => 
      sum + (stock.quantity * parseFloat(stock.currentPrice || "0")), 0) +
      options.reduce((sum, option) => 
        sum + (option.contracts * parseFloat(option.currentPrice || "0") * 100), 0);
    
    const totalPnL = totalMarketValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    
    return {
      totalCost,
      totalMarketValue,
      totalPnL,
      totalPnLPercent
    };
  };

  const { data: riskMetrics = {}, isLoading: riskLoading, refetch: refetchRisk } = useQuery<any>({
    queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId && !isGuest,
  });

  // Use guest calculations for guests, API data for authenticated users
  const actualRiskMetrics = isGuest ? calculateGuestRiskMetrics(actualStockHoldings, actualOptionHoldings) : riskMetrics;
  const actualPortfolio = isGuest ? calculateGuestPortfolio(actualStockHoldings, actualOptionHoldings) : portfolio;
  const portfolioPerformance = isGuest ? calculatePortfolioPerformance(actualStockHoldings, actualOptionHoldings) : null;

  // Handle cash balance editing
  const handleCashEdit = () => {
    setTempCashValue(guestCashBalance.toString());
    setEditingCash(true);
  };

  const handleCashSave = () => {
    const newBalance = parseFloat(tempCashValue);
    if (!isNaN(newBalance) && newBalance >= 0) {
      saveCashBalance(newBalance);
      toast({
        title: "更新成功",
        description: `现金余额已更新为 $${newBalance.toLocaleString()}`,
      });
    } else {
      toast({
        title: "输入错误",
        description: "请输入有效的金额",
        variant: "destructive",
      });
    }
    setEditingCash(false);
  };

  const handleCashCancel = () => {
    setEditingCash(false);
    setTempCashValue("");
  };

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<Suggestion[]>({
    queryKey: [`/api/portfolio-suggestions-simple?portfolioId=${portfolioId}`],
    enabled: !!portfolioId,
  });

  const { data: riskSettings } = useQuery<RiskSettings>({
    queryKey: [`/api/user-risk-settings-simple?userId=${userId}`],
  });

  const handleRefresh = async (silent: boolean = false) => {
    if (!portfolioId) {
      if (!silent) {
        toast({
          title: "无投资组合",
          description: "请先创建投资组合",
          variant: "destructive",
        });
      }
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

      // Only show toast if not silent (manual refresh)
      if (!silent) {
        toast({
          title: "数据已更新",
          description: `${result.message || "风险指标已重新计算"}`,
        });
      }
    } catch (error) {
      // Always show error toast
      if (!silent) {
        toast({
          title: "更新失败",
          description: "无法刷新数据，请稍后重试",
          variant: "destructive",
        });
      }
    }
  };

  // Initial refresh when portfolio loads (to calculate total_equity)
  useEffect(() => {
    console.log('[AutoRefreshEffect] Effect running', {
      renderCount: renderCount.current,
      portfolioId,
      isGuest,
      portfolioLoading,
      hasPortfolio: !!portfolio,
      timestamp: performance.now()
    });

    if (!portfolioId) {
      console.log('[AutoRefreshEffect] Early return: no portfolioId');
      return;
    }
    if (isGuest) {
      console.log('[AutoRefreshEffect] Early return: isGuest mode');
      return;
    }
    if (portfolioLoading) {
      console.log('[AutoRefreshEffect] Early return: portfolioLoading=true');
      return;
    }
    if (!portfolio) {
      console.log('[AutoRefreshEffect] Early return: portfolio is null/undefined');
      return;
    }

    // Log raw portfolio data
    console.log('[AutoRefreshEffect] Portfolio data:', {
      totalEquity_raw: portfolio.totalEquity,
      totalEquity_type: typeof portfolio.totalEquity,
      marketValue: portfolio.marketValue,
      netLiquidation: portfolio.netLiquidation
    });

    // Normalize totalEquity to number
    const totalEquityRaw = portfolio.totalEquity;
    const totalEquity = typeof totalEquityRaw === 'number'
      ? totalEquityRaw
      : parseFloat(String(totalEquityRaw || '0'));

    console.log('[AutoRefreshEffect] Normalized totalEquity:', {
      raw: totalEquityRaw,
      normalized: totalEquity,
      isFinite: Number.isFinite(totalEquity),
      isZero: totalEquity === 0,
      isSmall: totalEquity < 0.01
    });

    // If portfolio value is 0 or very small, trigger immediate refresh
    if (Number.isFinite(totalEquity) && (totalEquity === 0 || totalEquity < 0.01)) {
      console.log('[AutoRefreshEffect] ✅ Triggering auto-refresh (totalEquity is 0 or < 0.01)');

      const timer = setTimeout(() => {
        console.log('[AutoRefreshEffect] 🔄 Executing handleRefresh now');
        handleRefresh(true); // Silent refresh
      }, 300);

      return () => {
        console.log('[AutoRefreshEffect] Cleanup: clearing timer');
        clearTimeout(timer);
      };
    } else {
      console.log('[AutoRefreshEffect] No refresh needed, totalEquity looks valid:', totalEquity);
    }
  }, [portfolio, portfolioId, isGuest, portfolioLoading]); // Run when portfolio data changes

  // Auto-refresh every 5 minutes (silent mode to avoid notification spam)
  useEffect(() => {
    if (!portfolioId || !refetchRisk) return;

    const interval = setInterval(() => {
      handleRefresh(true); // Silent refresh
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [portfolioId, refetchRisk]);

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
    if (!actualStockHoldings || !actualOptionHoldings) {
      toast({
        title: "No data to export",
        description: "Please wait for data to load",
        variant: "destructive"
      });
      return;
    }

    // Export stock holdings
    const stockHeaders = ["symbol", "name", "quantity", "costPrice", "currentPrice", "beta"];
    const stockRows = actualStockHoldings.map(h => [
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

  // Show loading state while auth is loading or (for authenticated users) while data is loading
  if (authLoading || (!isGuest && (portfolioLoading || stocksLoading || optionsLoading || riskLoading))) {
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
                leverageRatio={parseFloat(actualRiskMetrics?.leverageRatio || "0")} 
                riskLevel={actualRiskMetrics?.riskLevel || "GREEN"}
              />
            </div>
            
            {/* Key Metrics */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4 h-full">
                <MetricsCard
                  title="投资组合Beta值"
                  value={actualRiskMetrics?.portfolioBeta || "0.00"}
                  description={parseFloat(actualRiskMetrics?.portfolioBeta || "0") > 1.2 ? "高于市场波动" : "波动适中"}
                  type={parseFloat(actualRiskMetrics?.portfolioBeta || "0") > 1.2 ? "warning" : "success"}
                  tooltip="衡量相对市场的波动性"
                />
                <MetricsCard
                  title="最大持仓集中度"
                  value={`${actualRiskMetrics?.maxConcentration || "0"}%`}
                  description={parseFloat(actualRiskMetrics?.maxConcentration || "0") > 20 ? "超过建议上限" : "集中度适中"}
                  type={parseFloat(actualRiskMetrics?.maxConcentration || "0") > 20 ? "danger" : "success"}
                  tooltip="单个标的占总投资组合比例"
                />
                <MetricsCard
                  title="保证金使用率"
                  value={`${actualRiskMetrics?.marginUsageRatio || "0"}%`}
                  description={parseFloat(actualRiskMetrics?.marginUsageRatio || "0") > 80 ? "接近保证金上限" : "使用率适中"}
                  type={parseFloat(actualRiskMetrics?.marginUsageRatio || "0") > 80 ? "warning" : "success"}
                  tooltip="已用保证金占总保证金比例"
                />
                <MetricsCard
                  title="剩余流动性"
                  value={`${actualRiskMetrics?.remainingLiquidity || "0"}%`}
                  description={parseFloat(actualRiskMetrics?.remainingLiquidity || "0") < 30 ? "低于建议30%" : "流动性充足"}
                  type={parseFloat(actualRiskMetrics?.remainingLiquidity || "0") < 30 ? "danger" : "success"}
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">净清算价值</div>
                <div className="text-2xl font-bold text-white">
                  ${parseFloat(actualPortfolio?.totalEquity || "0").toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">市场价值</div>
                <div className="text-2xl font-bold text-white">
                  ${parseFloat(actualRiskMetrics?.stockValue || "0").toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">维持保证金</div>
                <div className="text-2xl font-bold text-yellow-500">
                  ${parseFloat(actualPortfolio?.marginUsed || "0").toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400 flex items-center">
                  现金余额
                  {isGuest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                      onClick={handleCashEdit}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingCash && isGuest ? (
                  <div className="flex items-center mt-2">
                    <Input
                      type="number"
                      value={tempCashValue}
                      onChange={(e) => setTempCashValue(e.target.value)}
                      className="h-8 text-sm bg-slate-700 border-gray-600"
                      placeholder="输入金额"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-6 w-6 p-0 text-green-500"
                      onClick={handleCashSave}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-6 w-6 p-0 text-red-500"
                      onClick={handleCashCancel}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-primary">
                    ${parseFloat(actualPortfolio?.cashBalance || "0").toLocaleString()}
                  </div>
                )}
              </div>
              {isGuest && portfolioPerformance && (
                <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
                  <div className="text-sm text-gray-400">总盈亏</div>
                  <div className={`text-2xl font-bold ${portfolioPerformance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolioPerformance.totalPnL >= 0 ? '+' : ''}${portfolioPerformance.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm ${portfolioPerformance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({portfolioPerformance.totalPnL >= 0 ? '+' : ''}{portfolioPerformance.totalPnLPercent.toFixed(2)}%)
                  </div>
                </div>
              )}
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
                disabled={!portfolioId}
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
                disabled={!portfolioId}
              >
                <Settings className="mr-2 h-4 w-4" />
                添加期权持仓
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setCsvImportOpen(true)}
                disabled={!portfolioId}
              >
                <Upload className="mr-2 h-4 w-4" />
                导入CSV
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleExportData()}
                disabled={!actualStockHoldings?.length && !actualOptionHoldings?.length}
              >
                <Download className="mr-2 h-4 w-4" />
                导出数据
              </Button>
            </div>

            {/* Holdings Tables */}
            <HoldingsTable holdings={actualStockHoldings || []} portfolioId={portfolioId || ''} isGuest={isGuest} />
            <OptionsTable holdings={actualOptionHoldings || []} portfolioId={portfolioId || ''} />
          </TabsContent>

          <TabsContent value="charts">
            <PortfolioCharts 
              stockHoldings={actualStockHoldings || []} 
              optionHoldings={actualOptionHoldings || []}
              riskMetrics={actualRiskMetrics}
              portfolio={actualPortfolio}
            />
          </TabsContent>

          <TabsContent value="analysis">
            <RiskAnalysis 
              stockHoldings={actualStockHoldings || []} 
              optionHoldings={actualOptionHoldings || []}
              riskMetrics={actualRiskMetrics}
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
