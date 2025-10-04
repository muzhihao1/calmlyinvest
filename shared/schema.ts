import { pgTable, text, serial, integer, decimal, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  totalEquity: decimal("total_equity", { precision: 15, scale: 2 }),
  cashBalance: decimal("cash_balance", { precision: 15, scale: 2 }),
  marginUsed: decimal("margin_used", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockHoldings = pgTable("stock_holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  name: text("name"),
  quantity: integer("quantity").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 4 }),
  beta: decimal("beta", { precision: 6, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const optionHoldings = pgTable("option_holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const riskMetrics = pgTable("risk_metrics", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id),
  leverageRatio: decimal("leverage_ratio", { precision: 6, scale: 4 }),
  portfolioBeta: decimal("portfolio_beta", { precision: 6, scale: 4 }),
  maxConcentration: decimal("max_concentration", { precision: 6, scale: 4 }),
  marginUsageRatio: decimal("margin_usage_ratio", { precision: 6, scale: 4 }),
  riskLevel: text("risk_level"), // 'GREEN', 'YELLOW', 'RED'
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const riskSettings = pgTable("risk_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  leverageSafeThreshold: decimal("leverage_safe_threshold", { precision: 4, scale: 2 }).default("1.0"),
  leverageWarningThreshold: decimal("leverage_warning_threshold", { precision: 4, scale: 2 }).default("1.5"),
  concentrationLimit: decimal("concentration_limit", { precision: 4, scale: 2 }).default("20.0"),
  industryConcentrationLimit: decimal("industry_concentration_limit", { precision: 4, scale: 2 }).default("60.0"),
  minCashRatio: decimal("min_cash_ratio", { precision: 4, scale: 2 }).default("30.0"),
  leverageAlerts: boolean("leverage_alerts").default(true),
  expirationAlerts: boolean("expiration_alerts").default(true),
  volatilityAlerts: boolean("volatility_alerts").default(false),
  dataUpdateFrequency: integer("data_update_frequency").default(5), // minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const riskHistory = pgTable("risk_history", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id),
  leverageRatio: decimal("leverage_ratio", { precision: 10, scale: 4 }),
  portfolioBeta: decimal("portfolio_beta", { precision: 10, scale: 4 }),
  maxConcentration: decimal("max_concentration", { precision: 10, scale: 4 }),
  marginUsageRatio: decimal("margin_usage_ratio", { precision: 10, scale: 4 }),
  remainingLiquidity: decimal("remaining_liquidity", { precision: 20, scale: 2 }),
  riskLevel: text("risk_level"),
  stockValue: decimal("stock_value", { precision: 20, scale: 2 }),
  optionMaxLoss: decimal("option_max_loss", { precision: 20, scale: 2 }),
  totalEquity: decimal("total_equity", { precision: 20, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

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

export const insertRiskSettingsSchema = createInsertSchema(riskSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type StockHolding = typeof stockHoldings.$inferSelect;
export type InsertStockHolding = z.infer<typeof insertStockHoldingSchema>;

export type OptionHolding = typeof optionHoldings.$inferSelect;
export type InsertOptionHolding = z.infer<typeof insertOptionHoldingSchema>;

export type RiskMetrics = typeof riskMetrics.$inferSelect;

export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = z.infer<typeof insertRiskSettingsSchema>;
