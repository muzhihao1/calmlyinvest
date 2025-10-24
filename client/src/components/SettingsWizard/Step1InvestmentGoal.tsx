/**
 * Step 1: Investment Goal Selection
 * User selects their primary investment objective
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import type { UpdatePreferencesPayload } from "@/hooks/use-user-preferences";

interface Step1Props {
  currentValue?: 'growth' | 'income' | 'capital_preservation' | 'balanced';
  onComplete: (data: Partial<UpdatePreferencesPayload>) => void;
  isPending: boolean;
}

const INVESTMENT_GOALS = [
  {
    value: 'growth' as const,
    label: 'Growth / 增长',
    description: 'Focus on capital appreciation through aggressive investments',
    descriptionZh: '通过激进投资专注于资本增值',
    icon: '📈',
  },
  {
    value: 'income' as const,
    label: 'Income / 收益',
    description: 'Generate regular income through dividends and interest',
    descriptionZh: '通过股息和利息产生稳定收益',
    icon: '💰',
  },
  {
    value: 'capital_preservation' as const,
    label: 'Capital Preservation / 资本保值',
    description: 'Protect principal with conservative, low-risk investments',
    descriptionZh: '通过保守、低风险投资保护本金',
    icon: '🛡️',
  },
  {
    value: 'balanced' as const,
    label: 'Balanced / 平衡',
    description: 'Mix of growth and income with moderate risk',
    descriptionZh: '增长与收益兼顾，风险适中',
    icon: '⚖️',
  },
];

export function Step1InvestmentGoal({ currentValue, onComplete, isPending }: Step1Props) {
  const [selectedGoal, setSelectedGoal] = useState<string>(currentValue || 'balanced');

  const handleSubmit = () => {
    onComplete({
      investmentGoal: selectedGoal as 'growth' | 'income' | 'capital_preservation' | 'balanced',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          What is your primary investment goal?
        </h3>
        <p className="text-sm text-muted-foreground">
          您的主要投资目标是什么？
        </p>
      </div>

      <RadioGroup
        value={selectedGoal}
        onValueChange={setSelectedGoal}
        className="space-y-4"
      >
        {INVESTMENT_GOALS.map((goal) => (
          <div
            key={goal.value}
            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
              selectedGoal === goal.value
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => setSelectedGoal(goal.value)}
          >
            <RadioGroupItem value={goal.value} id={goal.value} className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor={goal.value}
                className="flex items-center gap-2 text-base font-medium cursor-pointer"
              >
                <span className="text-2xl">{goal.icon}</span>
                {goal.label}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {goal.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {goal.descriptionZh}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>

      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedGoal}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Saving... / 保存中...' : 'Continue / 继续'}
        </Button>
      </div>
    </div>
  );
}
