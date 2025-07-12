export interface RiskThresholds {
  leverageSafe: number;
  leverageWarning: number;
  concentrationLimit: number;
  industryConcentrationLimit: number;
  minCashRatio: number;
}

export interface NotificationSettings {
  leverageAlerts: boolean;
  expirationAlerts: boolean;
  volatilityAlerts: boolean;
}

export interface Suggestion {
  id: string;
  type: "IMMEDIATE" | "OPTION_MANAGEMENT" | "PORTFOLIO_OPTIMIZATION";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  action: string;
  symbol?: string;
  optionSymbol?: string;
  currentConcentration?: string;
  suggestedReduction?: number;
  currentLiquidity?: string;
  targetLiquidity?: string;
  daysToExpiration?: number;
  delta?: string;
}

export interface PortfolioSummary {
  totalEquity: number;
  marketValue: number;
  marginUsed: number;
  cashBalance: number;
  purchasingPower: number;
}

export interface RiskMetrics {
  leverageRatio: number;
  portfolioBeta: number;
  maxConcentration: number;
  marginUsageRatio: number;
  remainingLiquidity: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
  stockValue: number;
  optionMaxLoss: number;
}

export interface StressTestResult {
  scenario: string;
  marketDrop: number;
  portfolioLoss: number;
  newLeverageRatio: number;
}

export interface ConcentrationAnalysis {
  symbol: string;
  name?: string;
  concentration: number;
  value: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
}

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  winningPositions: number;
  losingPositions: number;
}

export interface AlertConfig {
  id: string;
  type: "LEVERAGE" | "CONCENTRATION" | "EXPIRATION" | "MARGIN" | "VOLATILITY";
  threshold: number;
  enabled: boolean;
  message: string;
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  beta?: number;
  lastUpdated: Date;
}
