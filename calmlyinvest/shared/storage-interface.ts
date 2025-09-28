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
} from "./schema-types";

/**
 * Common interface for storage adapters
 */
export interface StorageInterface {
  // Portfolio methods
  getPortfolios(userId: string, req?: any): Promise<Portfolio[]>;
  getPortfolio(id: string, req?: any): Promise<Portfolio | undefined>;
  createPortfolio(data: InsertPortfolio, req?: any): Promise<Portfolio>;
  updatePortfolio(id: string, data: Partial<Portfolio>, req?: any): Promise<Portfolio>;
  deletePortfolio(id: string, req?: any): Promise<void>;

  // Stock holdings methods
  getStockHoldings(portfolioId: string, req?: any): Promise<StockHolding[]>;
  getStockHolding?(id: string, req?: any): Promise<StockHolding | undefined>;
  createStockHolding(data: InsertStockHolding, req?: any): Promise<StockHolding>;
  updateStockHolding(id: string, data: Partial<StockHolding>, req?: any): Promise<StockHolding>;
  deleteStockHolding(id: string, req?: any): Promise<void>;

  // Option holdings methods
  getOptionHoldings(portfolioId: string, req?: any): Promise<OptionHolding[]>;
  getOptionHolding?(id: string, req?: any): Promise<OptionHolding | undefined>;
  createOptionHolding(data: InsertOptionHolding, req?: any): Promise<OptionHolding>;
  updateOptionHolding(id: string, data: Partial<OptionHolding>, req?: any): Promise<OptionHolding>;
  deleteOptionHolding(id: string, req?: any): Promise<void>;

  // Risk settings methods
  getRiskSettings(userId: string, req?: any): Promise<RiskSettings | undefined>;
  updateRiskSettings(userId: string, data: InsertRiskSettings, req?: any): Promise<RiskSettings>;

  // Risk metrics methods
  getRiskMetrics(portfolioId: string, req?: any): Promise<RiskMetrics | undefined>;
  createRiskMetrics(data: any, req?: any): Promise<RiskMetrics>;
  getRiskHistory?(portfolioId: string, limit?: number, req?: any): Promise<RiskHistory[]>;
}