import { pgTable, text, uuid, decimal, date, boolean, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";

// Enums for user preferences
export const investmentGoalEnum = pgEnum('investment_goal_type', ['growth', 'income', 'capital_preservation', 'balanced']);
export const riskToleranceEnum = pgEnum('risk_tolerance_type', ['conservative', 'moderate', 'aggressive']);
export const investmentHorizonEnum = pgEnum('investment_horizon_type', ['short_term', 'medium_term', 'long_term']);

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

  // Option Greeks (calculated using Black-Scholes model)
  deltaValue: decimal("delta_value", { precision: 6, scale: 4 }),
  gammaValue: decimal("gamma_value", { precision: 6, scale: 4 }),
  thetaValue: decimal("theta_value", { precision: 6, scale: 4 }),
  vegaValue: decimal("vega_value", { precision: 6, scale: 4 }),

  // Implied volatility used for Greeks calculation
  impliedVolatility: decimal("implied_volatility", { precision: 6, scale: 4 }),

  // Timestamp when Greeks were last calculated
  greeksUpdatedAt: timestamp("greeks_updated_at", { withTimezone: true }),

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

/**
 * User preferences table for AI advisory system
 * Stores investment goals, risk tolerance, and personalized thresholds
 * Phase 2 implementation - User Preferences System
 */
export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey().notNull(), // References auth.users, one-to-one relationship

  // Core preference fields (required)
  investmentGoal: investmentGoalEnum("investment_goal").notNull(),
  riskTolerance: riskToleranceEnum("risk_tolerance").notNull(),
  investmentHorizon: investmentHorizonEnum("investment_horizon").notNull(),

  // Risk threshold settings with defaults based on best practices
  maxLeverageRatio: decimal("max_leverage_ratio", { precision: 6, scale: 2 }).notNull().default("1.5"),
  maxConcentrationPct: decimal("max_concentration_pct", { precision: 5, scale: 2 }).notNull().default("25.0"),
  maxSectorConcentrationPct: decimal("max_sector_concentration_pct", { precision: 5, scale: 2 }).notNull().default("40.0"),
  minCashRatio: decimal("min_cash_ratio", { precision: 5, scale: 2 }).notNull().default("10.0"),
  maxMarginUsagePct: decimal("max_margin_usage_pct", { precision: 5, scale: 2 }).notNull().default("50.0"),

  // Optional advanced settings
  targetBeta: decimal("target_beta", { precision: 6, scale: 4 }),
  targetDelta: decimal("target_delta", { precision: 6, scale: 4 }),

  // Sector preferences stored as JSON
  // Structure: {"prefer": ["Technology", "Healthcare"], "avoid": ["Energy"]}
  sectorPreferences: jsonb("sector_preferences").notNull().$type<{
    prefer: string[];
    avoid: string[];
  }>().default({ prefer: [], avoid: [] }),

  // Onboarding status
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

  // Audit timestamps
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

// Types - Using drizzle's built-in type inference with timestamp override
// Override timestamp fields to use string instead of Date for API compatibility
// Allow null values to handle API endpoints that may pass null for optional timestamps
type WithStringTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt' | 'closedAt' | 'rolloverDate' | 'calculatedAt' | 'recordedAt' | 'greeksUpdatedAt'> & {
  createdAt?: string | null;
  updatedAt?: string | null;
  closedAt?: string | null;
  rolloverDate?: string | null;
  calculatedAt?: string | null;
  recordedAt?: string | null;
  greeksUpdatedAt?: string | null;
};

export type Portfolio = WithStringTimestamps<typeof portfolios.$inferSelect>;
export type InsertPortfolio = WithStringTimestamps<typeof portfolios.$inferInsert>;

export type StockHolding = WithStringTimestamps<typeof stockHoldings.$inferSelect>;
export type InsertStockHolding = WithStringTimestamps<typeof stockHoldings.$inferInsert>;

export type OptionHolding = WithStringTimestamps<typeof optionHoldings.$inferSelect>;
export type InsertOptionHolding = WithStringTimestamps<typeof optionHoldings.$inferInsert>;

export type OptionRollover = WithStringTimestamps<typeof optionRollovers.$inferSelect>;
export type InsertOptionRollover = WithStringTimestamps<typeof optionRollovers.$inferInsert>;

export type RiskMetrics = WithStringTimestamps<typeof riskMetrics.$inferSelect>;

export type RiskSettings = WithStringTimestamps<typeof riskSettings.$inferSelect>;
export type InsertRiskSettings = WithStringTimestamps<typeof riskSettings.$inferInsert>;

export type RiskHistory = WithStringTimestamps<typeof riskHistory.$inferSelect>;

export type UserPreferences = WithStringTimestamps<typeof userPreferences.$inferSelect>;
export type InsertUserPreferences = WithStringTimestamps<typeof userPreferences.$inferInsert>;

// Zod schemas for validation (optional, for API validation)
// Note: We create custom schemas instead of using createInsertSchema
// because createInsertSchema infers Date types, but we use string timestamps
export const insertPortfolioSchema = z.object({
  userId: z.string(),
  name: z.string(),
  totalEquity: z.string().optional(),
  cashBalance: z.string().optional(),
  marginUsed: z.string().optional(),
});

