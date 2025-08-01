import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as schema from '../shared/schema-supabase';

export class SupabaseStorage {
  private supabase: SupabaseClient;
  
  constructor(url: string, serviceKey: string) {
    this.supabase = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Helper function to map snake_case to camelCase for portfolios
  private mapPortfolio(data: any): schema.Portfolio | null {
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id || data.userId,
      name: data.name,
      totalEquity: data.total_equity || data.totalEquity,
      cashBalance: data.cash_balance || data.cashBalance,
      marginUsed: data.margin_used || data.marginUsed,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt
    };
  }

  // Portfolio operations
  async getPortfolios(userId: string): Promise<schema.Portfolio[]> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(p => this.mapPortfolio(p)!);
  }

  async getPortfolio(id: string): Promise<schema.Portfolio | null> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return this.mapPortfolio(data);
  }

  async createPortfolio(portfolio: schema.InsertPortfolio): Promise<schema.Portfolio> {
    // Convert camelCase to snake_case for database
    const dbPortfolio = {
      user_id: portfolio.userId,
      name: portfolio.name,
      total_equity: portfolio.totalEquity,
      cash_balance: portfolio.cashBalance,
      margin_used: portfolio.marginUsed
    };
    
    const { data, error } = await this.supabase
      .from('portfolios')
      .insert(dbPortfolio)
      .select()
      .single();

    if (error) throw error;
    return this.mapPortfolio(data)!;
  }

  async updatePortfolio(id: string, updates: Partial<schema.Portfolio>): Promise<schema.Portfolio> {
    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.totalEquity !== undefined) dbUpdates.total_equity = updates.totalEquity;
    if (updates.cashBalance !== undefined) dbUpdates.cash_balance = updates.cashBalance;
    if (updates.marginUsed !== undefined) dbUpdates.margin_used = updates.marginUsed;
    
    const { data, error } = await this.supabase
      .from('portfolios')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapPortfolio(data)!;
  }

  async deletePortfolio(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Stock holdings operations
  async getStockHoldings(portfolioId: string): Promise<schema.StockHolding[]> {
    const { data, error } = await this.supabase
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) throw error;
    return data || [];
  }

  async createStockHolding(holding: schema.InsertStockHolding): Promise<schema.StockHolding> {
    const { data, error } = await this.supabase
      .from('stock_holdings')
      .insert(holding)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStockHolding(id: string, updates: Partial<schema.StockHolding>): Promise<schema.StockHolding> {
    const { data, error } = await this.supabase
      .from('stock_holdings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStockHolding(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('stock_holdings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Option holdings operations
  async getOptionHoldings(portfolioId: string): Promise<schema.OptionHolding[]> {
    const { data, error } = await this.supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) throw error;
    return data || [];
  }

  async createOptionHolding(holding: schema.InsertOptionHolding): Promise<schema.OptionHolding> {
    const { data, error } = await this.supabase
      .from('option_holdings')
      .insert(holding)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOptionHolding(id: string, updates: Partial<schema.OptionHolding>): Promise<schema.OptionHolding> {
    const { data, error } = await this.supabase
      .from('option_holdings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteOptionHolding(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('option_holdings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Risk metrics operations
  async getRiskMetrics(portfolioId: string): Promise<schema.RiskMetrics | null> {
    const { data, error } = await this.supabase
      .from('risk_metrics')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createRiskMetrics(metrics: Omit<schema.RiskMetrics, 'id' | 'calculatedAt'>): Promise<schema.RiskMetrics> {
    const { data, error } = await this.supabase
      .from('risk_metrics')
      .insert(metrics)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Risk settings operations
  async getRiskSettings(userId: string): Promise<schema.RiskSettings | null> {
    const { data, error } = await this.supabase
      .from('risk_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateRiskSettings(userId: string, settings: schema.InsertRiskSettings): Promise<schema.RiskSettings> {
    const { data, error } = await this.supabase
      .from('risk_settings')
      .upsert({ ...settings, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Risk history operations
  async createRiskHistory(history: Omit<schema.RiskHistory, 'id' | 'recordedAt'>): Promise<schema.RiskHistory> {
    const { data, error } = await this.supabase
      .from('risk_history')
      .insert(history)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRiskHistory(portfolioId: string, limit: number = 100): Promise<schema.RiskHistory[]> {
    const { data, error } = await this.supabase
      .from('risk_history')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}