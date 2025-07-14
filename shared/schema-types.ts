// Custom type overrides for Supabase that uses string dates
import type * as schema from './schema-supabase';

// Override date fields to be strings
export type Portfolio = Omit<schema.Portfolio, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type StockHolding = Omit<schema.StockHolding, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type OptionHolding = Omit<schema.OptionHolding, 'createdAt' | 'updatedAt' | 'expirationDate'> & {
  createdAt: string;
  updatedAt: string;
  expirationDate: string;
};

export type RiskMetrics = Omit<schema.RiskMetrics, 'calculatedAt'> & {
  calculatedAt: string;
};

export type RiskSettings = Omit<schema.RiskSettings, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type RiskHistory = Omit<schema.RiskHistory, 'recordedAt'> & {
  recordedAt: string;
};

// Re-export insert types and schemas as they don't have date fields
export type { 
  InsertPortfolio, 
  InsertStockHolding, 
  InsertOptionHolding, 
  InsertRiskSettings 
} from './schema-supabase';

export {
  insertPortfolioSchema,
  insertStockHoldingSchema,
  insertOptionHoldingSchema,
  insertRiskSettingsSchema
} from './schema-supabase';