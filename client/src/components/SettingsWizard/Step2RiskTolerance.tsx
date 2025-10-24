/**
 * Step 2: Risk Tolerance Selection
 * User selects their risk appetite level
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import type { UpdatePreferencesPayload } from "@/hooks/use-user-preferences";

interface Step2Props {
  currentValue?: 'conservative' | 'moderate' | 'aggressive';
  onComplete: (data: Partial<UpdatePreferencesPayload>) => void;
  isPending: boolean;
}

const RISK_LEVELS = [
  {
    value: 'conservative' as const,
    label: 'Conservative / 保守型',
    description: 'Minimize risk, accept lower returns for stability',
    descriptionZh: '最小化风险，接受较低回报以换取稳定',
    icon: '🐢',
    characteristics: [
      'Low volatility / 低波动性',
      'Capital protection focus / 注重资本保护',
      'Prefer bonds and stable stocks / 偏好债券和稳定股票',
    ],
  },
  {
    value: 'moderate' as const,
    label: 'Moderate / 稳健型',
    description: 'Balance risk and return with diversified portfolio',
    descriptionZh: '通过多元化投资组合平衡风险和回报',
    icon: '🚶',
    characteristics: [
      'Moderate volatility / 中等波动性',
      'Balanced approach / 平衡策略',
      'Mix of stocks and bonds / 股票债券混合',
    ],
  },
  {
    value: 'aggressive' as const,
    label: 'Aggressive / 激进型',
    description: 'Seek high returns, willing to accept higher volatility',
    descriptionZh: '追求高回报，愿意接受较高波动',
    icon: '🚀',
    characteristics: [
      'High volatility / 高波动性',
      'Growth-focused / 专注增长',
      'Higher stock allocation / 更高股票配置',
    ],
  },
];

export function Step2RiskTolerance({ currentValue, onComplete, isPending }: Step2Props) {
  const [selectedRisk, setSelectedRisk] = useState<string>(currentValue || 'moderate');

  const handleSubmit = () => {
    onComplete({
      riskTolerance: selectedRisk as 'conservative' | 'moderate' | 'aggressive',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          What is your risk tolerance level?
        </h3>
        <p className="text-sm text-muted-foreground">
          您的风险承受能力是多少？
        </p>
      </div>

      <RadioGroup
        value={selectedRisk}
        onValueChange={setSelectedRisk}
        className="space-y-4"
      >
        {RISK_LEVELS.map((risk) => (
          <div
            key={risk.value}
            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
              selectedRisk === risk.value
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => setSelectedRisk(risk.value)}
          >
            <RadioGroupItem value={risk.value} id={risk.value} className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor={risk.value}
                className="flex items-center gap-2 text-base font-medium cursor-pointer"
              >
                <span className="text-2xl">{risk.icon}</span>
                {risk.label}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {risk.description}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {risk.descriptionZh}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {risk.characteristics.map((char, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="text-primary">•</span>
                    {char}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </RadioGroup>

      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedRisk}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Saving... / 保存中...' : 'Continue / 继续'}
        </Button>
      </div>
    </div>
  );
}
