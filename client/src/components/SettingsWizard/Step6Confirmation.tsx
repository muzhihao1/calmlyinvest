/**
 * Step 6: Confirmation and Summary
 * User reviews all preferences before final confirmation
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit2, Check, Target, TrendingUp, Clock, Sliders, Building2 } from "lucide-react";
import type { UserPreferences } from "@/hooks/use-user-preferences";

interface Step6Props {
  preferences?: UserPreferences;
  onConfirm: () => void;
  onEdit: (step: number) => void;
  isPending: boolean;
}

const INVESTMENT_GOAL_LABELS: Record<string, { en: string; zh: string; icon: string }> = {
  growth: { en: 'Growth', zh: '增长', icon: '📈' },
  income: { en: 'Income', zh: '收益', icon: '💰' },
  capital_preservation: { en: 'Capital Preservation', zh: '资本保值', icon: '🛡️' },
  balanced: { en: 'Balanced', zh: '平衡', icon: '⚖️' },
};

const RISK_TOLERANCE_LABELS: Record<string, { en: string; zh: string; icon: string }> = {
  conservative: { en: 'Conservative', zh: '保守型', icon: '🐢' },
  moderate: { en: 'Moderate', zh: '稳健型', icon: '🚶' },
  aggressive: { en: 'Aggressive', zh: '激进型', icon: '🚀' },
};

const HORIZON_LABELS: Record<string, { en: string; zh: string; icon: string }> = {
  short_term: { en: 'Short Term (<1y)', zh: '短期（<1年）', icon: '⚡' },
  medium_term: { en: 'Medium Term (1-5y)', zh: '中期（1-5年）', icon: '📅' },
  long_term: { en: 'Long Term (>5y)', zh: '长期（>5年）', icon: '🎯' },
};

const SECTOR_NAMES: Record<string, { en: string; zh: string; icon: string }> = {
  technology: { en: 'Technology', zh: '科技', icon: '💻' },
  healthcare: { en: 'Healthcare', zh: '医疗', icon: '🏥' },
  financials: { en: 'Financials', zh: '金融', icon: '🏦' },
  consumer_discretionary: { en: 'Consumer Discretionary', zh: '非必需消费', icon: '🛍️' },
  consumer_staples: { en: 'Consumer Staples', zh: '必需消费', icon: '🛒' },
  energy: { en: 'Energy', zh: '能源', icon: '⚡' },
  industrials: { en: 'Industrials', zh: '工业', icon: '🏭' },
  materials: { en: 'Materials', zh: '原材料', icon: '⛏️' },
  real_estate: { en: 'Real Estate', zh: '房地产', icon: '🏢' },
  utilities: { en: 'Utilities', zh: '公用事业', icon: '💡' },
  telecommunications: { en: 'Telecommunications', zh: '电信', icon: '📡' },
  transportation: { en: 'Transportation', zh: '交通运输', icon: '🚚' },
};

export function Step6Confirmation({ preferences, onConfirm, onEdit, isPending }: Step6Props) {
  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  const goalInfo = INVESTMENT_GOAL_LABELS[preferences.investmentGoal] || { en: 'Unknown', zh: '未知', icon: '❓' };
  const riskInfo = RISK_TOLERANCE_LABELS[preferences.riskTolerance] || { en: 'Unknown', zh: '未知', icon: '❓' };
  const horizonInfo = HORIZON_LABELS[preferences.investmentHorizon] || { en: 'Unknown', zh: '未知', icon: '❓' };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          Review Your Preferences
        </h3>
        <p className="text-sm text-muted-foreground">
          检查您的偏好设置
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Please review your settings before completing the wizard
        </p>
        <p className="text-sm text-muted-foreground">
          在完成向导之前请检查您的设置
        </p>
      </div>

      {/* Core Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Investment Goal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Investment Goal
            </CardTitle>
            <CardDescription>投资目标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{goalInfo.icon}</span>
                <div>
                  <p className="font-medium">{goalInfo.en}</p>
                  <p className="text-sm text-muted-foreground">{goalInfo.zh}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(1)}
                disabled={isPending}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Risk Tolerance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Risk Tolerance
            </CardTitle>
            <CardDescription>风险承受能力</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{riskInfo.icon}</span>
                <div>
                  <p className="font-medium">{riskInfo.en}</p>
                  <p className="text-sm text-muted-foreground">{riskInfo.zh}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(2)}
                disabled={isPending}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Investment Horizon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Horizon
            </CardTitle>
            <CardDescription>投资期限</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{horizonInfo.icon}</span>
                <div>
                  <p className="font-medium">{horizonInfo.en}</p>
                  <p className="text-sm text-muted-foreground">{horizonInfo.zh}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(3)}
                disabled={isPending}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Thresholds */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Risk Thresholds
              </CardTitle>
              <CardDescription>风险阈值参数</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(4)}
              disabled={isPending}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Max Leverage / 最大杠杆</p>
              <p className="text-lg font-bold">{parseFloat(preferences.maxLeverageRatio).toFixed(1)}x</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Position / 最大持仓</p>
              <p className="text-lg font-bold">{parseFloat(preferences.maxConcentrationPct).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Sector / 最大行业</p>
              <p className="text-lg font-bold">{parseFloat(preferences.maxSectorConcentrationPct).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Min Cash / 最低现金</p>
              <p className="text-lg font-bold">{parseFloat(preferences.minCashRatio).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Margin / 最大融资</p>
              <p className="text-lg font-bold">{parseFloat(preferences.maxMarginUsagePct).toFixed(0)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sector Preferences
              </CardTitle>
              <CardDescription>行业偏好</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(5)}
              disabled={isPending}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preferred Sectors */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Preferred / 偏好 ({preferences.sectorPreferences.prefer.length})
            </p>
            {preferences.sectorPreferences.prefer.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferences.sectorPreferences.prefer.map(sectorId => {
                  const sector = SECTOR_NAMES[sectorId] || { en: sectorId, zh: sectorId, icon: '📊' };
                  return (
                    <Badge key={sectorId} variant="default" className="gap-1">
                      <span>{sector.icon}</span>
                      <span>{sector.zh}</span>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No preferences selected / 未选择偏好</p>
            )}
          </div>

          {/* Avoided Sectors */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Avoided / 避免 ({preferences.sectorPreferences.avoid.length})
            </p>
            {preferences.sectorPreferences.avoid.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferences.sectorPreferences.avoid.map(sectorId => {
                  const sector = SECTOR_NAMES[sectorId] || { en: sectorId, zh: sectorId, icon: '📊' };
                  return (
                    <Badge key={sectorId} variant="destructive" className="gap-1">
                      <span>{sector.icon}</span>
                      <span>{sector.zh}</span>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No sectors avoided / 未避免行业</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Confirmation Actions */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Check className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <h4 className="font-medium mb-1">Ready to Complete</h4>
            <p className="text-sm text-muted-foreground">
              完成设置
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              By clicking "Complete", your preferences will be saved and you'll be redirected to the dashboard.
            </p>
            <p className="text-sm text-muted-foreground">
              点击"完成"后，您的偏好设置将被保存，您将被重定向到仪表板。
            </p>
          </div>
        </div>

        <Button
          onClick={onConfirm}
          disabled={isPending}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
              Completing... / 完成中...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Complete Setup / 完成设置
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
