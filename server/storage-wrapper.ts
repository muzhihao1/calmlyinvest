import { Request } from 'express';
import { storage } from './storage-init';
import { guestStorage } from './storage-guest';
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
} from "@shared/schema-supabase";

export class StorageWrapper {
  private getStorage(req: Request) {
    // Check if this is a guest user
    if (req.user?.id === 'guest-user') {
      return guestStorage;
    }
    return storage;
  }

  // Portfolio methods
  async getPortfolios(userId: string, req: Request): Promise<Portfolio[]> {
    return this.getStorage(req).getPortfolios(userId);
  }

  async getPortfolio(id: string, req: Request): Promise<Portfolio | undefined> {
    return this.getStorage(req).getPortfolio(id);
  }

  async createPortfolio(data: InsertPortfolio, req: Request): Promise<Portfolio> {
    return this.getStorage(req).createPortfolio(data);
  }

  async updatePortfolio(id: string, data: Partial<Portfolio>, req: Request): Promise<Portfolio> {
    return this.getStorage(req).updatePortfolio(id, data);
  }

  async deletePortfolio(id: string, req: Request): Promise<void> {
    return this.getStorage(req).deletePortfolio(id);
  }

  // Stock holdings methods
  async getStockHoldings(portfolioId: string, req: Request): Promise<StockHolding[]> {
    return this.getStorage(req).getStockHoldings(portfolioId);
  }

  async createStockHolding(data: InsertStockHolding, req: Request): Promise<StockHolding> {
    return this.getStorage(req).createStockHolding(data);
  }

  async updateStockHolding(id: string, data: Partial<StockHolding>, req: Request): Promise<StockHolding> {
    return this.getStorage(req).updateStockHolding(id, data);
  }

  async deleteStockHolding(id: string, req: Request): Promise<void> {
    return this.getStorage(req).deleteStockHolding(id);
  }

  // Option holdings methods
  async getOptionHoldings(portfolioId: string, req: Request): Promise<OptionHolding[]> {
    return this.getStorage(req).getOptionHoldings(portfolioId);
  }

  async createOptionHolding(data: InsertOptionHolding, req: Request): Promise<OptionHolding> {
    return this.getStorage(req).createOptionHolding(data);
  }

  async updateOptionHolding(id: string, data: Partial<OptionHolding>, req: Request): Promise<OptionHolding> {
    return this.getStorage(req).updateOptionHolding(id, data);
  }

  async deleteOptionHolding(id: string, req: Request): Promise<void> {
    return this.getStorage(req).deleteOptionHolding(id);
  }

  // Risk settings methods
  async getRiskSettings(userId: string, req: Request): Promise<RiskSettings | undefined> {
    return this.getStorage(req).getRiskSettings(userId);
  }

  async updateRiskSettings(userId: string, data: InsertRiskSettings, req: Request): Promise<RiskSettings> {
    return this.getStorage(req).updateRiskSettings(userId, data);
  }

  // Risk metrics methods
  async createRiskMetrics(data: any, req: Request): Promise<RiskMetrics> {
    return this.getStorage(req).createRiskMetrics(data);
  }

  async getRiskHistory(portfolioId: string, days: number = 30, req: Request): Promise<RiskHistory[]> {
    return this.getStorage(req).getRiskHistory(portfolioId, days);
  }
}

export const storageWrapper = new StorageWrapper();