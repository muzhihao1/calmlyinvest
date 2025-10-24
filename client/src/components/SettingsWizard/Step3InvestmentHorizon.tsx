/**
 * Step 3: Investment Horizon Selection
 * User selects their investment timeframe
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import type { UpdatePreferencesPayload } from "@/hooks/use-user-preferences";

interface Step3Props {
  currentValue?: 'short_term' | 'medium_term' | 'long_term';
  onComplete: (data: Partial<UpdatePreferencesPayload>) => void;
  isPending: boolean;
}

const TIME_HORIZONS = [
  {
    value: 'short_term' as const,
    label: 'Short Term / 短期',
    timeframe: '< 1 year / 少于1年',
    description: 'Need funds soon, focus on liquidity and capital preservation',
    descriptionZh: '短期需要资金，注重流动性和资本保护',
    icon: '⚡',
    suitableFor: [
      'Emergency fund / 应急资金',
      'Near-term expenses / 近期支出',
      'High liquidity needs / 高流动性需求',
    ],
  },
  {
    value: 'medium_term' as const,
    label: 'Medium Term / 中期',
    timeframe: '1-5 years / 1-5年',
    description: 'Balanced approach with moderate growth potential',
    descriptionZh: '平衡策略，适度增长潜力',
    icon: '📅',
    suitableFor: [
      'Home down payment / 购房首付',
      'Education funding / 教育资金',
      'Major purchases / 大额购买',
    ],
  },
  {
    value: 'long_term' as const,
    label: 'Long Term / 长期',
    timeframe: '> 5 years / 超过5年',
    description: 'Maximize growth potential, can weather market volatility',
    descriptionZh: '最大化增长潜力，可承受市场波动',
    icon: '🎯',
    suitableFor: [
      'Retirement planning / 退休规划',
      'Wealth accumulation / 财富积累',
      'Generational wealth / 代际财富',
    ],
  },
];

export function Step3InvestmentHorizon({ currentValue, onComplete, isPending }: Step3Props) {
  const [selectedHorizon, setSelectedHorizon] = useState<string>(currentValue || 'medium_term');

  const handleSubmit = () => {
    onComplete({
      investmentHorizon: selectedHorizon as 'short_term' | 'medium_term' | 'long_term',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          What is your investment time horizon?
        </h3>
        <p className="text-sm text-muted-foreground">
          您的投资时间跨度是多久？
        </p>
      </div>

      <RadioGroup
        value={selectedHorizon}
        onValueChange={setSelectedHorizon}
        className="space-y-4"
      >
        {TIME_HORIZONS.map((horizon) => (
          <div
            key={horizon.value}
            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
              selectedHorizon === horizon.value
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => setSelectedHorizon(horizon.value)}
          >
            <RadioGroupItem value={horizon.value} id={horizon.value} className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor={horizon.value}
                className="flex items-center gap-2 text-base font-medium cursor-pointer"
              >
                <span className="text-2xl">{horizon.icon}</span>
                {horizon.label}
              </Label>
              <p className="text-sm font-medium text-primary mt-1">
                {horizon.timeframe}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {horizon.description}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {horizon.descriptionZh}
              </p>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Suitable for / 适用于:</p>
                <ul className="space-y-1">
                  {horizon.suitableFor.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="text-primary">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>

      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedHorizon}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Saving... / 保存中...' : 'Continue / 继续'}
        </Button>
      </div>
    </div>
  );
}
