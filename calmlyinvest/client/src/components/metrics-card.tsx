import { Info, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricsCardProps {
  title: string;
  value: string;
  description: string;
  type: "success" | "warning" | "danger";
  tooltip?: string;
}

export function MetricsCard({ title, value, description, type, tooltip }: MetricsCardProps) {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          valueColor: "text-green-500",
          descriptionColor: "text-green-400",
          icon: <TrendingUp className="h-4 w-4" />
        };
      case "warning":
        return {
          valueColor: "text-yellow-500",
          descriptionColor: "text-yellow-400",
          icon: <AlertTriangle className="h-4 w-4" />
        };
      case "danger":
        return {
          valueColor: "text-red-500",
          descriptionColor: "text-red-400",
          icon: <TrendingDown className="h-4 w-4" />
        };
      default:
        return {
          valueColor: "text-gray-400",
          descriptionColor: "text-gray-400",
          icon: <Info className="h-4 w-4" />
        };
    }
  };

  const styles = getTypeStyles(type);

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <div className={`text-3xl font-bold ${styles.valueColor} mb-2`}>
        {value}
      </div>
      
      <div className={`flex items-center ${styles.descriptionColor}`}>
        {styles.icon}
        <span className="text-sm ml-1">{description}</span>
      </div>
    </div>
  );
}
