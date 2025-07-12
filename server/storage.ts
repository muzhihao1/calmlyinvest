import { 
  users, 
  portfolios, 
  stockHoldings, 
  optionHoldings, 
  riskMetrics, 
  riskSettings,
  type User, 
  type InsertUser, 
  type Portfolio, 
  type InsertPortfolio,
  type StockHolding,
  type InsertStockHolding,
  type OptionHolding,
  type InsertOptionHolding,
  type RiskMetrics,
  type RiskSettings,
  type InsertRiskSettings
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolio operations
  getPortfolios(userId: number): Promise<Portfolio[]>;
  getPortfolio(id: number): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: number, updates: Partial<Portfolio>): Promise<Portfolio | undefined>;

  // Stock holdings operations
  getStockHoldings(portfolioId: number): Promise<StockHolding[]>;
  createStockHolding(holding: InsertStockHolding): Promise<StockHolding>;
  updateStockHolding(id: number, updates: Partial<StockHolding>): Promise<StockHolding | undefined>;
  deleteStockHolding(id: number): Promise<boolean>;

  // Option holdings operations
  getOptionHoldings(portfolioId: number): Promise<OptionHolding[]>;
  createOptionHolding(holding: InsertOptionHolding): Promise<OptionHolding>;
  updateOptionHolding(id: number, updates: Partial<OptionHolding>): Promise<OptionHolding | undefined>;
  deleteOptionHolding(id: number): Promise<boolean>;

  // Risk metrics operations
  getRiskMetrics(portfolioId: number): Promise<RiskMetrics | undefined>;
  createRiskMetrics(metrics: Omit<RiskMetrics, 'id' | 'calculatedAt'>): Promise<RiskMetrics>;

  // Risk settings operations
  getRiskSettings(userId: number): Promise<RiskSettings | undefined>;
  updateRiskSettings(userId: number, settings: InsertRiskSettings): Promise<RiskSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<number, Portfolio>;
  private stockHoldings: Map<number, StockHolding>;
  private optionHoldings: Map<number, OptionHolding>;
  private riskMetrics: Map<number, RiskMetrics>;
  private riskSettings: Map<number, RiskSettings>;
  
  private currentUserId: number;
  private currentPortfolioId: number;
  private currentStockHoldingId: number;
  private currentOptionHoldingId: number;
  private currentRiskMetricsId: number;
  private currentRiskSettingsId: number;

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.stockHoldings = new Map();
    this.optionHoldings = new Map();
    this.riskMetrics = new Map();
    this.riskSettings = new Map();
    
    this.currentUserId = 1;
    this.currentPortfolioId = 1;
    this.currentStockHoldingId = 1;
    this.currentOptionHoldingId = 1;
    this.currentRiskMetricsId = 1;
    this.currentRiskSettingsId = 1;

    this.initializeTestData();
  }

  private initializeTestData() {
    // Create test user
    const testUser: User = {
      id: 1,
      username: "test_user",
      password: "$2a$10$Yk4Z5kKBxCQhJk4F7qQE1OEMXoYLXzQbXVLfVd/qKy9xW5v2c3nLy" // password123 hashed
    };
    this.users.set(1, testUser);
    
    // Create your account with plain password (temporary for Vercel deployment)
    const yourAccount: User = {
      id: 2,
      username: "279838958@qq.com",
      password: "muzhihao12" // Plain password for now
    };
    this.users.set(2, yourAccount);

    // Create test portfolio
    const testPortfolio: Portfolio = {
      id: 1,
      userId: 1,
      name: "Main Portfolio",
      totalEquity: "44337.96",
      cashBalance: "14387.18",
      marginUsed: "40580.97",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.portfolios.set(1, testPortfolio);

    // Create test stock holdings
    const stockHoldings: StockHolding[] = [
      {
        id: 1,
        portfolioId: 1,
        symbol: "AMZN",
        name: "Amazon.com Inc",
        quantity: 30,
        costPrice: "222.31",
        currentPrice: "225.02",
        beta: "1.33",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        portfolioId: 1,
        symbol: "CRWD",
        name: "CrowdStrike Holdings",
        quantity: 10,
        costPrice: "487.11",
        currentPrice: "478.45",
        beta: "1.16",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        portfolioId: 1,
        symbol: "PLTR",
        name: "Palantir Technologies",
        quantity: 38,
        costPrice: "143.05",
        currentPrice: "142.10",
        beta: "2.64",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        portfolioId: 1,
        symbol: "SHOP",
        name: "Shopify Inc",
        quantity: 32,
        costPrice: "115.16",
        currentPrice: "112.11",
        beta: "2.63",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        portfolioId: 1,
        symbol: "TSLA",
        name: "Tesla Inc",
        quantity: 40,
        costPrice: "309.87",
        currentPrice: "313.51",
        beta: "2.46",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    stockHoldings.forEach(holding => {
      this.stockHoldings.set(holding.id, holding);
    });

    // Create test option holdings
    const optionHoldings: OptionHolding[] = [
      {
        id: 1,
        portfolioId: 1,
        optionSymbol: "MSFT 250718P500",
        underlyingSymbol: "MSFT",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "500.00",
        expirationDate: "2025-07-18",
        costPrice: "3.31",
        currentPrice: "2.52",
        deltaValue: "-0.349",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        portfolioId: 1,
        optionSymbol: "NVDA 250822P165",
        underlyingSymbol: "NVDA",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "165.00",
        expirationDate: "2025-08-22",
        costPrice: "7.96",
        currentPrice: "7.55",
        deltaValue: "-0.465",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        portfolioId: 1,
        optionSymbol: "NVDA 250919P170",
        underlyingSymbol: "NVDA",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "170.00",
        expirationDate: "2025-09-19",
        costPrice: "14.09",
        currentPrice: "13.62",
        deltaValue: "-0.522",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        portfolioId: 1,
        optionSymbol: "QQQ 250725P555",
        underlyingSymbol: "QQQ",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "555.00",
        expirationDate: "2025-07-25",
        costPrice: "6.13",
        currentPrice: "6.60",
        deltaValue: "-0.495",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    optionHoldings.forEach(holding => {
      this.optionHoldings.set(holding.id, holding);
    });

    // Create default risk settings
    const defaultSettings: RiskSettings = {
      id: 1,
      userId: 1,
      leverageSafeThreshold: "1.0",
      leverageWarningThreshold: "1.5",
      concentrationLimit: "20.0",
      industryConcentrationLimit: "60.0",
      minCashRatio: "30.0",
      leverageAlerts: true,
      expirationAlerts: true,
      volatilityAlerts: false,
      dataUpdateFrequency: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.riskSettings.set(1, defaultSettings);
    
    // Create portfolio for your account
    const yourPortfolio: Portfolio = {
      id: 2,
      userId: 2,
      name: "Main Portfolio",
      totalEquity: "44337.96",
      cashBalance: "14387.18",
      marginUsed: "40580.97",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.portfolios.set(2, yourPortfolio);
    
    // Copy all stock holdings to your portfolio
    const yourStockHoldings: StockHolding[] = [
      {
        id: 6,
        portfolioId: 2,
        symbol: "AMZN",
        name: "Amazon.com Inc",
        quantity: 30,
        costPrice: "222.31",
        currentPrice: "225.02",
        beta: "1.33",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        portfolioId: 2,
        symbol: "CRWD",
        name: "CrowdStrike Holdings",
        quantity: 10,
        costPrice: "487.11",
        currentPrice: "478.45",
        beta: "1.16",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        portfolioId: 2,
        symbol: "PLTR",
        name: "Palantir Technologies",
        quantity: 38,
        costPrice: "143.05",
        currentPrice: "142.10",
        beta: "2.64",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 9,
        portfolioId: 2,
        symbol: "SHOP",
        name: "Shopify Inc",
        quantity: 32,
        costPrice: "115.16",
        currentPrice: "112.11",
        beta: "2.63",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 10,
        portfolioId: 2,
        symbol: "TSLA",
        name: "Tesla Inc",
        quantity: 40,
        costPrice: "309.87",
        currentPrice: "313.51",
        beta: "2.46",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    yourStockHoldings.forEach(holding => {
      this.stockHoldings.set(holding.id, holding);
    });
    
    // Copy all option holdings to your portfolio
    const yourOptionHoldings: OptionHolding[] = [
      {
        id: 5,
        portfolioId: 2,
        optionSymbol: "MSFT 250718P500",
        underlyingSymbol: "MSFT",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "500.00",
        expirationDate: "2025-07-18",
        costPrice: "3.31",
        currentPrice: "2.52",
        deltaValue: "-0.349",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        portfolioId: 2,
        optionSymbol: "NVDA 250822P165",
        underlyingSymbol: "NVDA",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "165.00",
        expirationDate: "2025-08-22",
        costPrice: "7.96",
        currentPrice: "7.55",
        deltaValue: "-0.465",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        portfolioId: 2,
        optionSymbol: "NVDA 250919P170",
        underlyingSymbol: "NVDA",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "170.00",
        expirationDate: "2025-09-19",
        costPrice: "14.09",
        currentPrice: "13.62",
        deltaValue: "-0.522",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        portfolioId: 2,
        optionSymbol: "QQQ 250725P555",
        underlyingSymbol: "QQQ",
        optionType: "PUT",
        direction: "SELL",
        contracts: -1,
        strikePrice: "555.00",
        expirationDate: "2025-07-25",
        costPrice: "6.13",
        currentPrice: "6.60",
        deltaValue: "-0.495",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    yourOptionHoldings.forEach(holding => {
      this.optionHoldings.set(holding.id, holding);
    });
    
    // Create risk settings for your account
    const yourRiskSettings: RiskSettings = {
      id: 2,
      userId: 2,
      leverageSafeThreshold: "1.0",
      leverageWarningThreshold: "1.5",
      concentrationLimit: "20.0",
      industryConcentrationLimit: "60.0",
      minCashRatio: "30.0",
      leverageAlerts: true,
      expirationAlerts: true,
      volatilityAlerts: false,
      dataUpdateFrequency: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.riskSettings.set(2, yourRiskSettings);

    this.currentUserId = 3;
    this.currentPortfolioId = 3;
    this.currentStockHoldingId = 11;
    this.currentOptionHoldingId = 9;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPortfolios(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      portfolio => portfolio.userId === userId
    );
  }

  async getPortfolio(id: number): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.currentPortfolioId++;
    const newPortfolio: Portfolio = {
      id,
      name: portfolio.name,
      userId: portfolio.userId ?? null,
      totalEquity: portfolio.totalEquity ?? null,
      cashBalance: portfolio.cashBalance ?? null,
      marginUsed: portfolio.marginUsed ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.portfolios.set(id, newPortfolio);
    return newPortfolio;
  }

  async updatePortfolio(id: number, updates: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;
    
    const updatedPortfolio = { ...portfolio, ...updates, updatedAt: new Date() };
    this.portfolios.set(id, updatedPortfolio);
    return updatedPortfolio;
  }

  async getStockHoldings(portfolioId: number): Promise<StockHolding[]> {
    return Array.from(this.stockHoldings.values()).filter(
      holding => holding.portfolioId === portfolioId
    );
  }

  async createStockHolding(holding: InsertStockHolding): Promise<StockHolding> {
    const id = this.currentStockHoldingId++;
    const newHolding: StockHolding = {
      id,
      symbol: holding.symbol,
      name: holding.name ?? null,
      quantity: holding.quantity,
      costPrice: holding.costPrice,
      currentPrice: holding.currentPrice ?? null,
      beta: holding.beta ?? null,
      portfolioId: holding.portfolioId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stockHoldings.set(id, newHolding);
    return newHolding;
  }

  async updateStockHolding(id: number, updates: Partial<StockHolding>): Promise<StockHolding | undefined> {
    const holding = this.stockHoldings.get(id);
    if (!holding) return undefined;
    
    const updatedHolding = { ...holding, ...updates, updatedAt: new Date() };
    this.stockHoldings.set(id, updatedHolding);
    return updatedHolding;
  }

  async deleteStockHolding(id: number): Promise<boolean> {
    return this.stockHoldings.delete(id);
  }

  async getOptionHoldings(portfolioId: number): Promise<OptionHolding[]> {
    return Array.from(this.optionHoldings.values()).filter(
      holding => holding.portfolioId === portfolioId
    );
  }

  async createOptionHolding(holding: InsertOptionHolding): Promise<OptionHolding> {
    const id = this.currentOptionHoldingId++;
    const newHolding: OptionHolding = {
      id,
      optionSymbol: holding.optionSymbol,
      underlyingSymbol: holding.underlyingSymbol,
      optionType: holding.optionType,
      direction: holding.direction,
      contracts: holding.contracts,
      strikePrice: holding.strikePrice,
      expirationDate: holding.expirationDate,
      costPrice: holding.costPrice,
      currentPrice: holding.currentPrice ?? null,
      deltaValue: holding.deltaValue ?? null,
      portfolioId: holding.portfolioId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.optionHoldings.set(id, newHolding);
    return newHolding;
  }

  async updateOptionHolding(id: number, updates: Partial<OptionHolding>): Promise<OptionHolding | undefined> {
    const holding = this.optionHoldings.get(id);
    if (!holding) return undefined;
    
    const updatedHolding = { ...holding, ...updates, updatedAt: new Date() };
    this.optionHoldings.set(id, updatedHolding);
    return updatedHolding;
  }

  async deleteOptionHolding(id: number): Promise<boolean> {
    return this.optionHoldings.delete(id);
  }

  async getRiskMetrics(portfolioId: number): Promise<RiskMetrics | undefined> {
    return Array.from(this.riskMetrics.values()).find(
      metrics => metrics.portfolioId === portfolioId
    );
  }

  async createRiskMetrics(metrics: Omit<RiskMetrics, 'id' | 'calculatedAt'>): Promise<RiskMetrics> {
    const id = this.currentRiskMetricsId++;
    const newMetrics: RiskMetrics = {
      ...metrics,
      id,
      calculatedAt: new Date()
    };
    this.riskMetrics.set(id, newMetrics);
    return newMetrics;
  }

  async getRiskSettings(userId: number): Promise<RiskSettings | undefined> {
    return Array.from(this.riskSettings.values()).find(
      settings => settings.userId === userId
    );
  }

  async updateRiskSettings(userId: number, settings: InsertRiskSettings): Promise<RiskSettings> {
    const existing = await this.getRiskSettings(userId);
    if (existing) {
      const updated = { ...existing, ...settings, updatedAt: new Date() };
      this.riskSettings.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentRiskSettingsId++;
      const newSettings: RiskSettings = {
        id,
        userId: settings.userId ?? userId,
        leverageSafeThreshold: settings.leverageSafeThreshold ?? "1.0",
        leverageWarningThreshold: settings.leverageWarningThreshold ?? "1.5",
        concentrationLimit: settings.concentrationLimit ?? "20.0",
        industryConcentrationLimit: settings.industryConcentrationLimit ?? "60.0",
        minCashRatio: settings.minCashRatio ?? "30.0",
        leverageAlerts: settings.leverageAlerts ?? true,
        expirationAlerts: settings.expirationAlerts ?? true,
        volatilityAlerts: settings.volatilityAlerts ?? false,
        dataUpdateFrequency: settings.dataUpdateFrequency ?? 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.riskSettings.set(id, newSettings);
      return newSettings;
    }
  }
}

import { DbStorage } from './db-storage';

// 根据环境变量选择存储方式
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log('Using database storage');
    return new DbStorage(process.env.DATABASE_URL);
  } else {
    console.log('Using memory storage (development mode)');
    return new MemStorage();
  }
}

export const storage = createStorage();
