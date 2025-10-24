/**
 * Settings Wizard - Main Container
 * Multi-step wizard for user investment preferences onboarding
 * Phase 2 - User Preferences System
 */

import { useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Step1InvestmentGoal } from "./Step1InvestmentGoal";
import { Step2RiskTolerance } from "./Step2RiskTolerance";
import { Step3InvestmentHorizon } from "./Step3InvestmentHorizon";
import { Step4RiskThresholds } from "./Step4RiskThresholds";
import { Step5SectorPreferences } from "./Step5SectorPreferences";
import { Step6Confirmation } from "./Step6Confirmation";
import type { UpdatePreferencesPayload } from "@/hooks/use-user-preferences";

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  { en: "Investment Goal", zh: "投资目标" },
  { en: "Risk Tolerance", zh: "风险承受能力" },
  { en: "Investment Horizon", zh: "投资期限" },
  { en: "Risk Thresholds", zh: "风险阈值" },
  { en: "Sector Preferences", zh: "行业偏好" },
  { en: "Confirmation", zh: "确认" },
];

export function SettingsWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { preferences, updatePreferences, isLoading } = useUserPreferences();

  /**
   * Handle step completion with auto-save
   * Updates preferences and moves to next step
   */
  const handleStepComplete = (data: Partial<UpdatePreferencesPayload>) => {
    updatePreferences.mutate(data, {
      onSuccess: () => {
        if (currentStep < TOTAL_STEPS) {
          setCurrentStep(currentStep + 1);
        }
      },
    });
  };

  /**
   * Handle final confirmation
   * Sets onboardingCompleted flag and redirects
   */
  const handleFinalConfirmation = () => {
    updatePreferences.mutate(
      { onboardingCompleted: true },
      {
        onSuccess: () => {
          // Redirect to dashboard after completion
          window.location.href = "/dashboard";
        },
      }
    );
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Navigate to next step (validation handled by step components)
   */
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Jump to specific step (for editing from confirmation page)
   */
  const handleJumpToStep = (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;
  const currentStepTitle = STEP_TITLES[currentStep - 1];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading preferences...</p>
          <p className="text-sm text-muted-foreground">加载偏好设置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investment Preferences Wizard</h1>
        <p className="text-xl text-muted-foreground">投资偏好设置向导</p>
        <p className="text-sm text-muted-foreground mt-2">
          Complete this wizard to personalize your investment experience
        </p>
        <p className="text-sm text-muted-foreground">
          完成此向导以个性化您的投资体验
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Step Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {currentStep}
            </span>
            {currentStepTitle.en}
          </CardTitle>
          <CardDescription>{currentStepTitle.zh}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Investment Goal */}
          {currentStep === 1 && (
            <Step1InvestmentGoal
              currentValue={preferences?.investmentGoal}
              onComplete={handleStepComplete}
              isPending={updatePreferences.isPending}
            />
          )}

          {/* Step 2: Risk Tolerance */}
          {currentStep === 2 && (
            <Step2RiskTolerance
              currentValue={preferences?.riskTolerance}
              onComplete={handleStepComplete}
              isPending={updatePreferences.isPending}
            />
          )}

          {/* Step 3: Investment Horizon */}
          {currentStep === 3 && (
            <Step3InvestmentHorizon
              currentValue={preferences?.investmentHorizon}
              onComplete={handleStepComplete}
              isPending={updatePreferences.isPending}
            />
          )}

          {/* Step 4: Risk Thresholds */}
          {currentStep === 4 && (
            <Step4RiskThresholds
              currentValues={{
                maxLeverageRatio: preferences?.maxLeverageRatio,
                maxConcentrationPct: preferences?.maxConcentrationPct,
                maxSectorConcentrationPct: preferences?.maxSectorConcentrationPct,
                minCashRatio: preferences?.minCashRatio,
                maxMarginUsagePct: preferences?.maxMarginUsagePct,
              }}
              onComplete={handleStepComplete}
              isPending={updatePreferences.isPending}
            />
          )}

          {/* Step 5: Sector Preferences */}
          {currentStep === 5 && (
            <Step5SectorPreferences
              currentValue={preferences?.sectorPreferences}
              onComplete={handleStepComplete}
              isPending={updatePreferences.isPending}
            />
          )}

          {/* Step 6: Confirmation */}
          {currentStep === 6 && (
            <Step6Confirmation
              preferences={preferences}
              onConfirm={handleFinalConfirmation}
              onEdit={handleJumpToStep}
              isPending={updatePreferences.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || updatePreferences.isPending}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back / 上一步
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button
            onClick={handleNext}
            disabled={updatePreferences.isPending}
          >
            Next / 下一步
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinalConfirmation}
            disabled={updatePreferences.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Complete / 完成
          </Button>
        )}
      </div>

      {/* Error Display */}
      {updatePreferences.isError && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive font-medium">
            Error saving preferences / 保存偏好设置时出错
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {updatePreferences.error?.message || "Please try again"}
          </p>
        </div>
      )}
    </div>
  );
}
