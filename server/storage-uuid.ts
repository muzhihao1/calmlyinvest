import type { Portfolio, StockHolding, OptionHolding, RiskSettings, RiskMetrics, InsertPortfolio, InsertStockHolding, InsertOptionHolding, InsertRiskSettings } from '@shared/schema-uuid';

// Updated interface for UUID-based storage
export interface IStorage {
  // Portfolio operations - now using string (UUID) for IDs
  getPortfolios(userId: string): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined>;

  // Stock holdings operations
  getStockHoldings(portfolioId: string): Promise<StockHolding[]>;
  createStockHolding(holding: InsertStockHolding): Promise<StockHolding>;
  updateStockHolding(id: string, updates: Partial<StockHolding>): Promise<StockHolding | undefined>;
  deleteStockHolding(id: string): Promise<boolean>;

  // Option holdings operations
  getOptionHoldings(portfolioId: string): Promise<OptionHolding[]>;
  createOptionHolding(holding: InsertOptionHolding): Promise<OptionHolding>;
  updateOptionHolding(id: string, updates: Partial<OptionHolding>): Promise<OptionHolding | undefined>;
  deleteOptionHolding(id: string): Promise<boolean>;

  // Risk metrics operations
  getRiskMetrics(portfolioId: string): Promise<RiskMetrics | undefined>;
  createRiskMetrics(metrics: Omit<RiskMetrics, 'id' | 'calculatedAt'>): Promise<RiskMetrics>;

  // Risk settings operations
  getRiskSettings(userId: string): Promise<RiskSettings | undefined>;
  updateRiskSettings(userId: string, settings: InsertRiskSettings): Promise<RiskSettings>;
}