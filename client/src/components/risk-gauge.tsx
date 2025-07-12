interface RiskGaugeProps {
  leverageRatio: number;
  riskLevel: string;
}

export function RiskGauge({ leverageRatio, riskLevel }: RiskGaugeProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "GREEN": return "text-green-500";
      case "YELLOW": return "text-yellow-500";
      case "RED": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getRiskMessage = (level: string) => {
    switch (level) {
      case "GREEN": return "风险可控";
      case "YELLOW": return "需要关注";
      case "RED": return "高风险警告";
      default: return "未知状态";
    }
  };

  const getRiskDescription = (level: string) => {
    switch (level) {
      case "GREEN": return "当前风险水平安全，可以继续投资";
      case "YELLOW": return "风险水平适中，建议谨慎操作";
      case "RED": return "建议立即减仓以降低风险";
      default: return "";
    }
  };

  // Calculate the gauge fill percentage (0-100%)
  const maxRatio = 2.0; // Max display ratio
  const fillPercentage = Math.min((leverageRatio / maxRatio) * 100, 100);
  
  // Calculate stroke-dasharray for the gauge fill
  const circumference = 2 * Math.PI * 80; // radius = 80
  const strokeDasharray = `${(fillPercentage / 100) * circumference * 0.75} ${circumference}`; // 0.75 for 270 degree arc

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-center">杠杆率风险仪表盘</h3>
      
      {/* Risk Gauge */}
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg width="192" height="192" className="transform -rotate-[135deg]">
          {/* Background Arc */}
          <path
            d="M 96 168 A 72 72 0 1 1 168 96"
            fill="none"
            stroke="#374151"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Gauge Fill */}
          <path
            d="M 96 168 A 72 72 0 1 1 168 96"
            fill="none"
            stroke={riskLevel === "RED" ? "#ef4444" : riskLevel === "YELLOW" ? "#f59e0b" : "#10b981"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        
        {/* Center Value Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-3xl font-bold ${getRiskColor(riskLevel)}`}>
            {leverageRatio.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">当前杠杆率</div>
        </div>
      </div>
      
      {/* Risk Status Indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full border ${
          riskLevel === "RED" 
            ? "bg-red-500/20 border-red-500 animate-pulse" 
            : riskLevel === "YELLOW"
            ? "bg-yellow-500/20 border-yellow-500"
            : "bg-green-500/20 border-green-500"
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            riskLevel === "RED" ? "bg-red-500" : riskLevel === "YELLOW" ? "bg-yellow-500" : "bg-green-500"
          }`} />
          <span className={`font-semibold ${getRiskColor(riskLevel)}`}>
            {getRiskMessage(riskLevel)}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {getRiskDescription(riskLevel)}
        </p>
      </div>

      {/* Risk Thresholds */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>安全区间</span>
          <span>&lt; 1.0</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>警告区间</span>
          <span>1.0 - 1.5</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>危险区间</span>
          <span>≥ 1.5</span>
        </div>
      </div>
    </div>
  );
}