export const insertStockHoldingSchema = z.object({
  portfolioId: z.string(),
  symbol: z.string(),
  name: z.string().optional(),
  quantity: z.number().int(),
  costPrice: z.string(),
  currentPrice: z.string().optional(),
  beta: z.string().optional(),
});

export const insertOptionHoldingSchema = z.object({
  portfolioId: z.string(),
  optionSymbol: z.string(),
  underlyingSymbol: z.string(),
  optionType: z.string(),
  direction: z.string(),
  contracts: z.number().int(),
  strikePrice: z.string(),
  expirationDate: z.string(),
  costPrice: z.string(),
  currentPrice: z.string().optional(),
  deltaValue: z.string().optional(),
  status: z.string().optional(),
});

export const insertOptionRolloverSchema = z.object({
  portfolioId: z.string(),
  oldOptionId: z.string(),
  oldOptionSymbol: z.string(),
  oldStrikePrice: z.string(),
  oldExpirationDate: z.string(),
  closePrice: z.string(),
  closeContracts: z.number().int(),
  newOptionId: z.string(),
  newOptionSymbol: z.string(),
  newStrikePrice: z.string(),
  newExpirationDate: z.string(),
  openPrice: z.string(),
  openContracts: z.number().int(),
  realizedPnl: z.string(),
  fees: z.string().optional(),
  notes: z.string().optional(),
});

export const insertRiskSettingsSchema = z.object({
  userId: z.string(),
  leverageSafeThreshold: z.string().optional(),
  leverageWarningThreshold: z.string().optional(),
  concentrationLimit: z.string().optional(),
  industryConcentrationLimit: z.string().optional(),
  minCashRatio: z.string().optional(),
  leverageAlerts: z.boolean().optional(),
  expirationAlerts: z.boolean().optional(),
  volatilityAlerts: z.boolean().optional(),
  dataUpdateFrequency: z.number().int().optional(),
});

/**
 * Base Zod schema for user preferences validation (without cross-field refinement)
 * Used to create both insert and update schemas
 */
const baseUserPreferencesSchema = z.object({
  userId: z.string().uuid(),

  // Core preferences (required)
  investmentGoal: z.enum(['growth', 'income', 'capital_preservation', 'balanced']),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentHorizon: z.enum(['short_term', 'medium_term', 'long_term']),

  // Risk thresholds with validation
  maxLeverageRatio: z.string()
    .refine(val => parseFloat(val) > 0 && parseFloat(val) <= 10, {
      message: 'Max leverage ratio must be between 0 and 10'
    })
    .optional(),
  maxConcentrationPct: z.string()
    .refine(val => parseFloat(val) > 0 && parseFloat(val) <= 100, {
      message: 'Max concentration must be between 0 and 100'
    })
    .optional(),
  maxSectorConcentrationPct: z.string()
    .refine(val => parseFloat(val) > 0 && parseFloat(val) <= 100, {
      message: 'Max sector concentration must be between 0 and 100'
    })
    .optional(),
  minCashRatio: z.string()
    .refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, {
      message: 'Min cash ratio must be between 0 and 100'
    })
    .optional(),
  maxMarginUsagePct: z.string()
    .refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, {
      message: 'Max margin usage must be between 0 and 100'
    })
    .optional(),

  // Optional advanced settings
  targetBeta: z.string()
    .refine(val => parseFloat(val) >= -5 && parseFloat(val) <= 5, {
      message: 'Target beta must be between -5 and 5'
    })
    .optional()
    .nullable(),
  targetDelta: z.string()
    .refine(val => parseFloat(val) >= -100000 && parseFloat(val) <= 100000, {
      message: 'Target delta must be between -100,000 and 100,000'
    })
    .optional()
    .nullable(),

  // Sector preferences
  sectorPreferences: z.object({
    prefer: z.array(z.string()).default([]),
    avoid: z.array(z.string()).default([]),
  }).optional(),

  // Onboarding status
  onboardingCompleted: z.boolean().optional(),
});

/**
 * Zod schema for inserting user preferences
 * Includes cross-field validation for goal/tolerance combinations
 */
export const insertUserPreferencesSchema = baseUserPreferencesSchema.refine(
  (data) => {
    // Cross-field validation: aggressive goal should not pair with conservative tolerance
    if (data.investmentGoal === 'growth' && data.riskTolerance === 'conservative') {
      return false;
    }
    // Conservative goal should not pair with aggressive tolerance
    if (data.investmentGoal === 'capital_preservation' && data.riskTolerance === 'aggressive') {
      return false;
    }
    return true;
  },
  {
    message: 'Investment goal and risk tolerance combination is not recommended. Growth goals should not be paired with conservative tolerance, and capital preservation should not be paired with aggressive tolerance.',
    path: ['investmentGoal'],
  }
);

/**
 * Zod schema for updating user preferences (all fields optional, userId excluded)
 */
export const updateUserPreferencesSchema = baseUserPreferencesSchema.partial().omit({ userId: true });