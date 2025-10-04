import { pgTable, text, uuid, decimal, date, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// UUID-based schema for Supabase
export const portfolios = pgTable("portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // References auth.users
  name: text("name").notNull(),
  totalEquity: decimal("total_equity", { precision: 15, scale: 2 }),
  cashBalance: decimal("cash_balance", { precision: 15, scale: 2 }),
  marginUsed: decimal("margin_used", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const stockHoldings = pgTable("stock_holdings", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),
  symbol: text("symbol").notNull(),
  name: text("name"),
  quantity: integer("quantity").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 4 }),
  beta: decimal("beta", { precision: 6, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const optionHoldings = pgTable("option_holdings", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),
  optionSymbol: text("option_symbol").notNull(),
  underlyingSymbol: text("underlying_symbol").notNull(),
  optionType: text("option_type").notNull(), // 'CALL' or 'PUT'
  direction: text("direction").notNull(), // 'BUY' or 'SELL'
  contracts: integer("contracts").notNull(),
  strikePrice: decimal("strike_price", { precision: 10, scale: 4 }).notNull(),
  expirationDate: date("expiration_date").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 4 }),
  deltaValue: decimal("delta_value", { precision: 6, scale: 4 }),
  status: text("status").default('ACTIVE').notNull(), // 'ACTIVE', 'CLOSED', 'ROLLED'
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Option rollover tracking table
 * Tracks when an option position is closed and rolled into a new position
 * This preserves the realized P&L from the closed position while starting
 * fresh unrealized P&L tracking for the new position
 */
export const optionRollovers = pgTable("option_rollovers", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),

  // Old position (being closed)
  oldOptionId: uuid("old_option_id").references(() => optionHoldings.id).notNull(),
  oldOptionSymbol: text("old_option_symbol").notNull(),
  oldStrikePrice: decimal("old_strike_price", { precision: 10, scale: 4 }).notNull(),
  oldExpirationDate: date("old_expiration_date").notNull(),
  closePrice: decimal("close_price", { precision: 10, scale: 4 }).notNull(), // Price at which old position was closed
  closeContracts: integer("close_contracts").notNull(), // Number of contracts closed

  // New position (being opened)
  newOptionId: uuid("new_option_id").references(() => optionHoldings.id).notNull(),
  newOptionSymbol: text("new_option_symbol").notNull(),
  newStrikePrice: decimal("new_strike_price", { precision: 10, scale: 4 }).notNull(),
  newExpirationDate: date("new_expiration_date").notNull(),
  openPrice: decimal("open_price", { precision: 10, scale: 4 }).notNull(), // Price at which new position was opened
  openContracts: integer("open_contracts").notNull(), // Number of contracts opened

  // Financial data
  realizedPnl: decimal("realized_pnl", { precision: 15, scale: 2 }).notNull(), // Locked-in profit/loss from closing old position
  fees: decimal("fees", { precision: 10, scale: 2 }), // Total transaction fees

  // Metadata
  rolloverDate: timestamp("rollover_date", { withTimezone: true }).notNull(),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const riskMetrics = pgTable("risk_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),
  leverageRatio: decimal("leverage_ratio", { precision: 6, scale: 4 }),
  portfolioBeta: decimal("portfolio_beta", { precision: 6, scale: 4 }),
  maxConcentration: decimal("max_concentration", { precision: 6, scale: 4 }),
  marginUsageRatio: decimal("margin_usage_ratio", { precision: 6, scale: 4 }),
  riskLevel: text("risk_level"), // 'GREEN', 'YELLOW', 'RED'
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow(),
});

export const riskSettings = pgTable("risk_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(), // References auth.users
  leverageSafeThreshold: decimal("leverage_safe_threshold", { precision: 4, scale: 2 }).default("1.0"),
  leverageWarningThreshold: decimal("leverage_warning_threshold", { precision: 4, scale: 2 }).default("1.5"),
  concentrationLimit: decimal("concentration_limit", { precision: 4, scale: 2 }).default("20.0"),
  industryConcentrationLimit: decimal("industry_concentration_limit", { precision: 4, scale: 2 }).default("60.0"),
  minCashRatio: decimal("min_cash_ratio", { precision: 4, scale: 2 }).default("30.0"),
  leverageAlerts: boolean("leverage_alerts").default(true),
  expirationAlerts: boolean("expiration_alerts").default(true),
  volatilityAlerts: boolean("volatility_alerts").default(false),
  dataUpdateFrequency: integer("data_update_frequency").default(5), // minutes
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const riskHistory = pgTable("risk_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),
  leverageRatio: decimal("leverage_ratio", { precision: 10, scale: 4 }),
  portfolioBeta: decimal("portfolio_beta", { precision: 10, scale: 4 }),
  maxConcentration: decimal("max_concentration", { precision: 10, scale: 4 }),
  marginUsageRatio: decimal("margin_usage_ratio", { precision: 10, scale: 4 }),
  remainingLiquidity: decimal("remaining_liquidity", { precision: 20, scale: 2 }),
  riskLevel: text("risk_level"),
  stockValue: decimal("stock_value", { precision: 20, scale: 2 }),
  optionMaxLoss: decimal("option_max_loss", { precision: 20, scale: 2 }),
  totalEquity: decimal("total_equity", { precision: 20, scale: 2 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockHoldingSchema = createInsertSchema(stockHoldings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOptionHoldingSchema = createInsertSchema(optionHoldings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOptionRolloverSchema = createInsertSchema(optionRollovers).omit({
  id: true,
  createdAt: true,
});

export const insertRiskSettingsSchema = createInsertSchema(riskSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type StockHolding = typeof stockHoldings.$inferSelect;
export type InsertStockHolding = z.infer<typeof insertStockHoldingSchema>;

export type OptionHolding = typeof optionHoldings.$inferSelect;
export type InsertOptionHolding = z.infer<typeof insertOptionHoldingSchema>;

export type OptionRollover = typeof optionRollovers.$inferSelect;
export type InsertOptionRollover = z.infer<typeof insertOptionRolloverSchema>;

export type RiskMetrics = typeof riskMetrics.$inferSelect;

export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = z.infer<typeof insertRiskSettingsSchema>;

export type RiskHistory = typeof riskHistory.$inferSelect;