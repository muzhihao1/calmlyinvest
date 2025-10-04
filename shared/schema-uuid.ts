import { pgTable, text, numeric, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// UUID-based schema for Supabase

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull().default("My Portfolio"),
  totalEquity: numeric("total_equity", { precision: 10, scale: 2 }).notNull().default("0"),
  cashBalance: numeric("cash_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  marginUsed: numeric("margin_used", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockHoldings = pgTable("stock_holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  stockSymbol: text("stock_symbol").notNull(),
  stockName: text("stock_name"),
  shares: numeric("shares", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }),
  beta: numeric("beta", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const optionHoldings = pgTable("option_holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  optionSymbol: text("option_symbol").notNull(),
  underlyingSymbol: text("underlying_symbol").notNull(),
  optionType: text("option_type").notNull(), // 'call' or 'put'
  direction: text("direction").notNull(), // 'long' or 'short'
  contracts: numeric("contracts", { precision: 10, scale: 2 }).notNull(),
  strikePrice: numeric("strike_price", { precision: 10, scale: 2 }).notNull(),
  expirationDate: timestamp("expiration_date", { withTimezone: true }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }),
  deltaValue: numeric("delta_value", { precision: 4, scale: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const riskMetrics = pgTable("risk_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  leverageRatio: numeric("leverage_ratio", { precision: 5, scale: 2 }).notNull(),
  portfolioBeta: numeric("portfolio_beta", { precision: 4, scale: 2 }).notNull(),
  maxConcentration: numeric("max_concentration", { precision: 5, scale: 2 }).notNull(),
  marginUsageRatio: numeric("margin_usage_ratio", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(), // 'GREEN', 'YELLOW', 'RED'
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const riskSettings = pgTable("risk_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  leverageSafeThreshold: numeric("leverage_safe_threshold", { precision: 3, scale: 1 }).notNull().default("1.5"),
  leverageWarningThreshold: numeric("leverage_warning_threshold", { precision: 3, scale: 1 }).notNull().default("2.0"),
  concentrationLimit: numeric("concentration_limit", { precision: 5, scale: 2 }).notNull().default("20"),
  industryConcentrationLimit: numeric("industry_concentration_limit", { precision: 5, scale: 2 }).notNull().default("30"),
  minCashRatio: numeric("min_cash_ratio", { precision: 5, scale: 2 }).notNull().default("10"),
  leverageAlerts: boolean("leverage_alerts").notNull().default(true),
  expirationAlerts: boolean("expiration_alerts").notNull().default(true),
  volatilityAlerts: boolean("volatility_alerts").notNull().default(true),
  dataUpdateFrequency: text("data_update_frequency").notNull().default("5min"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const riskHistory = pgTable("risk_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  leverageRatio: numeric("leverage_ratio", { precision: 5, scale: 2 }).notNull(),
  portfolioBeta: numeric("portfolio_beta", { precision: 4, scale: 2 }).notNull(),
  maxConcentration: numeric("max_concentration", { precision: 5, scale: 2 }).notNull(),
  marginUsageRatio: numeric("margin_usage_ratio", { precision: 5, scale: 2 }).notNull(),
  remainingLiquidity: numeric("remaining_liquidity", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  stockValue: numeric("stock_value", { precision: 10, scale: 2 }).notNull(),
  optionMaxLoss: numeric("option_max_loss", { precision: 10, scale: 2 }).notNull(),
  totalEquity: numeric("total_equity", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Types inferred from schema
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;
export type StockHolding = typeof stockHoldings.$inferSelect;
export type InsertStockHolding = typeof stockHoldings.$inferInsert;
export type OptionHolding = typeof optionHoldings.$inferSelect;
export type InsertOptionHolding = typeof optionHoldings.$inferInsert;
export type RiskMetrics = typeof riskMetrics.$inferSelect;
export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = typeof riskSettings.$inferInsert;
export type RiskHistory = typeof riskHistory.$inferSelect;

// Zod schemas for validation
export const insertStockHoldingSchema = z.object({
  portfolioId: z.string().uuid(),
  stockSymbol: z.string().min(1).max(10),
  stockName: z.string().optional(),
  shares: z.number().positive(),
  costPrice: z.number().positive(),
  currentPrice: z.number().positive().optional(),
  beta: z.number().optional(),
});

export const updateStockHoldingSchema = insertStockHoldingSchema.partial();

export const insertOptionHoldingSchema = z.object({
  portfolioId: z.string().uuid(),
  optionSymbol: z.string().min(1),
  underlyingSymbol: z.string().min(1).max(10),
  optionType: z.enum(['call', 'put']),
  direction: z.enum(['long', 'short']),
  contracts: z.number().positive(),
  strikePrice: z.number().positive(),
  expirationDate: z.date(),
  costPrice: z.number().positive(),
  currentPrice: z.number().positive().optional(),
  deltaValue: z.number().min(-1).max(1).optional(),
});

export const updateOptionHoldingSchema = insertOptionHoldingSchema.partial();