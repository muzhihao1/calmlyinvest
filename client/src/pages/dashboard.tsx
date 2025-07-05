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
import { ChartLine, Settings, Clock, RotateCcw, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function Dashboard() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"stock" | "option">("stock");
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const { toast } = useToast();

  // Default to portfolio ID 1 for the demo
  const portfolioId = 1;
  const userId = 1;

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: [`/api/portfolio/${portfolioId}`],
  });

  const { data: stockHoldings = [], isLoading: stocksLoading } = useQuery({
    queryKey: [`/api/portfolio/${portfolioId}/stocks`],
  });

  const { data: optionHoldings = [], isLoading: optionsLoading } = useQuery({
    queryKey: [`/api/portfolio/${portfolioId}/options`],
  });

  const { data: riskMetrics, isLoading: riskLoading, refetch: refetchRisk } = useQuery({
    queryKey: [`/api/portfolio/${portfolioId}/risk`],
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: [`/api/portfolio/${portfolioId}/suggestions`],
  });

  const { data: riskSettings } = useQuery({
    queryKey: [`/api/user/${userId}/risk-settings`],
  });

  const handleRefresh = async () => {
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
              <span className="text-sm text-gray-400">Stock Portfolio Risk Manager</span>
            </div>
            
            <div className="flex items-center space-x-4">
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
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="holdings" className="data-[state=active]:bg-primary">
              <ChartLine className="mr-2 h-4 w-4" />
              持仓管理
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-primary">
              <ChartLine className="mr-2 h-4 w-4" />
              风险分析
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="data-[state=active]:bg-primary">
              <ChartLine className="mr-2 h-4 w-4" />
              智能建议
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary">
              <Settings className="mr-2 h-4 w-4" />
              设置
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
                onClick={() => { setAddDialogType("stock"); setAddDialogOpen(true); }}
                className="bg-primary hover:bg-blue-600"
              >
                <ChartLine className="mr-2 h-4 w-4" />
                添加股票持仓
              </Button>
              <Button 
                onClick={() => { setAddDialogType("option"); setAddDialogOpen(true); }}
                className="bg-primary hover:bg-blue-600"
              >
                <Settings className="mr-2 h-4 w-4" />
                添加期权持仓
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setCsvImportOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                导入CSV
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleExportData()}
              >
                <Download className="mr-2 h-4 w-4" />
                导出数据
              </Button>
            </div>

            {/* Holdings Tables */}
            <HoldingsTable holdings={stockHoldings || []} portfolioId={portfolioId} />
            <OptionsTable holdings={optionHoldings || []} portfolioId={portfolioId} />
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
              userId={userId}
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
        portfolioId={portfolioId}
      />
    </div>
  );
}
