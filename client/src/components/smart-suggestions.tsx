import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Settings, PieChart, Lightbulb } from "lucide-react";

export interface Suggestion {
  type: string;
  priority: string;
  title: string;
  description: string;
  action: string;
  [key: string]: any;
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  summary?: string;
}

export function SmartSuggestions({ suggestions, isLoading, summary }: SmartSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">正在生成智能建议...</p>
        </div>
      </div>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "MEDIUM":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="destructive">高优先级</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">中优先级</Badge>;
      default:
        return <Badge variant="outline">低优先级</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "IMMEDIATE":
        return <AlertTriangle className="h-5 w-5" />;
      case "OPTION_MANAGEMENT":
        return <Settings className="h-5 w-5" />;
      case "PORTFOLIO_OPTIMIZATION":
        return <PieChart className="h-5 w-5" />;
      default:
        return <TrendingDown className="h-5 w-5" />;
    }
  };

  const getCardClass = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/10 border-red-500/30";
      case "MEDIUM":
        return "bg-yellow-500/10 border-yellow-500/30";
      default:
        return "bg-slate-700 border-gray-600";
    }
  };

  const immediateActions = suggestions.filter(s => s.type === "IMMEDIATE");
  const optionManagement = suggestions.filter(s => s.type === "OPTION_MANAGEMENT");
  const portfolioOptimization = suggestions.filter(s => s.type === "PORTFOLIO_OPTIMIZATION");

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-800 rounded-xl p-8 border border-gray-700">
          <div className="text-green-500 mb-4">
            <Lightbulb className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">风险状况良好</h3>
          <p className="text-gray-400">
            当前投资组合风险处于可控范围内，暂无需要立即处理的风险问题。
          </p>
          <p className="text-sm text-gray-500 mt-2">
            我们会持续监控您的投资组合，一旦发现潜在风险会及时提醒。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {summary && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              AI投资顾问总结
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-base leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Immediate Actions */}
      {immediateActions.length > 0 && (
        <Card className="bg-slate-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              立即行动建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {immediateActions.map((suggestion, index) => (
                <div key={index} className={`flex items-start p-4 rounded-lg border ${getCardClass(suggestion.priority)}`}>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-4 mt-1">
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{suggestion.title}</h4>
                      {getPriorityBadge(suggestion.priority)}
                    </div>
                    <p className="text-gray-300 mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      {suggestion.currentConcentration && (
                        <span className="text-sm text-gray-400">
                          预期效果：集中度降至 {(parseFloat(suggestion.currentConcentration) - 8).toFixed(1)}%
                        </span>
                      )}
                      {suggestion.currentLiquidity && (
                        <span className="text-sm text-gray-400">
                          目标：将剩余流动性提升至 {suggestion.targetLiquidity}%
                        </span>
                      )}
                      <Button 
                        className={suggestion.priority === "HIGH" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"}
                        size="sm"
                      >
                        {suggestion.action === "REDUCE_POSITION" ? "查看减仓方案" : "查看详细建议"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options Management */}
      {optionManagement.length > 0 && (
        <Card className="bg-slate-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Settings className="mr-2 h-5 w-5" />
              期权管理建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optionManagement.map((suggestion, index) => (
                <div key={index} className="flex items-start p-4 rounded-lg bg-slate-700 border border-gray-600">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-4 mt-1">
                    <Settings className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{suggestion.title}</h4>
                      {getPriorityBadge(suggestion.priority)}
                    </div>
                    <p className="text-gray-300 mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        监控触发：距离到期{suggestion.daysToExpiration}天或Delta达到阈值
                      </span>
                      <Button variant="outline" size="sm">
                        设置提醒
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Optimization */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <PieChart className="mr-2 h-5 w-5" />
            投资组合优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-700 border border-gray-600">
              <h4 className="font-semibold text-white mb-2">行业分散化</h4>
              <p className="text-gray-300 text-sm mb-3">当前科技股占比过高，建议增加其他行业配置。</p>
              <div className="text-sm text-gray-400">
                <div>科技股: 72.5%</div>
                <div>建议: &lt;60%</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700 border border-gray-600">
              <h4 className="font-semibold text-white mb-2">Beta对冲</h4>
              <p className="text-gray-300 text-sm mb-3">投资组合Beta过高，可考虑买入指数看跌期权对冲。</p>
              <div className="text-sm text-gray-400">
                <div>目标Beta: 1.0-1.2</div>
                <div>对冲建议: 买入SPY Put</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
