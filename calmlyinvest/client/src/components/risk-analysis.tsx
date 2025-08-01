import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, LineChart, BarChart } from "lucide-react";
import type { StockHolding, OptionHolding } from "@shared/schema-types";

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
    
    // Simulate market drops
    const scenarios = [
      { name: "市场下跌10%", drop: 0.1 },
      { name: "市场下跌20%", drop: 0.2 },
      { name: "市场下跌30%", drop: 0.3 }
    ];

    return scenarios.map(scenario => {
      const loss = stockValue * scenario.drop;
      const newLeverageRatio = totalEquity > 0 ? 
        ((stockValue - loss) + parseFloat(riskMetrics?.optionMaxLoss || "0")) / totalEquity : 0;
      
      return {
        ...scenario,
        loss,
        newLeverageRatio
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stressTests.map((test, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-slate-700">
                <div className="text-gray-400 text-sm mb-2">{test.name}</div>
                <div className="text-2xl font-bold text-red-500 mb-1">
                  -${test.loss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-400">
                  杠杆率: {test.newLeverageRatio.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
