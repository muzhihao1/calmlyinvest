/**
 * Step 4: Risk Thresholds Configuration
 * User configures risk limits using sliders
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UpdatePreferencesPayload } from "@/hooks/use-user-preferences";

interface Step4Props {
  currentValues: {
    maxLeverageRatio?: string;
    maxConcentrationPct?: string;
    maxSectorConcentrationPct?: string;
    minCashRatio?: string;
    maxMarginUsagePct?: string;
  };
  onComplete: (data: Partial<UpdatePreferencesPayload>) => void;
  isPending: boolean;
}

interface ThresholdConfig {
  key: keyof UpdatePreferencesPayload;
  label: string;
  labelZh: string;
  description: string;
  descriptionZh: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue: (value: number) => string;
  unit: string;
}

const THRESHOLDS: ThresholdConfig[] = [
  {
    key: 'maxLeverageRatio',
    label: 'Max Leverage Ratio',
    labelZh: '最大杠杆率',
    description: 'Maximum allowed portfolio leverage',
    descriptionZh: '投资组合允许的最大杠杆倍数',
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 1.5,
    formatValue: (val) => val.toFixed(1),
    unit: 'x',
  },
  {
    key: 'maxConcentrationPct',
    label: 'Max Position Concentration',
    labelZh: '最大单一持仓占比',
    description: 'Maximum percentage for a single position',
    descriptionZh: '单一持仓占投资组合的最大比例',
    min: 5,
    max: 50,
    step: 5,
    defaultValue: 25,
    formatValue: (val) => val.toFixed(0),
    unit: '%',
  },
  {
    key: 'maxSectorConcentrationPct',
    label: 'Max Sector Concentration',
    labelZh: '最大行业集中度',
    description: 'Maximum percentage for a single sector',
    descriptionZh: '单一行业占投资组合的最大比例',
    min: 10,
    max: 60,
    step: 5,
    defaultValue: 40,
    formatValue: (val) => val.toFixed(0),
    unit: '%',
  },
  {
    key: 'minCashRatio',
    label: 'Minimum Cash Reserve',
    labelZh: '最低现金储备',
    description: 'Minimum cash percentage to maintain',
    descriptionZh: '保持的最低现金比例',
    min: 0,
    max: 30,
    step: 5,
    defaultValue: 10,
    formatValue: (val) => val.toFixed(0),
    unit: '%',
  },
  {
    key: 'maxMarginUsagePct',
    label: 'Max Margin Usage',
    labelZh: '最大融资使用率',
    description: 'Maximum margin usage percentage',
    descriptionZh: '最大融资额度使用比例',
    min: 0,
    max: 100,
    step: 10,
    defaultValue: 50,
    formatValue: (val) => val.toFixed(0),
    unit: '%',
  },
];

export function Step4RiskThresholds({ currentValues, onComplete, isPending }: Step4Props) {
  const [values, setValues] = useState<Record<string, number>>({
    maxLeverageRatio: parseFloat(currentValues.maxLeverageRatio || '1.5'),
    maxConcentrationPct: parseFloat(currentValues.maxConcentrationPct || '25'),
    maxSectorConcentrationPct: parseFloat(currentValues.maxSectorConcentrationPct || '40'),
    minCashRatio: parseFloat(currentValues.minCashRatio || '10'),
    maxMarginUsagePct: parseFloat(currentValues.maxMarginUsagePct || '50'),
  });

  const handleSliderChange = (key: string, newValue: number[]) => {
    setValues(prev => ({
      ...prev,
      [key]: newValue[0],
    }));
  };

  const handleSubmit = () => {
    onComplete({
      maxLeverageRatio: values.maxLeverageRatio.toString(),
      maxConcentrationPct: values.maxConcentrationPct.toString(),
      maxSectorConcentrationPct: values.maxSectorConcentrationPct.toString(),
      minCashRatio: values.minCashRatio.toString(),
      maxMarginUsagePct: values.maxMarginUsagePct.toString(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          Configure Your Risk Thresholds
        </h3>
        <p className="text-sm text-muted-foreground">
          配置您的风险阈值参数
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          These limits help protect your portfolio from excessive risk
        </p>
        <p className="text-sm text-muted-foreground">
          这些限制有助于保护您的投资组合免受过度风险
        </p>
      </div>

      <div className="space-y-8">
        {THRESHOLDS.map((threshold) => {
          const currentValue = values[threshold.key] || threshold.defaultValue;

          return (
            <Card key={threshold.key} className="p-4">
              <div className="space-y-4">
                {/* Label and Tooltip */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">
                        {threshold.label}
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">{threshold.description}</p>
                            <p className="text-sm mt-1">{threshold.descriptionZh}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {threshold.labelZh}
                    </p>
                  </div>

                  {/* Current Value Display */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {threshold.formatValue(currentValue)}{threshold.unit}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current / 当前值
                    </p>
                  </div>
                </div>

                {/* Slider */}
                <div className="px-2">
                  <Slider
                    value={[currentValue]}
                    onValueChange={(newVal) => handleSliderChange(threshold.key, newVal)}
                    min={threshold.min}
                    max={threshold.max}
                    step={threshold.step}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{threshold.formatValue(threshold.min)}{threshold.unit}</span>
                    <span>{threshold.formatValue(threshold.max)}{threshold.unit}</span>
                  </div>
                </div>

                {/* Recommendation Badge */}
                {currentValue === threshold.defaultValue && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      ✓ Recommended default / 推荐默认值
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-muted/50">
        <h4 className="text-sm font-medium mb-2">Summary / 总结</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {THRESHOLDS.map((threshold) => (
            <div key={threshold.key} className="flex justify-between">
              <span className="text-muted-foreground">{threshold.labelZh}:</span>
              <span className="font-medium">
                {threshold.formatValue(values[threshold.key] || threshold.defaultValue)}
                {threshold.unit}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Saving... / 保存中...' : 'Continue / 继续'}
        </Button>
      </div>
    </div>
  );
}
