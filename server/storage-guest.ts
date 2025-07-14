import type { 
  Portfolio, 
  StockHolding, 
  OptionHolding, 
  RiskSettings,
  RiskMetrics,
  RiskHistory,
  InsertPortfolio,
  InsertStockHolding,
  InsertOptionHolding,
  InsertRiskSettings
} from "@shared/schema-types";

// Demo data for guest users
const DEMO_PORTFOLIO: Portfolio = {
  id: "demo-portfolio-1",
  userId: "guest-user",
  name: "示例投资组合",
  totalEquity: "1000000.00",
  cashBalance: "200000.00",
  marginUsed: "0.00",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Using let to allow modifications for guest users
let DEMO_STOCK_HOLDINGS: StockHolding[] = [
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

// Using let to allow modifications for guest users
let DEMO_OPTION_HOLDINGS: OptionHolding[] = [
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

const DEMO_RISK_SETTINGS: RiskSettings = {
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

export const guestStorage = {
  // Portfolio methods
  async getPortfolios(userId: string): Promise<Portfolio[]> {
    return userId === "guest-user" ? [DEMO_PORTFOLIO] : [];
  },

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return id === "demo-portfolio-1" ? DEMO_PORTFOLIO : undefined;
  },

  async createPortfolio(data: InsertPortfolio): Promise<Portfolio> {
    throw new Error("Guest users cannot create portfolios");
  },

  async updatePortfolio(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    throw new Error("Guest users cannot update portfolios");
  },

  async deletePortfolio(id: string): Promise<void> {
    throw new Error("Guest users cannot delete portfolios");
  },

  // Stock holdings methods
  async getStockHoldings(portfolioId: string): Promise<StockHolding[]> {
    return portfolioId === "demo-portfolio-1" ? DEMO_STOCK_HOLDINGS : [];
  },

  async createStockHolding(data: InsertStockHolding): Promise<StockHolding> {
    // Allow guest users to create stock holdings in memory
    const newHolding: StockHolding = {
      id: `demo-stock-${Date.now()}`,
      portfolioId: data.portfolioId,
      symbol: data.symbol,
      name: data.name || data.symbol,
      quantity: data.quantity,
      costPrice: data.costPrice,
      currentPrice: data.currentPrice || data.costPrice,
      beta: data.beta || "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    DEMO_STOCK_HOLDINGS.push(newHolding);
    return newHolding;
  },

  async updateStockHolding(id: string, data: Partial<StockHolding>): Promise<StockHolding> {
    const holding = DEMO_STOCK_HOLDINGS.find(h => h.id === id);
    if (holding) {
      // Allow updating current price for demo
      return { ...holding, ...data };
    }
    throw new Error("Stock holding not found");
  },

  async deleteStockHolding(id: string): Promise<void> {
    // Allow guest users to delete stock holdings from memory
    const index = DEMO_STOCK_HOLDINGS.findIndex(h => h.id === id);
    if (index !== -1) {
      DEMO_STOCK_HOLDINGS.splice(index, 1);
      return;
    }
    throw new Error("Stock holding not found");
  },

  // Option holdings methods
  async getOptionHoldings(portfolioId: string): Promise<OptionHolding[]> {
    return portfolioId === "demo-portfolio-1" ? DEMO_OPTION_HOLDINGS : [];
  },

  async createOptionHolding(data: InsertOptionHolding): Promise<OptionHolding> {
    // Allow guest users to create option holdings in memory
    const newHolding: OptionHolding = {
      id: `demo-option-${Date.now()}`,
      portfolioId: data.portfolioId,
      optionSymbol: data.optionSymbol,
      underlyingSymbol: data.underlyingSymbol,
      optionType: data.optionType,
      direction: data.direction,
      contracts: data.contracts,
      strikePrice: data.strikePrice,
      expirationDate: data.expirationDate,
      costPrice: data.costPrice,
      currentPrice: data.currentPrice || data.costPrice,
      deltaValue: data.deltaValue || "0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    DEMO_OPTION_HOLDINGS.push(newHolding);
    return newHolding;
  },

  async updateOptionHolding(id: string, data: Partial<OptionHolding>): Promise<OptionHolding> {
    const holding = DEMO_OPTION_HOLDINGS.find(h => h.id === id);
    if (holding) {
      // Allow updating current price for demo
      return { ...holding, ...data };
    }
    throw new Error("Option holding not found");
  },

  async deleteOptionHolding(id: string): Promise<void> {
    // Allow guest users to delete option holdings from memory
    const index = DEMO_OPTION_HOLDINGS.findIndex(h => h.id === id);
    if (index !== -1) {
      DEMO_OPTION_HOLDINGS.splice(index, 1);
      return;
    }
    throw new Error("Option holding not found");
  },

  // Risk settings methods
  async getRiskSettings(userId: string): Promise<RiskSettings | undefined> {
    return userId === "guest-user" ? DEMO_RISK_SETTINGS : undefined;
  },

  async updateRiskSettings(userId: string, data: InsertRiskSettings): Promise<RiskSettings> {
    throw new Error("Guest users cannot update risk settings");
  },

  // Risk metrics methods
  async createRiskMetrics(data: any): Promise<RiskMetrics> {
    // Return mock metrics for demo
    return {
      id: "demo-metrics-1",
      portfolioId: data.portfolioId,
      leverageRatio: data.leverageRatio,
      portfolioBeta: data.portfolioBeta,
      maxConcentration: data.maxConcentration,
      marginUsageRatio: data.marginUsageRatio,
      riskLevel: data.riskLevel,
      calculatedAt: new Date().toISOString(),
    };
  },

  async getRiskHistory(portfolioId: string, days: number = 30): Promise<RiskHistory[]> {
    // Return empty history for demo
    return [];
  },
};