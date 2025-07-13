import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import type { IStorage } from './storage';
import { getDatabaseConnection } from './config/database';

export class DbStorage implements IStorage {
  private db;
  
  constructor(databaseUrl: string) {
    const connection = getDatabaseConnection();
    if (!connection) {
      throw new Error('Database connection not available');
    }
    this.db = connection.db;
  }

  // User operations
  async getUser(id: number) {
    const result = await this.db.select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string) {
    const result = await this.db.select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return result[0];
  }

  async createUser(user: schema.InsertUser) {
    const result = await this.db.insert(schema.users)
      .values(user)
      .returning();
    return result[0];
  }

  // Portfolio operations
  async getPortfolios(userId: number) {
    return await this.db.select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.userId, userId));
  }

  async getPortfolio(id: number) {
    const result = await this.db.select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.id, id))
      .limit(1);
    return result[0];
  }

  async createPortfolio(portfolio: schema.InsertPortfolio) {
    const result = await this.db.insert(schema.portfolios)
      .values(portfolio)
      .returning();
    return result[0];
  }

  async updatePortfolio(id: number, updates: Partial<schema.Portfolio>) {
    const result = await this.db.update(schema.portfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.portfolios.id, id))
      .returning();
    return result[0];
  }

  // Stock holdings operations
  async getStockHoldings(portfolioId: number) {
    return await this.db.select()
      .from(schema.stockHoldings)
      .where(eq(schema.stockHoldings.portfolioId, portfolioId));
  }

  async createStockHolding(holding: schema.InsertStockHolding) {
    const result = await this.db.insert(schema.stockHoldings)
      .values(holding)
      .returning();
    return result[0];
  }

  async updateStockHolding(id: number, updates: Partial<schema.StockHolding>) {
    const result = await this.db.update(schema.stockHoldings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.stockHoldings.id, id))
      .returning();
    return result[0];
  }

  async deleteStockHolding(id: number) {
    const result = await this.db.delete(schema.stockHoldings)
      .where(eq(schema.stockHoldings.id, id))
      .returning();
    return result.length > 0;
  }

  // Option holdings operations
  async getOptionHoldings(portfolioId: number) {
    return await this.db.select()
      .from(schema.optionHoldings)
      .where(eq(schema.optionHoldings.portfolioId, portfolioId));
  }

  async createOptionHolding(holding: schema.InsertOptionHolding) {
    const result = await this.db.insert(schema.optionHoldings)
      .values(holding)
      .returning();
    return result[0];
  }

  async updateOptionHolding(id: number, updates: Partial<schema.OptionHolding>) {
    const result = await this.db.update(schema.optionHoldings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.optionHoldings.id, id))
      .returning();
    return result[0];
  }

  async deleteOptionHolding(id: number) {
    const result = await this.db.delete(schema.optionHoldings)
      .where(eq(schema.optionHoldings.id, id))
      .returning();
    return result.length > 0;
  }

  // Risk metrics operations
  async getRiskMetrics(portfolioId: number) {
    const result = await this.db.select()
      .from(schema.riskMetrics)
      .where(eq(schema.riskMetrics.portfolioId, portfolioId))
      .orderBy(schema.riskMetrics.calculatedAt)
      .limit(1);
    return result[0];
  }

  async createRiskMetrics(metrics: Omit<schema.RiskMetrics, 'id' | 'calculatedAt'>) {
    const result = await this.db.insert(schema.riskMetrics)
      .values(metrics)
      .returning();
    return result[0];
  }

  // Risk settings operations
  async getRiskSettings(userId: number) {
    const result = await this.db.select()
      .from(schema.riskSettings)
      .where(eq(schema.riskSettings.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateRiskSettings(userId: number, settings: schema.InsertRiskSettings) {
    // Try update first
    const existing = await this.getRiskSettings(userId);
    
    if (existing) {
      const result = await this.db.update(schema.riskSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(schema.riskSettings.userId, userId))
        .returning();
      return result[0];
    } else {
      // Create new if not exists
      const result = await this.db.insert(schema.riskSettings)
        .values({ ...settings, userId })
        .returning();
      return result[0];
    }
  }
}