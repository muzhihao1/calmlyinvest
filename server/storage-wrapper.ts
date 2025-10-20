import { Request } from 'express';
import { storage } from './storage-init.js';
import { guestStorage } from './storage-guest.js';
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
    // Check if this is a guest user or storage is not available
    if (req.user?.id === 'guest-user' || !storage) {
      return guestStorage;
    }
    return storage as any; // Type assertion to handle the mismatch
  }

  // Portfolio methods
  async getPortfolios(userId: string, req: Request): Promise<Portfolio[]> {
    return this.getStorage(req).getPortfolios(userId) as Promise<Portfolio[]>;
  }

  async getPortfolio(id: string, req: Request): Promise<Portfolio | undefined> {
    return this.getStorage(req).getPortfolio(id) as Promise<Portfolio | undefined>;
  }

  async createPortfolio(data: InsertPortfolio, req: Request): Promise<Portfolio> {
    return this.getStorage(req).createPortfolio(data) as Promise<Portfolio>;
  }

  async updatePortfolio(id: string, data: Partial<Portfolio>, req: Request): Promise<Portfolio> {
    return this.getStorage(req).updatePortfolio(id, data as any) as Promise<Portfolio>;
  }

  async deletePortfolio(id: string, req: Request): Promise<void> {
    const result = await this.getStorage(req).deletePortfolio(id);
    // Convert boolean result to void
    return;
  }

  // Stock holdings methods
  async getStockHoldings(portfolioId: string, req: Request): Promise<StockHolding[]> {
    return this.getStorage(req).getStockHoldings(portfolioId) as Promise<StockHolding[]>;
  }

  async createStockHolding(data: InsertStockHolding, req: Request): Promise<StockHolding> {
    return this.getStorage(req).createStockHolding(data) as Promise<StockHolding>;
  }

  async updateStockHolding(id: string, data: Partial<StockHolding>, req: Request): Promise<StockHolding> {
    return this.getStorage(req).updateStockHolding(id, data as any) as Promise<StockHolding>;
  }

  async deleteStockHolding(id: string, req: Request): Promise<void> {
    const result = await this.getStorage(req).deleteStockHolding(id);
    // Convert boolean result to void
    return;
  }

  // Option holdings methods
  async getOptionHoldings(portfolioId: string, req: Request): Promise<OptionHolding[]> {
    return this.getStorage(req).getOptionHoldings(portfolioId) as Promise<OptionHolding[]>;
  }

  async createOptionHolding(data: InsertOptionHolding, req: Request): Promise<OptionHolding> {
    return this.getStorage(req).createOptionHolding(data) as Promise<OptionHolding>;
  }

  async updateOptionHolding(id: string, data: Partial<OptionHolding>, req: Request): Promise<OptionHolding> {
    return this.getStorage(req).updateOptionHolding(id, data as any) as Promise<OptionHolding>;
  }

  async deleteOptionHolding(id: string, req: Request): Promise<void> {
    const result = await this.getStorage(req).deleteOptionHolding(id);
    // Convert boolean result to void
    return;
  }

  // Risk settings methods
  async getRiskSettings(userId: string, req: Request): Promise<RiskSettings | undefined> {
    return this.getStorage(req).getRiskSettings(userId) as Promise<RiskSettings | undefined>;
  }

  async updateRiskSettings(userId: string, data: InsertRiskSettings, req: Request): Promise<RiskSettings> {
    return this.getStorage(req).updateRiskSettings(userId, data) as Promise<RiskSettings>;
  }

  // Risk metrics methods
  async createRiskMetrics(data: any, req: Request): Promise<RiskMetrics> {
    return this.getStorage(req).createRiskMetrics(data) as Promise<RiskMetrics>;
  }

  async getRiskHistory(portfolioId: string, days: number = 30, req: Request): Promise<RiskHistory[]> {
    return this.getStorage(req).getRiskHistory(portfolioId, days) as Promise<RiskHistory[]>;
  }
}

export const storageWrapper = new StorageWrapper();