import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, LineChart, BarChart } from "lucide-react";
import type { StockHolding, OptionHolding } from "@shared/schema-supabase";

interface RiskAnalysisProps {
  stockHoldings: StockHolding[];
  optionHoldings: OptionHolding[];
  riskMetrics: any;
}

export function RiskAnalysis({ stockHoldings, optionHoldings, riskMetrics }: RiskAnalysisProps) {
  const calculateStockConcentrations = () => {
    const totalValue = stockHoldings.reduce((sum, holding) => 
      sum + (holding.quantity * parseFloat(holding.currentPrice || "0")), 0
    );

    return stockHoldings
      .map(holding => ({
        symbol: holding.symbol,
        name: holding.name,
        concentration: totalValue > 0 ? 
          (holding.quantity * parseFloat(holding.currentPrice || "0") / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.concentration - a.concentration);
  };

  const calculateStressTest = () => {
    const totalEquity = parseFloat(riskMetrics?.totalEquity || "0");
    const stockValue = parseFloat(riskMetrics?.stockValue || "0");
    const portfolioBeta = parseFloat(riskMetrics?.portfolioBeta || "1.0");
    const optionMaxLoss = parseFloat(riskMetrics?.optionMaxLoss || "0");
    const leverageRatio = parseFloat(riskMetrics?.leverageRatio || "0");

    // Simulate market drops with proper leverage effect
    const scenarios = [
      { name: "市场下跌10%", marketDrop: 0.1 },
      { name: "市场下跌20%", marketDrop: 0.2 },
      { name: "市场下跌30%", marketDrop: 0.3 }
    ];

    return scenarios.map(scenario => {
      // Calculate stock value drop considering beta
      const stockValueDrop = stockValue * scenario.marketDrop * portfolioBeta;

      // Estimate option losses during market stress
      // For SELL options (liabilities), market drop increases losses significantly
      // Conservative estimate: option losses are 2-3x leveraged relative to market drop
      // This accounts for delta changes and volatility increases
      const optionStressMultiplier = 2.5; // Conservative estimate for sold options
      const estimatedOptionLoss = optionMaxLoss * scenario.marketDrop * optionStressMultiplier;

      // Total portfolio loss = stock drop + option stress losses
      const portfolioLoss = stockValueDrop + estimatedOptionLoss;

      // New total equity after loss
      const newTotalEquity = Math.max(totalEquity - portfolioLoss, 0);

      // New stock value after drop
      const newStockValue = stockValue - stockValueDrop;

      // New leverage ratio (if equity becomes 0, leverage is infinite)
      const newLeverageRatio = newTotalEquity > 0 ?
        (newStockValue + optionMaxLoss) / newTotalEquity : 999;

      // Drawdown percentage relative to total equity
      const drawdownPercent = totalEquity > 0 ? (portfolioLoss / totalEquity) * 100 : 0;

      return {
        name: scenario.name,
        marketDrop: scenario.marketDrop,
        loss: portfolioLoss,
        drawdownPercent,
        newLeverageRatio: Math.min(newLeverageRatio, 999), // Cap at 999 for display
        newTotalEquity
      };
    });
  };

  const concentrations = calculateStockConcentrations();
  const stressTests = calculateStressTest();

  const calculateDaysToExpiration = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Composition */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <PieChart className="mr-2 h-5 w-5" />
            投资组合构成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    ${parseFloat(riskMetrics?.stockValue || "0").toLocaleString()}
                  </div>
                  <div className="text-gray-400">股票持仓</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">
                    ${parseFloat(riskMetrics?.optionMaxLoss || "0").toLocaleString()}
                  </div>
                  <div className="text-gray-400">期权风险</div>
                </div>
              </div>
              <p className="mt-4 text-sm">实际风险敞口分析</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Trend */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <LineChart className="mr-2 h-5 w-5" />
            杠杆率历史趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="text-3xl font-bold text-white mb-2">
                  {riskMetrics?.leverageRatio || "0.00"}
                </div>
                <div className="text-sm">当前杠杆率</div>
                <div className="mt-4 text-xs">
                  <div className="flex justify-between">
                    <span>安全线</span>
                    <span>1.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>警告线</span>
                    <span>1.50</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm">历史趋势分析</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concentration Analysis */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <BarChart className="mr-2 h-5 w-5" />
            集中度分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {concentrations.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{item.symbol}</span>
                <div className="flex items-center w-2/3">
                  <Progress 
                    value={item.concentration} 
                    className="flex-1 mr-3"
                  />
                  <span className={`font-semibold text-sm w-12 text-right ${
                    item.concentration >= 20 ? "text-red-500" : 
                    item.concentration >= 10 ? "text-yellow-500" : "text-green-500"
                  }`}>
                    {item.concentration.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Options Expiration Timeline */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <LineChart className="mr-2 h-5 w-5" />
            期权到期时间轴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optionHoldings.map((option, index) => {
              const daysToExpiration = calculateDaysToExpiration(option.expirationDate.toString());
              const maxRisk = option.direction === "BUY" ? 
                Math.abs(option.contracts) * parseFloat(option.costPrice) * 100 :
                parseFloat(option.strikePrice) * Math.abs(option.contracts) * 100;

              return (
                <div key={index} className="flex items-center p-3 rounded-lg bg-slate-700">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                    daysToExpiration <= 7 ? "bg-red-500/20" : 
                    daysToExpiration <= 30 ? "bg-yellow-500/20" : "bg-green-500/20"
                  }`}>
                    <span className={`text-sm font-semibold ${
                      daysToExpiration <= 7 ? "text-red-500" : 
                      daysToExpiration <= 30 ? "text-yellow-500" : "text-green-500"
                    }`}>
                      {daysToExpiration}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{option.underlyingSymbol} {option.optionType}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(option.expirationDate).toLocaleDateString('zh-CN')} ({daysToExpiration}天)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-500 font-semibold">
                      ${maxRisk.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">最大风险</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stress Test */}
      <Card className="bg-slate-800 border-gray-700 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">压力测试</CardTitle>
          <div className="text-sm text-gray-400 mt-2">
            基于当前杠杆率 {riskMetrics?.leverageRatio || "0.00"} 和组合Beta {riskMetrics?.portfolioBeta || "0.00"}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stressTests.map((test, index) => {
              const isHighRisk = test.drawdownPercent > 50;
              const isMediumRisk = test.drawdownPercent > 30 && test.drawdownPercent <= 50;

              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  isHighRisk ? 'bg-red-900/20 border-red-500' :
                  isMediumRisk ? 'bg-yellow-900/20 border-yellow-500' :
                  'bg-slate-700 border-slate-600'
                }`}>
                  <div className="text-gray-400 text-sm mb-3">{test.name}</div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">账户回撤</div>
                      <div className={`text-3xl font-bold ${
                        isHighRisk ? 'text-red-500' :
                        isMediumRisk ? 'text-yellow-500' :
                        'text-orange-500'
                      }`}>
                        -{test.drawdownPercent.toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">预计亏损</div>
                      <div className="text-lg font-semibold text-red-400">
                        -${test.loss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-600">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">新杠杆率</span>
                        <span className={`font-semibold ${
                          test.newLeverageRatio >= 3 ? 'text-red-500' :
                          test.newLeverageRatio >= 2 ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {test.newLeverageRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-400">剩余权益</span>
                        <span className="text-white">
                          ${test.newTotalEquity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>高风险警告：账户回撤 &gt; 50%，可能面临强制平仓风险</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>中风险警告：账户回撤 30-50%，建议减仓或对冲</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>低风险：账户回撤 &lt; 30%，处于可承受范围</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
