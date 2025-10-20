import type { Portfolio, StockHolding, OptionHolding, RiskSettings } from "@shared/schema-supabase";

export const DEMO_PORTFOLIO: Portfolio = {
  id: "demo-portfolio-1",
  userId: "guest-user",
  name: "示例投资组合",
  totalEquity: "1000000.00",
  cashBalance: "200000.00",
  marginUsed: "0.00",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_STOCK_HOLDINGS: StockHolding[] = [
  {
    id: "demo-stock-1",
    portfolioId: "demo-portfolio-1",
    symbol: "000001.SZ",
    name: "平安银行",
    quantity: 5000,
    costPrice: "12.50",
    currentPrice: "13.20",
    beta: "1.15",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-stock-2",
    portfolioId: "demo-portfolio-1",
    symbol: "600036.SH",
    name: "招商银行",
    quantity: 3000,
    costPrice: "38.00",
    currentPrice: "36.50",
    beta: "0.95",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-stock-3",
    portfolioId: "demo-portfolio-1",
    symbol: "000002.SZ",
    name: "万科A",
    quantity: 8000,
    costPrice: "15.20",
    currentPrice: "16.80",
    beta: "1.25",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_OPTION_HOLDINGS: OptionHolding[] = [
  {
    id: "demo-option-1",
    portfolioId: "demo-portfolio-1",
    optionSymbol: "510050C2403M04500",
    underlyingSymbol: "510050.SH",
    optionType: "CALL",
    direction: "SELL",
    contracts: 5,
    strikePrice: "4.50",
    expirationDate: new Date("2024-03-27").toISOString(),
    costPrice: "0.1200",
    currentPrice: "0.0800",
    deltaValue: "-0.3500",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-option-2",
    portfolioId: "demo-portfolio-1",
    optionSymbol: "510300P2404M04200",
    underlyingSymbol: "510300.SH",
    optionType: "PUT",
    direction: "BUY",
    contracts: 10,
    strikePrice: "4.20",
    expirationDate: new Date("2024-04-24").toISOString(),
    costPrice: "0.0500",
    currentPrice: "0.0650",
    deltaValue: "-0.2500",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_RISK_SETTINGS: RiskSettings = {
  id: "demo-settings-1",
  userId: "guest-user",
  leverageSafeThreshold: "1.0",
  leverageWarningThreshold: "1.5",
  concentrationLimit: "20.0",
  industryConcentrationLimit: "60.0",
  minCashRatio: "30.0",
  leverageAlerts: true,
  expirationAlerts: true,
  volatilityAlerts: false,
  dataUpdateFrequency: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_RISK_METRICS = {
  leverageRatio: "0.8500",
  portfolioBeta: "1.1200",
  maxConcentration: "18.50",
  marginUsageRatio: "0.00",
  riskLevel: "GREEN",
  stockValue: "450000.00",
  optionMaxLoss: "50000.00",
  totalEquity: "1000000.00",
  remainingLiquidity: "100.00"
};

export const DEMO_SUGGESTIONS = [
  {
    type: "PORTFOLIO_OPTIMIZATION",
    priority: "MEDIUM",
    title: "增加现金储备",
    description: "当前现金比例为20%，建议增加至30%以提高流动性缓冲。",
    action: "INCREASE_CASH",
    currentLiquidity: "20.0",
    targetLiquidity: "30.0"
  },
  {
    type: "OPTION_MANAGEMENT",
    priority: "HIGH",
    title: "期权即将到期",
    description: "510050C2403M04500将在30天内到期，建议考虑滚动操作或平仓。",
    action: "ROLLOVER_OPTION",
    optionSymbol: "510050C2403M04500",
    daysToExpiration: 30,
    delta: "-0.3500"
  }
];