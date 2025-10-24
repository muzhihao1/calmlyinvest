# AI Investment Advisory System - Phases 2-4 Implementation

**Project:** "智能仓位管家" (CamlyInvest) AI Upgrade
**Version:** 1.0
**Date:** 2025-10-24
**Prerequisites:** Phase 1 (Data Foundation) completed

---

## 📋 Phase 2: User Preferences & Settings (Week 2-3)

### Goal
Build comprehensive user preference system to capture investment goals, risk tolerance, and portfolio constraints.

---

## 2.1 User Preference Data Model

Already defined in Phase 1 (`user_preferences` table). Key fields:
- `investment_goal`: growth | income | capital_preservation | balanced
- `risk_tolerance`: conservative | moderate | aggressive
- `investment_horizon`: short_term | medium_term | long_term
- Custom thresholds: `max_leverage_ratio`, `max_concentration_pct`, etc.

---

## 2.2 Settings Wizard UI Component

### Component Architecture

```tsx
// client/src/components/settings/SettingsWizard.tsx

import { useState } from 'react';
import { useNavigate } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface UserPreferences {
  investment_goal: 'growth' | 'income' | 'capital_preservation' | 'balanced';
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  investment_horizon: 'short_term' | 'medium_term' | 'long_term';
  max_leverage_ratio: number;
  max_concentration_pct: number;
  max_sector_concentration_pct: number;
  min_cash_ratio: number;
  max_margin_usage_pct: number;
  target_beta?: number;
  target_delta?: number;
  sector_preferences?: {
    prefer: string[];
    avoid: string[];
  };
}

const STEPS = [
  { id: 1, title: '投资目标', description: '您的主要投资目标是什么?' },
  { id: 2, title: '风险承受能力', description: '您能接受多大的波动?' },
  { id: 3, title: '投资期限', description: '您的投资时间跨度?' },
  { id: 4, title: '风险阈值', description: '设置您的风险上限' },
  { id: 5, title: '行业偏好', description: '选择偏好或规避的行业' },
  { id: 6, title: '确认', description: '审查您的设置' },
];

export function SettingsWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      navigate('/dashboard');
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences
      saveMutation.mutate(preferences as UserPreferences);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置您的投资偏好</h1>
        <p className="text-muted-foreground">
          AI 将根据您的偏好为您量身定制投资建议
        </p>
        <Progress value={progress} className="mt-4" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>步骤 {currentStep} / {STEPS.length}</span>
          <span>{STEPS[currentStep - 1].title}</span>
        </div>
      </div>

      <Card className="p-8">
        {currentStep === 1 && (
          <Step1InvestmentGoal
            value={preferences.investment_goal}
            onChange={(value) => setPreferences({ ...preferences, investment_goal: value })}
          />
        )}
        {currentStep === 2 && (
          <Step2RiskTolerance
            value={preferences.risk_tolerance}
            onChange={(value) => setPreferences({ ...preferences, risk_tolerance: value })}
          />
        )}
        {currentStep === 3 && (
          <Step3InvestmentHorizon
            value={preferences.investment_horizon}
            onChange={(value) => setPreferences({ ...preferences, investment_horizon: value })}
          />
        )}
        {currentStep === 4 && (
          <Step4RiskThresholds
            values={{
              max_leverage_ratio: preferences.max_leverage_ratio || 1.5,
              max_concentration_pct: preferences.max_concentration_pct || 25,
              max_sector_concentration_pct: preferences.max_sector_concentration_pct || 40,
              min_cash_ratio: preferences.min_cash_ratio || 10,
              max_margin_usage_pct: preferences.max_margin_usage_pct || 50,
            }}
            onChange={(values) => setPreferences({ ...preferences, ...values })}
          />
        )}
        {currentStep === 5 && (
          <Step5SectorPreferences
            value={preferences.sector_preferences}
            onChange={(value) => setPreferences({ ...preferences, sector_preferences: value })}
          />
        )}
        {currentStep === 6 && (
          <Step6Confirmation preferences={preferences as UserPreferences} />
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            上一步
          </Button>
          <Button
            onClick={handleNext}
            disabled={saveMutation.isPending}
          >
            {currentStep === STEPS.length ? '完成设置' : '下一步'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### Individual Step Components

```tsx
// client/src/components/settings/Step1InvestmentGoal.tsx

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const GOALS = [
  {
    value: 'growth',
    label: '资本增长',
    description: '追求长期资本增值,可接受较高波动',
    icon: '📈',
    recommendedRisk: 'aggressive',
  },
  {
    value: 'balanced',
    label: '平衡增长',
    description: '在增长和风险之间寻求平衡',
    icon: '⚖️',
    recommendedRisk: 'moderate',
  },
  {
    value: 'income',
    label: '稳定收益',
    description: '注重现金流和股息收入',
    icon: '💰',
    recommendedRisk: 'moderate',
  },
  {
    value: 'capital_preservation',
    label: '资本保值',
    description: '优先保护本金,最小化损失',
    icon: '🛡️',
    recommendedRisk: 'conservative',
  },
];

