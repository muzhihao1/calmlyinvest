import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { format } from "date-fns";

interface PortfolioChartsProps {
  stockHoldings: any[];
  optionHoldings: any[];
  riskMetrics: any;
  portfolio: any;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function PortfolioCharts({ stockHoldings, optionHoldings, riskMetrics, portfolio }: PortfolioChartsProps) {
  // Calculate portfolio composition data
  const compositionData = [
    ...stockHoldings.map((holding) => ({
      name: holding.symbol,
      value: parseFloat(holding.currentPrice || holding.costPrice) * holding.quantity,
      type: "股票",
    })),
    ...optionHoldings.map((holding) => ({
      name: holding.underlyingSymbol,
      value: parseFloat(holding.currentPrice || holding.costPrice) * holding.contracts * 100,
      type: "期权",
    })),
  ];

  // Calculate asset type distribution
  const stockValue = stockHoldings.reduce(
    (sum, h) => sum + parseFloat(h.currentPrice || h.costPrice) * h.quantity,
    0
  );
  const optionValue = optionHoldings.reduce(
    (sum, h) => sum + parseFloat(h.currentPrice || h.costPrice) * h.contracts * 100,
    0
  );
  const cashValue = parseFloat(portfolio?.cashBalance || "0");

  const assetDistribution = [
    { name: "股票", value: stockValue, percentage: ((stockValue / (stockValue + optionValue + cashValue)) * 100).toFixed(1) },
    { name: "期权", value: optionValue, percentage: ((optionValue / (stockValue + optionValue + cashValue)) * 100).toFixed(1) },
    { name: "现金", value: cashValue, percentage: ((cashValue / (stockValue + optionValue + cashValue)) * 100).toFixed(1) },
  ];

  // Risk level data for radar chart
  const riskRadarData = [
    {
      metric: "杠杆率",
      value: Math.min((parseFloat(riskMetrics?.leverageRatio || "0") / 2) * 100, 100),
      actualValue: parseFloat(riskMetrics?.leverageRatio || "0").toFixed(2),
      fullMark: 100,
    },
    {
      metric: "集中度",
      value: Math.min(parseFloat(riskMetrics?.maxConcentration || "0"), 100),
      actualValue: `${parseFloat(riskMetrics?.maxConcentration || "0").toFixed(1)}%`,
      fullMark: 100,
    },
    {
      metric: "保证金使用",
      value: Math.min(parseFloat(riskMetrics?.marginUsageRatio || "0"), 100),
      actualValue: `${parseFloat(riskMetrics?.marginUsageRatio || "0").toFixed(1)}%`,
      fullMark: 100,
    },
    {
      metric: "流动性",
      value: Math.max(100 - parseFloat(riskMetrics?.excessLiquidityRatio || "100"), 0),
      actualValue: `${parseFloat(riskMetrics?.excessLiquidityRatio || "0").toFixed(1)}%`,
      fullMark: 100,
    },
    {
      metric: "Beta系数",
      value: Math.min((parseFloat(riskMetrics?.portfolioBeta || "0") / 2) * 100, 100),
      actualValue: parseFloat(riskMetrics?.portfolioBeta || "0").toFixed(2),
      fullMark: 100,
    },
  ];

  // Mock historical data for trend chart
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: format(date, "MM/dd"),
      杠杆率: (parseFloat(riskMetrics?.leverageRatio || "1") + (Math.random() - 0.5) * 0.2).toFixed(2),
      总资产: (parseFloat(portfolio?.totalEquity || "0") + (Math.random() - 0.5) * 5000).toFixed(0),
    };
  });

  // Top holdings data
  const topHoldings = [...compositionData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((h) => ({
      ...h,
      percentage: ((h.value / (stockValue + optionValue)) * 100).toFixed(1),
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === "总资产" ? `$${parseFloat(entry.value).toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>投资组合分析</CardTitle>
        <CardDescription>可视化展示您的投资组合构成和风险指标</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="composition" className="space-y-4">
          <TabsList>
            <TabsTrigger value="composition">资产构成</TabsTrigger>
            <TabsTrigger value="trend">历史趋势</TabsTrigger>
            <TabsTrigger value="risk">风险雷达</TabsTrigger>
            <TabsTrigger value="holdings">持仓分析</TabsTrigger>
          </TabsList>

          <TabsContent value="composition" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">资产类型分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetDistribution.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetDistribution.filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {assetDistribution.filter(item => item.value > 0).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          {item.name}
                        </span>
                        <span className="font-medium">${parseFloat(String(item.value)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">持仓分布</CardTitle>
                </CardHeader>
                <CardContent>
                  {compositionData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={compositionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name }) => name}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {compositionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                            contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
                        {compositionData.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              {item.name}
                            </span>
                            <span className="text-muted-foreground">${parseFloat(String(item.value)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      暂无持仓数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">杠杆率与总资产趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="杠杆率"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444" }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="总资产"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">风险指标雷达图</CardTitle>
                <CardDescription>各项风险指标的综合评估（0-100分）</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={riskRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="风险值"
                      dataKey="value"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.metric}</p>
                              <p className="text-sm text-muted-foreground">
                                实际值: {data.actualValue}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                风险评分: {data.value.toFixed(0)}/100
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holdings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">前5大持仓</CardTitle>
              </CardHeader>
              <CardContent>
                {topHoldings.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topHoldings}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, '市值']}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {topHoldings.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {topHoldings.map((holding, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {holding.name} ({holding.type})
                          </span>
                          <span className="font-medium">{holding.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    暂无持仓数据
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}