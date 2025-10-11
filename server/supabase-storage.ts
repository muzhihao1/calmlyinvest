import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as schema from '../shared/schema-supabase.js';

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

  private mapStockHolding(data: any): schema.StockHolding | null {
    if (!data) return null;
    return {
      id: data.id,
      portfolioId: data.portfolio_id || data.portfolioId,
      symbol: data.symbol,
      name: data.name,
      quantity: data.quantity,
      costPrice: data.cost_price || data.costPrice,
      currentPrice: data.current_price ?? data.currentPrice ?? null,
      beta: data.beta ?? null,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    } as schema.StockHolding;
  }

  private toDbStockHolding(holding: schema.InsertStockHolding) {
    return {
      portfolio_id: holding.portfolioId,
      symbol: holding.symbol,
      name: holding.name ?? null,
      quantity: holding.quantity,
      cost_price: holding.costPrice,
      current_price: holding.currentPrice ?? null,
      beta: holding.beta ?? null,
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
    return (data || []).map((row) => this.mapStockHolding(row)!) as schema.StockHolding[];
  }

  async createStockHolding(holding: schema.InsertStockHolding): Promise<schema.StockHolding> {
    const dbHolding = this.toDbStockHolding(holding);

    const { data, error } = await this.supabase
      .from('stock_holdings')
      .insert(dbHolding)
      .select()
      .single();

    if (error) throw error;
    return this.mapStockHolding(data)!;
  }

  async updateStockHolding(id: string, updates: Partial<schema.StockHolding>): Promise<schema.StockHolding> {
    const dbUpdates: Record<string, any> = {};
    if (updates.symbol !== undefined) dbUpdates.symbol = updates.symbol;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
    if (updates.beta !== undefined) dbUpdates.beta = updates.beta;

    const { data, error } = await this.supabase
      .from('stock_holdings')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapStockHolding(data)!;
  }

  async deleteStockHolding(id: string): Promise<boolean> {
    console.log(`[SupabaseStorage] Deleting stock holding with ID: ${id}`);
    console.log(`[SupabaseStorage] ID type: ${typeof id}`);

    // First, get the portfolio_id before deletion so we can check if we need to reset margin
    const { data: holdingData } = await this.supabase
      .from('stock_holdings')
      .select('portfolio_id')
      .eq('id', id)
      .single();

    const portfolioId = holdingData?.portfolio_id;

    const { data, error, count } = await this.supabase
      .from('stock_holdings')
      .delete()
      .eq('id', id)
      .select();

    console.log(`[SupabaseStorage] Delete result - data:`, data);
    console.log(`[SupabaseStorage] Delete result - error:`, error);
    console.log(`[SupabaseStorage] Delete result - count:`, count);

    if (error) {
      console.error(`[SupabaseStorage] Delete error details:`, JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`[SupabaseStorage] No rows deleted for ID: ${id}`);
    }

    // After successful deletion, check if portfolio has any remaining holdings
    // If not, reset margin_used to 0
    if (portfolioId && data && data.length > 0) {
      await this.resetPortfolioMarginIfEmpty(portfolioId);
    }

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
    const dbHolding = {
      portfolio_id: holding.portfolioId,
      option_symbol: holding.optionSymbol,
      underlying_symbol: holding.underlyingSymbol,
      option_type: holding.optionType,
      direction: holding.direction,
      contracts: holding.contracts,
      strike_price: holding.strikePrice,
      expiration_date: holding.expirationDate,
      cost_price: holding.costPrice,
    };

    const { data, error } = await this.supabase
      .from('option_holdings')
      .insert(dbHolding)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOptionHolding(id: string, updates: Partial<schema.OptionHolding>): Promise<schema.OptionHolding> {
    const dbUpdates: Record<string, any> = {};
    if (updates.optionSymbol !== undefined) dbUpdates.option_symbol = updates.optionSymbol;
    if (updates.underlyingSymbol !== undefined) dbUpdates.underlying_symbol = updates.underlyingSymbol;
    if (updates.optionType !== undefined) dbUpdates.option_type = updates.optionType;
    if (updates.direction !== undefined) dbUpdates.direction = updates.direction;
    if (updates.contracts !== undefined) dbUpdates.contracts = updates.contracts;
    if (updates.strikePrice !== undefined) dbUpdates.strike_price = updates.strikePrice;
    if (updates.expirationDate !== undefined) dbUpdates.expiration_date = updates.expirationDate;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;

    const { data, error } = await this.supabase
      .from('option_holdings')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteOptionHolding(id: string): Promise<boolean> {
    console.log('[deleteOptionHolding] Attempting to delete option holding:', id);

    // First, get the portfolio_id before deletion so we can check if we need to reset margin
    const { data: holdingData } = await this.supabase
      .from('option_holdings')
      .select('portfolio_id')
      .eq('id', id)
      .single();

    const portfolioId = holdingData?.portfolio_id;

    // Delete any rollover records referencing this option
    // This is necessary because of foreign key constraints:
    // - option_rollovers.old_option_id references option_holdings.id
    // - option_rollovers.new_option_id references option_holdings.id
    console.log('[deleteOptionHolding] Deleting related rollover records...');
    const { error: rolloverDeleteError } = await this.supabase
      .from('option_rollovers')
      .delete()
      .or(`old_option_id.eq.${id},new_option_id.eq.${id}`);

    if (rolloverDeleteError) {
      console.error('[deleteOptionHolding] Error deleting related rollover records:', rolloverDeleteError);
      // Don't throw - try to continue with the main deletion
      // The constraint error will surface if rollovers couldn't be deleted
    } else {
      console.log('[deleteOptionHolding] Related rollover records deleted successfully');
    }

    // Now delete the option holding itself
    const { data, error, count } = await this.supabase
      .from('option_holdings')
      .delete()
      .eq('id', id)
      .select();

    console.log('[deleteOptionHolding] Delete result:', { data, error, count, deletedRows: data?.length });

    if (error) {
      console.error('[deleteOptionHolding] Delete error:', error);
      throw error;
    }

    // If no rows were deleted, the option holding didn't exist
    // Return true anyway since the end result is the same (option is not in DB)
    if (!data || data.length === 0) {
      console.warn('[deleteOptionHolding] No rows deleted - option holding may have already been deleted:', id);
    }

    // After successful deletion, check if portfolio has any remaining holdings
    // If not, reset margin_used to 0
    if (portfolioId && data && data.length > 0) {
      await this.resetPortfolioMarginIfEmpty(portfolioId);
    }

    return true;
  }

  // Helper method to reset portfolio margin_used to 0 if no holdings remain
  private async resetPortfolioMarginIfEmpty(portfolioId: string): Promise<void> {
    console.log('[resetPortfolioMarginIfEmpty] Checking if portfolio has remaining holdings:', portfolioId);

    // Check for remaining stock holdings
    const { data: stocks, error: stockError } = await this.supabase
      .from('stock_holdings')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .limit(1);

    // Check for remaining option holdings
    const { data: options, error: optionError } = await this.supabase
      .from('option_holdings')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .limit(1);

    const hasStocks = !stockError && stocks && stocks.length > 0;
    const hasOptions = !optionError && options && options.length > 0;

    console.log('[resetPortfolioMarginIfEmpty] Remaining holdings check:', { hasStocks, hasOptions });

    // If no holdings remain, reset margin_used to 0
    if (!hasStocks && !hasOptions) {
      console.log('[resetPortfolioMarginIfEmpty] No holdings remain, resetting margin_used to 0');
      const { error: updateError } = await this.supabase
        .from('portfolios')
        .update({ margin_used: '0.00' })
        .eq('id', portfolioId);

      if (updateError) {
        console.error('[resetPortfolioMarginIfEmpty] Error resetting margin:', updateError);
      } else {
        console.log('[resetPortfolioMarginIfEmpty] Margin successfully reset to 0');
      }
    }
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