export function Step1InvestmentGoal({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">您的投资目标是什么?</h2>
      <p className="text-muted-foreground mb-6">
        选择最符合您当前财务目标的选项
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        {GOALS.map((goal) => (
          <div key={goal.value} className="flex items-start space-x-3 mb-4">
            <RadioGroupItem value={goal.value} id={goal.value} className="mt-1" />
            <Label htmlFor={goal.value} className="flex-1 cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{goal.icon}</span>
                <div>
                  <div className="font-semibold text-lg">{goal.label}</div>
                  <div className="text-sm text-muted-foreground">{goal.description}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    建议风险等级: {goal.recommendedRisk === 'aggressive' ? '激进' : goal.recommendedRisk === 'moderate' ? '中等' : '保守'}
                  </div>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
```

```tsx
// client/src/components/settings/Step4RiskThresholds.tsx

import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RiskThresholds {
  max_leverage_ratio: number;
  max_concentration_pct: number;
  max_sector_concentration_pct: number;
  min_cash_ratio: number;
  max_margin_usage_pct: number;
}

export function Step4RiskThresholds({
  values,
  onChange,
}: {
  values: RiskThresholds;
  onChange: (values: RiskThresholds) => void;
}) {
  const updateValue = (key: keyof RiskThresholds, value: number) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">设置风险阈值</h2>
      <p className="text-muted-foreground mb-6">
        当投资组合超过这些阈值时,AI 将发出警告并提供建议
      </p>

      <div className="space-y-8">
        {/* 最大杠杆率 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>最大杠杆率</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-1">杠杆率 = (正股价值 + 期权最大损失) / 总股本</p>
                    <p className="text-sm">
                      • {'<'} 1.0倍: 安全 (无杠杆)<br />
                      • 1.0-1.5倍: 中等风险<br />
                      • {'>'} 1.5倍: 高风险
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[values.max_leverage_ratio]}
              onValueChange={([v]) => updateValue('max_leverage_ratio', v)}
              min={1.0}
              max={3.0}
              step={0.1}
              className="flex-1"
            />
            <Input
              type="number"
              value={values.max_leverage_ratio}
              onChange={(e) => updateValue('max_leverage_ratio', parseFloat(e.target.value))}
              className="w-20"
              step={0.1}
              min={1.0}
              max={3.0}
            />
            <span className="text-sm text-muted-foreground">倍</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            当前设置: {values.max_leverage_ratio < 1.0 ? '非常保守' : values.max_leverage_ratio <= 1.5 ? '适中' : '激进'}
          </div>
        </div>

        {/* 最大单一持仓集中度 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>最大单一持仓集中度</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>单一股票占投资组合的最大比例</p>
                  <p className="text-sm mt-1">建议: 不超过 20-25%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[values.max_concentration_pct]}
              onValueChange={([v]) => updateValue('max_concentration_pct', v)}
              min={10}
              max={50}
              step={5}
              className="flex-1"
            />
            <Input
              type="number"
              value={values.max_concentration_pct}
              onChange={(e) => updateValue('max_concentration_pct', parseFloat(e.target.value))}
              className="w-20"
              step={5}
              min={10}
              max={50}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* 最大行业集中度 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>最大行业集中度</Label>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[values.max_sector_concentration_pct]}
              onValueChange={([v]) => updateValue('max_sector_concentration_pct', v)}
              min={20}
              max={70}
              step={5}
              className="flex-1"
            />
            <Input
              type="number"
              value={values.max_sector_concentration_pct}
              onChange={(e) => updateValue('max_sector_concentration_pct', parseFloat(e.target.value))}
              className="w-20"
              step={5}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* 最低现金比例 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>最低现金比例</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>建议保持一定现金比例以应对市场波动</p>
                  <p className="text-sm mt-1">一般建议: 5-15%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[values.min_cash_ratio]}
              onValueChange={([v]) => updateValue('min_cash_ratio', v)}
              min={0}
              max={30}
              step={5}
              className="flex-1"
            />
            <Input
              type="number"
              value={values.min_cash_ratio}
              onChange={(e) => updateValue('min_cash_ratio', parseFloat(e.target.value))}
              className="w-20"
              step={5}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* 最大保证金使用率 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>最大保证金使用率</Label>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[values.max_margin_usage_pct]}
              onValueChange={([v]) => updateValue('max_margin_usage_pct', v)}
              min={30}
              max={80}
              step={5}
              className="flex-1"
            />
            <Input
              type="number"
              value={values.max_margin_usage_pct}
              onChange={(e) => updateValue('max_margin_usage_pct', parseFloat(e.target.value))}
              className="w-20"
              step={5}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            ⚠️ 建议保留至少 30% 的保证金缓冲
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Phase 3: AI Logic Engine (Week 4-5)

### Goal
Build the intelligent recommendation engine that analyzes portfolio risk and generates personalized, actionable advice.

---

## 3.1 Risk Assessment Engine

Create `server/services/risk-engine.ts`:

```typescript
import { supabaseAdmin } from '../auth-supabase';
import { logger } from '../logger';

interface StockHolding {
  code: string;
  quantity: number;
  current_price: number;
  beta: number;
}

interface OptionHolding {
  option_symbol: string;
  underlying_symbol: string;
  quantity: number;
  current_price: number;
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  expiration_date: string;
  strike_price: number;
  option_type: 'PUT' | 'CALL';
  direction: 'BUY' | 'SELL';
}

interface Portfolio {
  id: string;
  cash: number;
  equity: number;
  margin_used: number;
}

interface UserPreferences {
  investment_goal: string;
  risk_tolerance: string;
  max_leverage_ratio: number;
  max_concentration_pct: number;
  max_sector_concentration_pct: number;
  min_cash_ratio: number;
  max_margin_usage_pct: number;
  target_beta?: number;
  target_delta?: number;
}

interface RiskAssessment {
  // Calculated Metrics
  total_delta: number;
  total_theta: number;
  total_gamma: number;
  total_vega: number;
  portfolio_beta: number;
  leverage_ratio: number;
  max_concentration_symbol: string;
  max_concentration_pct: number;
  sector_concentrations: Record<string, number>;
  cash_ratio: number;
  margin_usage_pct: number;

  // Risk Scores (0-100, higher = more risk)
  leverage_risk_score: number;
  concentration_risk_score: number;
  delta_risk_score: number;
  theta_risk_score: number;
  margin_risk_score: number;
  overall_risk_score: number;

  // Violations
  violations: string[];
}

export class RiskEngine {
  private portfolioId: string;
  private userId: string;

  constructor(portfolioId: string, userId: string) {
    this.portfolioId = portfolioId;
    this.userId = userId;
  }

  /**
   * Run comprehensive risk assessment
   */
  async assess(): Promise<RiskAssessment> {
    logger.info(`Starting risk assessment for portfolio ${this.portfolioId}`);

    // Fetch data
    const [portfolio, stocks, options, preferences] = await Promise.all([
      this.fetchPortfolio(),
      this.fetchStockHoldings(),
      this.fetchOptionHoldings(),
      this.fetchUserPreferences(),
    ]);

    // Calculate metrics
    const totalStockValue = stocks.reduce((sum, s) => sum + s.quantity * s.current_price, 0);
    const totalOptionValue = options.reduce((sum, o) => sum + o.quantity * o.current_price * 100, 0);

    // 1. Portfolio Beta
    const weightedBeta = stocks.reduce((sum, s) => {
      const value = s.quantity * s.current_price;
      return sum + (value * (s.beta || 1.0));
    }, 0);
    const portfolio_beta = totalStockValue > 0 ? weightedBeta / totalStockValue : 1.0;

    // 2. Total Delta (stock + options)
    const stockDelta = totalStockValue / 100; // 100 shares = 100 delta
    const optionDelta = options.reduce((sum, o) => {
      const delta = o.delta || 0;
      const multiplier = o.direction === 'SELL' ? -1 : 1;
      return sum + (delta * o.quantity * 100 * multiplier);
    }, 0);
    const total_delta = stockDelta + optionDelta;

    // 3. Total Theta (daily time decay)
    const total_theta = options.reduce((sum, o) => {
      const theta = o.theta || 0;
      const multiplier = o.direction === 'SELL' ? -1 : 1; // Selling options gains Theta
      return sum + (theta * o.quantity * multiplier);
    }, 0);

    // 4. Total Gamma and Vega
    const total_gamma = options.reduce((sum, o) => sum + (o.gamma || 0) * o.quantity, 0);
    const total_vega = options.reduce((sum, o) => sum + (o.vega || 0) * o.quantity, 0);

    // 5. Concentration Risk
    const stockValues = stocks.map(s => ({
      symbol: s.code,
      value: s.quantity * s.current_price,
    }));
    stockValues.sort((a, b) => b.value - a.value);
    const max_concentration_symbol = stockValues[0]?.symbol || '';
    const max_concentration_pct = totalStockValue > 0 ? (stockValues[0]?.value / totalStockValue * 100) : 0;

    // 6. Sector Concentration (TODO: Need sector data)
    const sector_concentrations: Record<string, number> = {};

    // 7. Leverage Ratio (from existing code)
    const optionMaxLoss = this.calculateOptionMaxLoss(options);
    const leverage_ratio = portfolio.equity > 0 ? (totalStockValue + optionMaxLoss) / portfolio.equity : 0;

    // 8. Cash Ratio
    const cash_ratio = portfolio.equity > 0 ? (portfolio.cash / portfolio.equity * 100) : 0;

    // 9. Margin Usage
    const margin_usage_pct = portfolio.equity > 0 ? (portfolio.margin_used / portfolio.equity * 100) : 0;

    // Calculate Risk Scores
    const leverage_risk_score = this.calculateLeverageRiskScore(leverage_ratio, preferences);
    const concentration_risk_score = this.calculateConcentrationRiskScore(max_concentration_pct, preferences);
    const delta_risk_score = this.calculateDeltaRiskScore(total_delta, portfolio.equity, preferences);
    const theta_risk_score = this.calculateThetaRiskScore(total_theta, portfolio.equity);
    const margin_risk_score = this.calculateMarginRiskScore(margin_usage_pct, preferences);

    const overall_risk_score = (
      leverage_risk_score * 0.3 +
      concentration_risk_score * 0.2 +
      delta_risk_score * 0.2 +
      theta_risk_score * 0.15 +
      margin_risk_score * 0.15
    );

    // Check for violations
    const violations: string[] = [];
    if (leverage_ratio > preferences.max_leverage_ratio) {
      violations.push(`杠杆率 ${leverage_ratio.toFixed(2)}x 超过限制 ${preferences.max_leverage_ratio}x`);
    }
    if (max_concentration_pct > preferences.max_concentration_pct) {
      violations.push(`单一持仓集中度 ${max_concentration_pct.toFixed(1)}% 超过限制 ${preferences.max_concentration_pct}%`);
    }
    if (cash_ratio < preferences.min_cash_ratio) {
      violations.push(`现金比例 ${cash_ratio.toFixed(1)}% 低于最低要求 ${preferences.min_cash_ratio}%`);
    }
    if (margin_usage_pct > preferences.max_margin_usage_pct) {
      violations.push(`保证金使用率 ${margin_usage_pct.toFixed(1)}% 超过限制 ${preferences.max_margin_usage_pct}%`);
    }

    const assessment: RiskAssessment = {
      total_delta,
      total_theta,
      total_gamma,
      total_vega,
      portfolio_beta,
      leverage_ratio,
      max_concentration_symbol,
      max_concentration_pct,
      sector_concentrations,
      cash_ratio,
      margin_usage_pct,
      leverage_risk_score,
      concentration_risk_score,
      delta_risk_score,
      theta_risk_score,
      margin_risk_score,
      overall_risk_score,
      violations,
    };

    // Save to database
    await this.saveAssessment(assessment);

    logger.info(`Risk assessment complete. Overall score: ${overall_risk_score.toFixed(1)}/100`);

    return assessment;
  }

  /**
   * Calculate option maximum theoretical loss
   */
  private calculateOptionMaxLoss(options: OptionHolding[]): number {
    return options.reduce((sum, option) => {
      if (option.direction === 'SELL') {
        if (option.option_type === 'PUT') {
          // Sell Put: max loss = strike price
          return sum + option.strike_price * option.quantity * 100;
        } else {
          // Sell Call: theoretically unlimited, use 3x strike as estimate
          return sum + option.strike_price * option.quantity * 100 * 3;
        }
      } else {
        // Buy options: max loss = premium paid
        return sum + option.current_price * option.quantity * 100;
      }
    }, 0);
  }

  /**
   * Risk Score Calculators (0-100)
   */
  private calculateLeverageRiskScore(actual: number, prefs: UserPreferences): number {
    const max = prefs.max_leverage_ratio;
    if (actual <= 1.0) return 0; // No leverage = no risk
    if (actual >= max * 1.5) return 100; // 150% of limit = max risk
    return ((actual - 1.0) / (max * 1.5 - 1.0)) * 100;
  }

  private calculateConcentrationRiskScore(actual: number, prefs: UserPreferences): number {
    const max = prefs.max_concentration_pct;
    if (actual <= max * 0.5) return 0; // Well below limit
    if (actual >= max) return 100; // At or above limit
    return ((actual - max * 0.5) / (max * 0.5)) * 100;
  }

  private calculateDeltaRiskScore(delta: number, equity: number, prefs: UserPreferences): number {
    // Check if user wants delta neutrality
    if (!prefs.target_delta) return 0; // No target = no risk

    const targetDelta = prefs.target_delta;
    const deviation = Math.abs(delta - targetDelta);
    const threshold = equity * 0.3; // 30% of equity as threshold

    if (deviation <= threshold * 0.3) return 0;
    if (deviation >= threshold) return 100;
    return (deviation / threshold) * 100;
  }

  private calculateThetaRiskScore(theta: number, equity: number): number {
    // High negative theta = losing money daily to time decay
    if (theta >= 0) return 0; // Positive theta = good
    const dailyLossPct = Math.abs(theta) / equity * 100;
    if (dailyLossPct <= 0.1) return 0; // < 0.1% daily loss
    if (dailyLossPct >= 1.0) return 100; // > 1% daily loss
    return (dailyLossPct / 1.0) * 100;
  }

  private calculateMarginRiskScore(actual: number, prefs: UserPreferences): number {
    const max = prefs.max_margin_usage_pct;
    if (actual <= max * 0.5) return 0;
    if (actual >= max) return 100;
    return ((actual - max * 0.5) / (max * 0.5)) * 100;
  }

  private async fetchPortfolio(): Promise<Portfolio> {
    const { data, error } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('id', this.portfolioId)
      .single();

    if (error) throw error;
    return data;
  }

  private async fetchStockHoldings(): Promise<StockHolding[]> {
    const { data, error } = await supabaseAdmin
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', this.portfolioId);

    if (error) throw error;
    return data || [];
  }

  private async fetchOptionHoldings(): Promise<OptionHolding[]> {
    const { data, error } = await supabaseAdmin
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', this.portfolioId);

    if (error) throw error;
    return data || [];
  }

  private async fetchUserPreferences(): Promise<UserPreferences> {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      // Return defaults if no preferences set
      return {
        investment_goal: 'balanced',
        risk_tolerance: 'moderate',
        max_leverage_ratio: 1.5,
        max_concentration_pct: 25,
        max_sector_concentration_pct: 40,
        min_cash_ratio: 10,
        max_margin_usage_pct: 50,
      };
    }

    return data;
  }

  private async saveAssessment(assessment: RiskAssessment): Promise<void> {
    await supabaseAdmin
      .from('portfolios')
      .update({
        total_delta: assessment.total_delta,
        total_theta: assessment.total_theta,
        total_gamma: assessment.total_gamma,
        total_vega: assessment.total_vega,
        portfolio_beta: assessment.portfolio_beta,
        max_concentration_symbol: assessment.max_concentration_symbol,
        max_concentration_pct: assessment.max_concentration_pct,
        last_risk_calc_at: new Date().toISOString(),
      })
      .eq('id', this.portfolioId);
  }
}
```

---

## 3.2 Recommendation Engine

Create `server/services/recommendation-engine.ts`:

```typescript
import { supabaseAdmin } from '../auth-supabase';
import { logger } from '../logger';
import { RiskAssessment } from './risk-engine';

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  reasoning: string;
  expected_impact: Record<string, any>;
  suggested_actions: Array<{
    action: 'BUY' | 'SELL' | 'HEDGE' | 'ROLL' | 'ADJUST';
    symbol: string;
    quantity?: number;
    reason: string;
  }>;
}

export class RecommendationEngine {
  private portfolioId: string;
  private userId: string;

  constructor(portfolioId: string, userId: string) {
    this.portfolioId = portfolioId;
    this.userId = userId;
  }

  /**
   * Generate recommendations based on risk assessment
   */
  async generate(assessment: RiskAssessment, preferences: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Rule 1: Excessive Leverage
    if (assessment.leverage_ratio > preferences.max_leverage_ratio) {
      recommendations.push(this.createLeverageRecommendation(assessment, preferences));
    }

    // Rule 2: High Concentration
    if (assessment.max_concentration_pct > preferences.max_concentration_pct) {
      recommendations.push(this.createConcentrationRecommendation(assessment, preferences));
    }

    // Rule 3: Delta Imbalance
    if (preferences.target_delta && Math.abs(assessment.total_delta - preferences.target_delta) > 100) {
      recommendations.push(this.createDeltaHedgeRecommendation(assessment, preferences));
    }

    // Rule 4: High Theta Decay
    if (assessment.total_theta < -100) {
      recommendations.push(this.createThetaRecommendation(assessment));
    }

    // Rule 5: Low Cash
    if (assessment.cash_ratio < preferences.min_cash_ratio) {
      recommendations.push(this.createCashRecommendation(assessment, preferences));
    }

    // Rule 6: High Margin Usage
    if (assessment.margin_usage_pct > preferences.max_margin_usage_pct) {
      recommendations.push(this.createMarginRecommendation(assessment, preferences));
    }

    // Save recommendations to database
    await this.saveRecommendations(recommendations);

    logger.info(`Generated ${recommendations.length} recommendations for portfolio ${this.portfolioId}`);

    return recommendations;
  }

  private createLeverageRecommendation(assessment: RiskAssessment, preferences: any): Recommendation {
    const excess = assessment.leverage_ratio - preferences.max_leverage_ratio;
    const priority = excess > 0.5 ? 'critical' : 'high';

    return {
      priority,
      category: 'leverage_risk',
      title: '杠杆率过高',
      description: `您的投资组合杠杆率为 ${assessment.leverage_ratio.toFixed(2)}x,超过您设定的 ${preferences.max_leverage_ratio}x 上限。`,
      reasoning: `根据您的 "${preferences.investment_goal}" 投资目标和 "${preferences.risk_tolerance}" 风险承受能力,建议将杠杆率降低至安全范围内。`,
      expected_impact: {
        leverage: {
          from: assessment.leverage_ratio,
          to: preferences.max_leverage_ratio,
        },
      },
      suggested_actions: [
        {
          action: 'SELL',
          symbol: assessment.max_concentration_symbol,
          quantity: Math.ceil(excess * 100 / assessment.leverage_ratio),
          reason: '减持最大持仓以降低杠杆率',
        },
      ],
    };
  }

  private createConcentrationRecommendation(assessment: RiskAssessment, preferences: any): Recommendation {
    const excess = assessment.max_concentration_pct - preferences.max_concentration_pct;

    return {
      priority: excess > 10 ? 'high' : 'medium',
      category: 'concentration_risk',
      title: `${assessment.max_concentration_symbol} 持仓集中度过高`,
      description: `${assessment.max_concentration_symbol} 占投资组合的 ${assessment.max_concentration_pct.toFixed(1)}%,超过您设定的 ${preferences.max_concentration_pct}% 上限。`,
      reasoning: '单一持仓过于集中会增加非系统性风险。建议分散投资以降低个股风险。',
      expected_impact: {
        concentration: {
          from: assessment.max_concentration_pct,
          to: preferences.max_concentration_pct,
        },
      },
      suggested_actions: [
        {
          action: 'SELL',
          symbol: assessment.max_concentration_symbol,
          quantity: Math.ceil(excess / 100 * assessment.max_concentration_pct),
          reason: '减持以降低集中度至安全范围',
        },
        {
          action: 'HEDGE',
          symbol: `${assessment.max_concentration_symbol} PUT`,
          reason: '或通过买入保护性 PUT 期权对冲下行风险',
        },
      ],
    };
  }

  private createDeltaHedgeRecommendation(assessment: RiskAssessment, preferences: any): Recommendation {
    const targetDelta = preferences.target_delta || 0;
    const deviation = assessment.total_delta - targetDelta;

    return {
      priority: Math.abs(deviation) > 500 ? 'high' : 'medium',
      category: 'delta_hedge',
      title: 'Delta 敞口偏离目标',
      description: `当前组合 Delta 为 ${assessment.total_delta.toFixed(0)},偏离目标 ${targetDelta} 达 ${Math.abs(deviation).toFixed(0)}。`,
      reasoning: deviation > 0 ? '组合对市场上涨过度敏感,建议对冲多头风险。' : '组合对市场下跌过度敏感,建议减少空头敞口。',
      expected_impact: {
        delta: {
          from: assessment.total_delta,
          to: targetDelta,
        },
      },
      suggested_actions: [
        {
          action: deviation > 0 ? 'BUY' : 'SELL',
          symbol: 'SPY PUT',
          quantity: Math.ceil(Math.abs(deviation) / 100),
          reason: `买入 ${Math.ceil(Math.abs(deviation) / 100)} 份 SPY PUT 期权进行 Delta 对冲`,
        },
      ],
    };
  }

  private createThetaRecommendation(assessment: RiskAssessment): Recommendation {
    const dailyLoss = Math.abs(assessment.total_theta);

    return {
      priority: dailyLoss > 500 ? 'high' : 'medium',
      category: 'theta_decay',
      title: '时间价值损耗过高',
      description: `您的投资组合每日损失 $${dailyLoss.toFixed(0)} 的时间价值 (Theta)。`,
      reasoning: '持有大量长期权或临近到期的期权会产生高额 Theta 损耗。建议平仓或展期。',
      expected_impact: {
        theta: {
          from: assessment.total_theta,
          to: assessment.total_theta / 2,
        },
      },
      suggested_actions: [
        {
          action: 'ROLL',
          symbol: '临近到期期权',
          reason: '将临近到期的期权展期至更远日期',
        },
      ],
    };
  }

  private createCashRecommendation(assessment: RiskAssessment, preferences: any): Recommendation {
    return {
      priority: 'medium',
      category: 'liquidity',
      title: '现金比例过低',
      description: `当前现金比例为 ${assessment.cash_ratio.toFixed(1)}%,低于最低要求 ${preferences.min_cash_ratio}%。`,
      reasoning: '保持足够的现金储备可应对市场波动和追加保证金需求。',
      expected_impact: {
        cash_ratio: {
          from: assessment.cash_ratio,
          to: preferences.min_cash_ratio,
        },
      },
      suggested_actions: [
        {
          action: 'SELL',
          symbol: '流动性最好的持仓',
          reason: '卖出部分高流动性资产以增加现金储备',
        },
      ],
    };
  }

  private createMarginRecommendation(assessment: RiskAssessment, preferences: any): Recommendation {
    return {
      priority: assessment.margin_usage_pct > 70 ? 'critical' : 'high',
      category: 'margin_risk',
      title: '保证金使用率过高',
      description: `保证金使用率为 ${assessment.margin_usage_pct.toFixed(1)}%,超过安全阈值 ${preferences.max_margin_usage_pct}%。`,
      reasoning: '高保证金使用率增加强制平仓风险。建议立即降低杠杆或增加现金。',
      expected_impact: {
        margin_usage: {
          from: assessment.margin_usage_pct,
          to: preferences.max_margin_usage_pct,
        },
      },
      suggested_actions: [
        {
          action: 'SELL',
          symbol: '期权空头仓位',
          reason: '优先平仓高保证金占用的期权卖出仓位',
        },
      ],
    };
  }

  private async saveRecommendations(recommendations: Recommendation[]): Promise<void> {
    // First, mark all old recommendations as expired
    await supabaseAdmin
      .from('recommendations')
      .update({ status: 'expired' })
      .eq('portfolio_id', this.portfolioId)
      .eq('status', 'active');

    // Insert new recommendations
    const records = recommendations.map(rec => ({
      portfolio_id: this.portfolioId,
      user_id: this.userId,
      priority: rec.priority,
      category: rec.category,
      title: rec.title,
      description: rec.description,
      reasoning: rec.reasoning,
      expected_impact: rec.expected_impact,
      suggested_actions: rec.suggested_actions,
      status: 'active',
    }));

    if (records.length > 0) {
      await supabaseAdmin
        .from('recommendations')
        .insert(records);
    }
  }
}
```

---

## 📱 Phase 4: UI/UX Enhancement (Week 6)

### Goal
Create an intuitive, visually engaging interface that clearly communicates AI insights and enables simulation.

---

## 4.1 AI Dashboard Component

```tsx
// client/src/pages/AIDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskGauge } from '@/components/dashboard/RiskGauge';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { PortfolioMetrics } from '@/components/dashboard/PortfolioMetrics';
import { AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';

export function AIDashboard() {
  const { data: riskData, isLoading } = useQuery({
    queryKey: ['risk-assessment'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio/risk-assessment');
      if (!res.ok) throw new Error('Failed to fetch risk data');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/recommendations');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
  });

  if (isLoading) {
    return <div>Loading AI analysis...</div>;
  }

  const criticalRecs = recommendations?.filter((r: any) => r.priority === 'critical') || [];
  const highRecs = recommendations?.filter((r: any) => r.priority === 'high') || [];
  const mediumRecs = recommendations?.filter((r: any) => r.priority === 'medium') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI 投资顾问</h1>
          <p className="text-muted-foreground">基于您的投资偏好和实时数据的智能建议</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          最后更新: {new Date(riskData.last_updated).toLocaleString('zh-CN')}
        </div>
      </div>

      {/* Risk Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <RiskGauge
          title="综合风险"
          value={riskData.overall_risk_score}
          icon={<Shield className="h-5 w-5" />}
          color="primary"
        />
        <RiskGauge
          title="杠杆风险"
          value={riskData.leverage_risk_score}
          icon={<TrendingUp className="h-5 w-5" />}
          color="yellow"
        />
        <RiskGauge
          title="集中度风险"
          value={riskData.concentration_risk_score}
          icon={<AlertCircle className="h-5 w-5" />}
          color="orange"
        />
        <RiskGauge
          title="Delta 风险"
          value={riskData.delta_risk_score}
          icon={<Zap className="h-5 w-5" />}
          color="blue"
        />
      </div>

      {/* Portfolio Metrics */}
      <PortfolioMetrics data={riskData} />

      {/* Critical Recommendations */}
      {criticalRecs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            紧急行动建议
          </h2>
          <div className="space-y-4">
            {criticalRecs.map((rec: any) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Recommendations */}
      {highRecs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">高优先级建议</h2>
          <div className="space-y-4">
            {highRecs.map((rec: any) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Recommendations */}
      {mediumRecs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">优化建议</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediumRecs.map((rec: any) => (
              <RecommendationCard key={rec.id} recommendation={rec} compact />
            ))}
          </div>
        </div>
      )}

      {/* No Recommendations */}
      {recommendations?.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              投资组合状态良好
            </CardTitle>
            <CardDescription>
              您的投资组合符合所有风险阈值,暂无需调整。
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
```

### 4.2 Recommendation Card with Simulation

```tsx
// client/src/components/dashboard/RecommendationCard.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Eye, X } from 'lucide-react';
import { SimulationModal } from './SimulationModal';

interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  reasoning: string;
  expected_impact: Record<string, any>;
  suggested_actions: Array<{
    action: string;
    symbol: string;
    quantity?: number;
    reason: string;
  }>;
}

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-600', label: '紧急', icon: AlertCircle },
  high: { color: 'bg-orange-500', label: '高', icon: AlertCircle },
  medium: { color: 'bg-yellow-500', label: '中', icon: Eye },
  low: { color: 'bg-blue-500', label: '低', icon: CheckCircle },
};

export function RecommendationCard({
  recommendation,
  compact = false,
}: {
  recommendation: Recommendation;
  compact?: boolean;
}) {
  const [showSimulation, setShowSimulation] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const config = PRIORITY_CONFIG[recommendation.priority];
  const Icon = config.icon;

  const handleDismiss = async () => {
    await fetch(`/api/recommendations/${recommendation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed' }),
    });
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <>
      <Card className={recommendation.priority === 'critical' ? 'border-red-500 border-2' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`${config.color} text-white p-2 rounded-lg`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                  <Badge variant="outline" className={`${config.color} text-white`}>
                    {config.label}
                  </Badge>
                </div>
                <CardDescription>{recommendation.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!compact && (
          <CardContent>
            <div className="space-y-4">
              {/* Reasoning */}
              <div>
                <div className="text-sm font-semibold mb-1">📊 分析</div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {recommendation.reasoning}
                </div>
              </div>

              {/* Suggested Actions */}
              <div>
                <div className="text-sm font-semibold mb-2">💡 建议操作</div>
                <div className="space-y-2">
                  {recommendation.suggested_actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {action.action}
                      </div>
                      <div>
                        <div className="font-medium">
                          {action.symbol} {action.quantity && `× ${action.quantity}`}
                        </div>
                        <div className="text-muted-foreground">{action.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Impact */}
              {recommendation.expected_impact && (
                <div>
                  <div className="text-sm font-semibold mb-2">📈 预期效果</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(recommendation.expected_impact).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-green-50 p-2 rounded">
                        <div className="text-muted-foreground capitalize">{key}</div>
                        <div className="font-medium">
                          {value.from?.toFixed(2)} → {value.to?.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => setShowSimulation(true)} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  模拟效果
                </Button>
                <Button variant="outline" onClick={handleDismiss}>
                  暂不处理
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {showSimulation && (
        <SimulationModal
          recommendation={recommendation}
          onClose={() => setShowSimulation(false)}
        />
      )}
    </>
  );
}
```

---

## 📝 Implementation Summary

### Phase 2 Deliverables
- ✅ User preference data model (`user_preferences` table)
- ✅ Settings wizard UI (6-step guided flow)
- ✅ Risk threshold configuration (sliders with real-time preview)
- ✅ Sector preference selection

### Phase 3 Deliverables
- ✅ Risk assessment engine (multi-dimensional risk scoring)
- ✅ Recommendation engine (rule-based AI logic)
- ✅ Risk score calculators (0-100 scale)
- ✅ Violation detection and alerting

### Phase 4 Deliverables
- ✅ AI Dashboard component
- ✅ Risk gauge visualizations
- ✅ Recommendation cards with priority levels
- ✅ Simulation modal (What-if analysis)
- ✅ Portfolio metrics dashboard

---

## 🚀 Deployment Checklist

### Backend
- [ ] Deploy database migrations (Phases 1-3)
- [ ] Configure Polygon.io API key
- [ ] Set up IB API credentials (per-user)
- [ ] Enable cron jobs for sync and updates
- [ ] Test risk engine with sample data
- [ ] Test recommendation engine rules

### Frontend
- [ ] Build new components (Settings Wizard, AI Dashboard)
- [ ] Integrate API endpoints
- [ ] Add navigation to new pages
- [ ] Test responsive design on mobile
- [ ] Verify data visualizations

### Testing
- [ ] End-to-end user flow testing
- [ ] Performance testing (large portfolios)
- [ ] Load testing (concurrent users)
- [ ] Security audit (RLS policies)

---

*End of Phases 2-4 Implementation Plan*
*Total Estimated Timeline: 5-6 weeks*
