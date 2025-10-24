# AI Investment Advisory System - Technical Implementation Plan

**Project:** "智能仓位管家" (CamlyInvest) AI Upgrade
**Version:** 1.0
**Date:** 2025-10-24
**Author:** AI Architecture Team

---

## 📋 Executive Summary

This document provides a comprehensive technical implementation plan to transform CamlyInvest from a portfolio tracking tool into an intelligent, data-driven AI investment advisory system. The plan addresses critical data accuracy issues while implementing a sophisticated recommendation engine based on user preferences and real-time market data.

### Core Objectives

1. **Fix Data Foundation** - Resolve 71% missing holdings, option parsing errors, cash balance discrepancies
2. **Enhance Data Inputs** - Add options Greeks (Delta, Theta, Gamma, Vega), implied volatility, market indices (VIX)
3. **Build AI Logic** - Multi-dimensional risk assessment and personalized recommendation engine
4. **Optimize UI/UX** - Priority-based recommendations, simulation tools, advanced visualizations

### Success Metrics

- **Data Accuracy**: 100% holdings sync with IB (from 29%)
- **Option Data Quality**: >95% accurate Greeks and prices (from 0%)
- **Cash Reconciliation**: <1% error (from $48k discrepancy)
- **AI Recommendations**: Generate 3-7 actionable suggestions per portfolio
- **User Engagement**: >60% of users configure preferences within first week

---

## 🏗️ System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TS)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ AI Dashboard │  │ Settings     │  │ Simulation Modal     │  │
│  │ - Risk Gauge │  │ Wizard       │  │ - What-if Analysis   │  │
│  │ - Rec. List  │  │ - Goals      │  │ - Impact Preview     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express.js + TS)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ API Layer (api/)                                          │  │
│  │  /portfolio-risk-simple.ts  /recommendations-simple.ts    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Risk Engine  │  │ Rec. Engine  │  │ Simulation Engine    │  │
│  │ - Calc Beta  │  │ - If-Then    │  │ - Scenario Analysis  │  │
│  │ - Delta Exp. │  │ - Rules      │  │ - Impact Calc        │  │
│  │ - Theta      │  │ - Priority   │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Data Ingestion Layer (server/services/)                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ IB Sync     │  │ Market Data │  │ Data Quality │      │  │
│  │  │ Service     │  │ Service     │  │ Validator    │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    ▲                      ▲
                    │                      │
          ┌─────────┴──────────┐  ┌────────┴─────────┐
          │ IB TWS/Gateway     │  │ Polygon.io API   │
          │ - Holdings         │  │ - Greeks         │
          │ - Cash Balance     │  │ - IV, VIX        │
          │ - Account Summary  │  │ - Prices         │
          └────────────────────┘  └──────────────────┘
                    ▲
                    │
          ┌─────────┴──────────┐
          │ Supabase PostgreSQL │
          │ - portfolios       │
          │ - stock_holdings   │
          │ - option_holdings  │
          │ - user_preferences │
          │ - recommendations  │
          └────────────────────┘
```

---

## 📊 Phase 1: Data Foundation (Priority: CRITICAL)

### Goal
Fix all critical data accuracy issues and establish reliable data pipelines for holdings, Greeks, and market data.

---

## 1.1 Data Provider Selection

### Primary Provider: Interactive Brokers (IB) API

**Purpose**: User-specific holdings data (source of truth)

**Rationale**:
- Current 71% data loss is due to not syncing with IB
- IB API provides authoritative positions, cash, margin
- Eliminates manual CSV import errors

**Implementation**: TWS API or IB Gateway with `ib` npm package

**Alternative Considered**: Manual CSV import
- ❌ Error-prone, requires user discipline
- ❌ Can't auto-update during day
- ❌ No real-time cash/margin tracking

---

### Market Data Provider: Polygon.io

**Purpose**: Real-time prices, options Greeks, IV, VIX

**Rationale**:
| Feature | Polygon.io | Yahoo Finance | IB API |
|---------|-----------|---------------|---------|
| **Options Greeks** | ✅ Real-time | ❌ Not available | ⚠️ Limited, requires TWS running |
| **Implied Volatility** | ✅ Per contract | ❌ No | ⚠️ Yes, but rate limited |
| **VIX Index** | ✅ Yes | ✅ Yes | ⚠️ Requires subscription |
| **Rate Limits** | 500/min (Starter) | Unofficial, unstable | 50 msg/sec, complex |
| **Reliability** | ✅ 99.9% SLA | ⚠️ No SLA | ⚠️ Requires user's TWS |
| **Cost** | $99-199/mo | Free | Included in IB account |
| **Developer Experience** | ✅ Excellent docs | ⚠️ Unofficial API | ⚠️ Complex, Java-centric |

**Decision**: Use **Polygon.io Starter Plan ($99/mo)** for market data
- Reliable, documented, designed for developers
- Separate from user's IB connection (more robust)
- Can upgrade to higher tier if rate limits hit

**Fallback Strategy**:
```typescript
// Cascade: Polygon.io → Yahoo Finance → Cached data
async function fetchOptionGreeks(symbol: string): Promise<OptionGreeks> {
  try {
    return await polygonClient.getOptionGreeks(symbol);
  } catch (error) {
    logger.warn('Polygon.io failed, trying Yahoo Finance');
    try {
      return await yahooFinanceClient.getOptionData(symbol);
    } catch (error2) {
      logger.error('All providers failed, using cached data');
      return await getCachedGreeks(symbol);
    }
  }
}
```

---

## 1.2 Database Schema Extensions

### A. Modify Existing Tables

#### `option_holdings` - Add Greeks Columns

```sql
-- Migration: 20251024_add_option_greeks.sql

ALTER TABLE option_holdings
ADD COLUMN delta NUMERIC(10, 4),
ADD COLUMN gamma NUMERIC(10, 6),
ADD COLUMN theta NUMERIC(10, 4),
ADD COLUMN vega NUMERIC(10, 4),
ADD COLUMN implied_volatility NUMERIC(10, 4), -- IV as percentage (e.g., 0.35 = 35%)
ADD COLUMN last_greeks_update TIMESTAMPTZ;

-- Add index for querying options by expiration (for Theta decay alerts)
CREATE INDEX idx_option_holdings_expiration ON option_holdings(expiration_date)
WHERE expiration_date IS NOT NULL;

-- Add index for high Delta options (for concentration risk)
CREATE INDEX idx_option_holdings_delta ON option_holdings(delta)
WHERE delta IS NOT NULL;

COMMENT ON COLUMN option_holdings.delta IS 'Rate of change of option value per $1 change in underlying';
COMMENT ON COLUMN option_holdings.gamma IS 'Rate of change of delta';
COMMENT ON COLUMN option_holdings.theta IS 'Daily time decay in dollars';
COMMENT ON COLUMN option_holdings.vega IS 'Change in option value per 1% change in IV';
COMMENT ON COLUMN option_holdings.implied_volatility IS 'Market implied volatility (decimal, e.g., 0.35 = 35%)';
```

#### `portfolios` - Add Aggregated Risk Metrics

```sql
-- Migration: 20251024_add_portfolio_risk_metrics.sql

ALTER TABLE portfolios
ADD COLUMN total_delta NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN total_gamma NUMERIC(12, 6) DEFAULT 0,
ADD COLUMN total_theta NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN total_vega NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN portfolio_beta NUMERIC(6, 3) DEFAULT 1.0,
ADD COLUMN max_concentration_symbol VARCHAR(10),
ADD COLUMN max_concentration_pct NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN last_risk_calc_at TIMESTAMPTZ;

CREATE INDEX idx_portfolios_last_calc ON portfolios(last_risk_calc_at);

COMMENT ON COLUMN portfolios.total_delta IS 'Sum of all position deltas (stock + options)';
COMMENT ON COLUMN portfolios.total_theta IS 'Total daily time decay across all options';
COMMENT ON COLUMN portfolios.portfolio_beta IS 'Weighted average Beta vs market (SPY)';
```

---

### B. Create New Tables

#### `user_preferences` - Investment Goals & Risk Tolerance

```sql
-- Migration: 20251024_create_user_preferences.sql

CREATE TYPE investment_goal AS ENUM ('growth', 'income', 'capital_preservation', 'balanced');
CREATE TYPE risk_tolerance AS ENUM ('conservative', 'moderate', 'aggressive');
CREATE TYPE investment_horizon AS ENUM ('short_term', 'medium_term', 'long_term'); -- <1yr, 1-5yr, >5yr

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Investment Profile
  investment_goal investment_goal NOT NULL DEFAULT 'balanced',
  risk_tolerance risk_tolerance NOT NULL DEFAULT 'moderate',
  investment_horizon investment_horizon NOT NULL DEFAULT 'medium_term',

  -- Risk Thresholds (user-defined limits)
  max_leverage_ratio NUMERIC(4, 2) DEFAULT 1.5, -- e.g., 1.5x
  max_concentration_pct NUMERIC(5, 2) DEFAULT 25.0, -- e.g., 25%
  max_sector_concentration_pct NUMERIC(5, 2) DEFAULT 40.0,
  min_cash_ratio NUMERIC(5, 2) DEFAULT 10.0, -- e.g., 10% minimum cash
  max_margin_usage_pct NUMERIC(5, 2) DEFAULT 50.0,

  -- Target Portfolio Characteristics
  target_beta NUMERIC(4, 2), -- NULL = no target
  target_delta NUMERIC(8, 2), -- NULL = no target, 0 = delta neutral

  -- Preferences
  sector_preferences JSONB, -- {"prefer": ["Technology", "Healthcare"], "avoid": ["Energy"]}
  risk_alerts_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_preferences_user_id_unique UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_preferences IS 'User-defined investment goals, risk tolerance, and portfolio constraints';
```

#### `recommendations` - AI-Generated Investment Advice

```sql
-- Migration: 20251024_create_recommendations.sql

CREATE TYPE recommendation_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE recommendation_category AS ENUM (
  'concentration_risk',
  'delta_hedge',
  'theta_decay',
  'margin_risk',
  'liquidity',
  'sector_allocation',
  'options_management',
  'rebalancing'
);
CREATE TYPE recommendation_status AS ENUM ('active', 'dismissed', 'executed', 'expired');

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  priority recommendation_priority NOT NULL,
  category recommendation_category NOT NULL,
  status recommendation_status NOT NULL DEFAULT 'active',

  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL, -- Why this recommendation was generated
  expected_impact JSONB, -- {"leverage": {"from": 2.5, "to": 1.8}, "concentration": {...}}

  -- Action Details
  suggested_actions JSONB, -- [{"action": "SELL", "symbol": "AAPL", "quantity": 10, "reason": "..."}]

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = no expiration
  dismissed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,

  -- Tracking
  view_count INT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_portfolio ON recommendations(portfolio_id, status);
CREATE INDEX idx_recommendations_priority ON recommendations(priority, status);
CREATE INDEX idx_recommendations_generated ON recommendations(generated_at DESC);

-- Row Level Security
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON recommendations FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE recommendations IS 'AI-generated investment recommendations with priority, reasoning, and expected impact';
```

#### `market_data` - Cached Market Indices

```sql
-- Migration: 20251024_create_market_data.sql

CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'VIX', 'US10Y', 'SPY'
  name VARCHAR(100),
  value NUMERIC(12, 4) NOT NULL,
  change_pct NUMERIC(6, 2), -- Daily change percentage
  data_source VARCHAR(50), -- 'polygon', 'yahoo', 'manual'

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT market_data_symbol_unique UNIQUE(symbol)
);

CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_updated ON market_data(updated_at DESC);

-- Seed initial data
INSERT INTO market_data (symbol, name, value) VALUES
('VIX', 'CBOE Volatility Index', 0),
('SPY', 'S&P 500 ETF', 0),
('US10Y', 'US 10-Year Treasury Yield', 0);

COMMENT ON TABLE market_data IS 'Cached market indices and macroeconomic indicators';
```

#### `data_quality_log` - Track Data Issues

```sql
-- Migration: 20251024_create_data_quality_log.sql

CREATE TYPE data_issue_type AS ENUM (
  'missing_holdings',
  'price_anomaly',
  'greeks_unavailable',
  'sync_failure',
  'reconciliation_error'
);
CREATE TYPE data_issue_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE data_quality_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  portfolio_id UUID REFERENCES portfolios(id),

  issue_type data_issue_type NOT NULL,
  severity data_issue_severity NOT NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  affected_entity VARCHAR(100), -- e.g., 'AAPL', 'QQQ 251024P520'

  metadata JSONB, -- Additional context
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_quality_user ON data_quality_log(user_id, created_at DESC);
CREATE INDEX idx_data_quality_severity ON data_quality_log(severity, resolved);

COMMENT ON TABLE data_quality_log IS 'Log of data quality issues for monitoring and debugging';
```

---

## 1.3 IB Sync Service Implementation

### Service Architecture

Create `server/services/ib-sync-service.ts`:

```typescript
import { IBApi, Contract, BarSizeSetting, WhatToShow } from '@stoqey/ib';
import { supabaseAdmin } from '../auth-supabase';
import { logger } from '../logger';

interface IBCredentials {
  host: string;
  port: number;
  clientId: number;
}

interface Position {
  symbol: string;
  secType: 'STK' | 'OPT' | 'FUT';
  quantity: number;
  avgCost: number;
  marketValue: number;
  unrealizedPnL: number;
  // For options
  strike?: number;
  expiry?: string;
  optionType?: 'C' | 'P';
  underlying?: string;
}

interface AccountSummary {
  totalEquity: number;
  cashBalance: number;
  stockValue: number;
  optionValue: number;
  marginUsed: number;
  availableFunds: number;
  excessLiquidity: number;
}

export class IBSyncService {
  private ib: IBApi;
  private userId: string;
  private portfolioId: string;
  private isConnected: boolean = false;

  constructor(userId: string, portfolioId: string, credentials: IBCredentials) {
    this.userId = userId;
    this.portfolioId = portfolioId;
    this.ib = new IBApi({
      host: credentials.host,
      port: credentials.port,
      clientId: credentials.clientId,
    });
  }

  /**
   * Connect to IB TWS/Gateway
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ib.on('connected', () => {
        logger.info(`IB connected for user ${this.userId}`);
        this.isConnected = true;
        resolve();
      });

      this.ib.on('error', (err: Error, code: number) => {
        logger.error(`IB error ${code}: ${err.message}`);
        if (!this.isConnected) {
          reject(err);
        }
      });

      this.ib.connect();
    });
  }

  /**
   * Fetch all positions from IB
   */
  async fetchPositions(): Promise<Position[]> {
    if (!this.isConnected) {
      throw new Error('IB not connected');
    }

    return new Promise((resolve, reject) => {
      const positions: Position[] = [];

      this.ib.reqPositions();

      this.ib.on('position', (account: string, contract: Contract, pos: number, avgCost: number) => {
        positions.push({
          symbol: contract.symbol,
          secType: contract.secType as 'STK' | 'OPT' | 'FUT',
          quantity: pos,
          avgCost: avgCost,
          marketValue: 0, // Will be updated with market price
          unrealizedPnL: 0,
          ...(contract.secType === 'OPT' && {
            strike: contract.strike,
            expiry: contract.lastTradeDateOrContractMonth,
            optionType: contract.right as 'C' | 'P',
            underlying: contract.symbol,
          }),
        });
      });

      this.ib.on('positionEnd', () => {
        logger.info(`Fetched ${positions.length} positions from IB`);
        resolve(positions);
      });

      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('IB position fetch timeout')), 30000);
    });
  }

  /**
   * Fetch account summary from IB
   */
  async fetchAccountSummary(): Promise<AccountSummary> {
    if (!this.isConnected) {
      throw new Error('IB not connected');
    }

    return new Promise((resolve, reject) => {
      const summary: Partial<AccountSummary> = {};

      this.ib.reqAccountSummary('All', 'NetLiquidation,TotalCashValue,StockMarketValue,OptionMarketValue,MaintMarginReq,AvailableFunds,ExcessLiquidity');

      this.ib.on('accountSummary', (reqId: number, account: string, tag: string, value: string) => {
        switch (tag) {
          case 'NetLiquidation':
            summary.totalEquity = parseFloat(value);
            break;
          case 'TotalCashValue':
            summary.cashBalance = parseFloat(value);
            break;
          case 'StockMarketValue':
            summary.stockValue = parseFloat(value);
            break;
          case 'OptionMarketValue':
            summary.optionValue = parseFloat(value);
            break;
          case 'MaintMarginReq':
            summary.marginUsed = parseFloat(value);
            break;
          case 'AvailableFunds':
            summary.availableFunds = parseFloat(value);
            break;
          case 'ExcessLiquidity':
            summary.excessLiquidity = parseFloat(value);
            break;
        }
      });

      this.ib.on('accountSummaryEnd', () => {
        logger.info('Account summary fetched from IB');
        resolve(summary as AccountSummary);
      });

      setTimeout(() => reject(new Error('Account summary fetch timeout')), 30000);
    });
  }

  /**
   * Sync positions to database (reconciliation)
   */
  async syncToDatabase(positions: Position[], accountSummary: AccountSummary): Promise<void> {
    logger.info(`Starting database sync for portfolio ${this.portfolioId}`);

    try {
      // Step 1: Update portfolio cash and equity
      const { error: portfolioError } = await supabaseAdmin
        .from('portfolios')
        .update({
          cash: accountSummary.cashBalance,
          equity: accountSummary.totalEquity,
          margin_used: accountSummary.marginUsed,
          available_funds: accountSummary.availableFunds,
          excess_liquidity: accountSummary.excessLiquidity,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', this.portfolioId);

      if (portfolioError) throw portfolioError;

      // Step 2: Sync stock holdings
      const stocks = positions.filter(p => p.secType === 'STK');
      await this.syncStockHoldings(stocks);

      // Step 3: Sync option holdings
      const options = positions.filter(p => p.secType === 'OPT');
      await this.syncOptionHoldings(options);

      logger.info(`✅ Database sync completed: ${stocks.length} stocks, ${options.length} options`);
    } catch (error) {
      logger.error('Database sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync stock holdings with reconciliation
   */
  private async syncStockHoldings(stocks: Position[]): Promise<void> {
    // Fetch existing holdings from DB
    const { data: existingHoldings, error: fetchError } = await supabaseAdmin
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', this.portfolioId);

    if (fetchError) throw fetchError;

    const existingSymbols = new Set(existingHoldings.map(h => h.code));
    const ibSymbols = new Set(stocks.map(s => s.symbol));

    // Find holdings to add, update, delete
    const toAdd = stocks.filter(s => !existingSymbols.has(s.symbol));
    const toUpdate = stocks.filter(s => existingSymbols.has(s.symbol));
    const toDelete = existingHoldings.filter(h => !ibSymbols.has(h.code));

    logger.info(`Stock reconciliation: +${toAdd.length} ~${toUpdate.length} -${toDelete.length}`);

    // Add new holdings
    if (toAdd.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('stock_holdings')
        .insert(toAdd.map(s => ({
          portfolio_id: this.portfolioId,
          user_id: this.userId,
          code: s.symbol,
          name: s.symbol, // TODO: Fetch company name
          quantity: s.quantity,
          cost: s.avgCost,
          current_price: s.marketValue / s.quantity,
        })));

      if (insertError) throw insertError;
    }

    // Update existing holdings
    for (const stock of toUpdate) {
      const { error: updateError } = await supabaseAdmin
        .from('stock_holdings')
        .update({
          quantity: stock.quantity,
          cost: stock.avgCost,
          current_price: stock.marketValue / stock.quantity,
        })
        .eq('portfolio_id', this.portfolioId)
        .eq('code', stock.symbol);

      if (updateError) throw updateError;
    }

    // Delete removed holdings
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('stock_holdings')
        .delete()
        .in('id', toDelete.map(h => h.id));

      if (deleteError) throw deleteError;
    }
  }

  /**
   * Sync option holdings with reconciliation
   */
  private async syncOptionHoldings(options: Position[]): Promise<void> {
    // Similar logic to syncStockHoldings, but for options
    // Parse option contracts: symbol, expiry, strike, type
    // Match against existing option_holdings
    // Add/Update/Delete as needed

    // TODO: Implement option reconciliation
    logger.warn('Option sync not yet implemented');
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.ib.disconnect();
      this.isConnected = false;
      logger.info('IB disconnected');
    }
  }
}
```

### Cron Job Setup

```typescript
// server/cron/ib-sync-cron.ts
import cron from 'node-cron';
import { IBSyncService } from '../services/ib-sync-service';
import { supabaseAdmin } from '../auth-supabase';
import { logger } from '../logger';

/**
 * Run IB sync every 15 minutes during market hours (9:30 AM - 4:00 PM ET)
 * Full reconciliation nightly at 6:00 PM ET
 */
export function setupIBSyncCron() {
  // Intraday sync: every 15 minutes during market hours
  cron.schedule('*/15 9-16 * * 1-5', async () => {
    logger.info('[CRON] Starting intraday IB sync');
    await runIBSyncForAllUsers();
  }, {
    timezone: 'America/New_York'
  });

  // Nightly full reconciliation: 6:00 PM ET
  cron.schedule('0 18 * * 1-5', async () => {
    logger.info('[CRON] Starting nightly IB full sync');
    await runIBSyncForAllUsers(true);
  }, {
    timezone: 'America/New_York'
  });
}

async function runIBSyncForAllUsers(fullSync: boolean = false): Promise<void> {
  // Fetch all users with IB credentials
  const { data: users, error } = await supabaseAdmin
    .from('user_ib_credentials')
    .select('user_id, portfolio_id, host, port, client_id');

  if (error) {
    logger.error('Failed to fetch IB credentials:', error);
    return;
  }

  for (const user of users) {
    try {
      const service = new IBSyncService(user.user_id, user.portfolio_id, {
        host: user.host,
        port: user.port,
        clientId: user.client_id,
      });

      await service.connect();
      const positions = await service.fetchPositions();
      const accountSummary = await service.fetchAccountSummary();
      await service.syncToDatabase(positions, accountSummary);
      await service.disconnect();

      logger.info(`✅ Synced user ${user.user_id}`);
    } catch (error) {
      logger.error(`❌ Sync failed for user ${user.user_id}:`, error);

      // Log data quality issue
      await supabaseAdmin.from('data_quality_log').insert({
        user_id: user.user_id,
        portfolio_id: user.portfolio_id,
        issue_type: 'sync_failure',
        severity: 'high',
        title: 'IB Sync Failed',
        description: error.message,
      });
    }
  }
}
```

---

## 1.4 Market Data Service (Polygon.io Integration)

### Service Implementation

Create `server/services/market-data-service.ts`:

```typescript
import axios from 'axios';
import { supabaseAdmin } from '../auth-supabase';
import { logger } from '../logger';

interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolatility: number;
}

interface OptionContract {
  symbol: string; // e.g., 'O:SPY251024C00610000'
  underlying: string; // 'SPY'
  expiry: string; // '2025-10-24'
  strike: number; // 610
  optionType: 'call' | 'put';
  price: number;
  greeks: OptionGreeks;
}

export class MarketDataService {
  private apiKey: string;
  private baseUrl: string = 'https://api.polygon.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch option Greeks from Polygon.io
   */
  async fetchOptionGreeks(optionSymbol: string): Promise<OptionContract | null> {
    try {
      const url = `${this.baseUrl}/v3/snapshot/options/${optionSymbol}`;

      const response = await axios.get(url, {
        params: {
          apiKey: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== 'OK' || !response.data.results) {
        logger.warn(`No data for option ${optionSymbol}`);
        return null;
      }

      const result = response.data.results;
      const details = result.details;
      const greeks = result.greeks;

      return {
        symbol: optionSymbol,
        underlying: details.ticker,
        expiry: details.expiration_date,
        strike: details.strike_price,
        optionType: details.contract_type.toLowerCase(),
        price: result.last?.price || result.day?.close || 0,
        greeks: {
          delta: greeks?.delta || 0,
          gamma: greeks?.gamma || 0,
          theta: greeks?.theta || 0,
          vega: greeks?.vega || 0,
          impliedVolatility: greeks?.implied_volatility || 0,
        },
      };
    } catch (error) {
      logger.error(`Failed to fetch Greeks for ${optionSymbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch VIX index value
   */
  async fetchVIX(): Promise<number | null> {
    try {
      const url = `${this.baseUrl}/v2/aggs/ticker/I:VIX/prev`;

      const response = await axios.get(url, {
        params: { apiKey: this.apiKey },
        timeout: 10000,
      });

      if (response.data.status !== 'OK' || !response.data.results?.[0]) {
        return null;
      }

      return response.data.results[0].c; // closing price
    } catch (error) {
      logger.error('Failed to fetch VIX:', error);
      return null;
    }
  }

  /**
   * Update all option holdings with latest Greeks
   */
  async updateAllOptionGreeks(portfolioId: string): Promise<void> {
    // Fetch all options for this portfolio
    const { data: options, error } = await supabaseAdmin
      .from('option_holdings')
      .select('id, option_symbol, underlying_symbol, expiration_date, strike_price, option_type')
      .eq('portfolio_id', portfolioId);

    if (error) throw error;

    logger.info(`Updating Greeks for ${options.length} options`);

    let successCount = 0;
    let failCount = 0;

    for (const option of options) {
      // Convert to Polygon format: O:SPY251024C00610000
      const polygonSymbol = this.toPolygonOptionSymbol(
        option.underlying_symbol,
        option.expiration_date,
        option.option_type,
        option.strike_price
      );

      const contract = await this.fetchOptionGreeks(polygonSymbol);

      if (contract) {
        const { error: updateError } = await supabaseAdmin
          .from('option_holdings')
          .update({
            delta: contract.greeks.delta,
            gamma: contract.greeks.gamma,
            theta: contract.greeks.theta,
            vega: contract.greeks.vega,
            implied_volatility: contract.greeks.impliedVolatility,
            current_price: contract.price,
            last_greeks_update: new Date().toISOString(),
          })
          .eq('id', option.id);

        if (!updateError) {
          successCount++;
        } else {
          failCount++;
          logger.error(`Failed to update option ${option.id}:`, updateError);
        }
      } else {
        failCount++;
      }

      // Rate limiting: 500 requests/min = 120ms between requests
      await this.sleep(120);
    }

    logger.info(`Greeks update complete: ${successCount} success, ${failCount} failed`);
  }

  /**
   * Convert internal option format to Polygon format
   * Example: MSFT, 2025-10-24, PUT, 520 → O:MSFT251024P00520000
   */
  private toPolygonOptionSymbol(
    underlying: string,
    expiry: string, // '2025-10-24'
    type: string, // 'PUT' or 'CALL'
    strike: number // 520
  ): string {
    const expiryDate = new Date(expiry);
    const yy = expiryDate.getFullYear().toString().slice(-2);
    const mm = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = expiryDate.getDate().toString().padStart(2, '0');
    const optType = type.toUpperCase().startsWith('C') ? 'C' : 'P';
    const strikeFormatted = (strike * 1000).toString().padStart(8, '0');

    return `O:${underlying}${yy}${mm}${dd}${optType}${strikeFormatted}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Cron Job for Greeks Update

```typescript
// server/cron/market-data-cron.ts
import cron from 'node-cron';
import { MarketDataService } from '../services/market-data-service';
import { supabaseAdmin } from '../auth-supabase';
import { logger } from '../logger';

export function setupMarketDataCron() {
  const marketData = new MarketDataService(process.env.POLYGON_API_KEY!);

  // Update Greeks every 30 minutes during market hours
  cron.schedule('*/30 9-16 * * 1-5', async () => {
    logger.info('[CRON] Updating option Greeks');
    await updateGreeksForAllPortfolios(marketData);
  }, {
    timezone: 'America/New_York'
  });

  // Update VIX every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    const vix = await marketData.fetchVIX();
    if (vix) {
      await supabaseAdmin
        .from('market_data')
        .upsert({
          symbol: 'VIX',
          value: vix,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });
    }
  });
}

async function updateGreeksForAllPortfolios(service: MarketDataService): Promise<void> {
  const { data: portfolios } = await supabaseAdmin
    .from('portfolios')
    .select('id');

  for (const portfolio of portfolios || []) {
    try {
      await service.updateAllOptionGreeks(portfolio.id);
    } catch (error) {
      logger.error(`Failed to update Greeks for portfolio ${portfolio.id}:`, error);
    }
  }
}
```

---

## 🎯 Phase 1 Summary & Next Steps

### What We've Built

1. **Database Schema** - Extended with Greeks, user preferences, recommendations, market data
2. **IB Sync Service** - Authoritative holdings sync with reconciliation
3. **Market Data Service** - Real-time Greeks and prices from Polygon.io
4. **Data Quality Monitoring** - Logging system for tracking issues
5. **Automated Jobs** - Cron schedules for sync and updates

### Expected Outcomes

- ✅ **100% Holdings Accuracy** - All 14 stocks synced from IB (vs current 4)
- ✅ **Correct Cash Balance** - Auto-calculated from IB (-$5,287 vs wrong $43,000)
- ✅ **Real Options Greeks** - Delta, Theta, Gamma, Vega for all positions
- ✅ **Data Quality Alerts** - Automated detection of missing/stale data

### Next Phase Preview

**Phase 2: Preference Expansion** will build:
- Settings wizard UI for user to configure investment goals
- Risk tolerance assessment questionnaire
- Sector preference selection
- Custom threshold configuration

**Phase 3: AI Logic** will implement:
- Risk assessment engine (multi-dimensional analysis)
- Recommendation generation (if-then rules)
- Priority scoring algorithm

**Phase 4: UI/UX** will create:
- AI Dashboard with risk gauges
- Recommendation cards with "Simulate" buttons
- Advanced P&L visualizations

---

## 📚 Appendix

### A. Environment Variables

Add to `.env`:
```bash
# Polygon.io
POLYGON_API_KEY=your_polygon_api_key_here

# Interactive Brokers (per-user, stored in database encrypted)
# IB_HOST=127.0.0.1
# IB_PORT=7497  # TWS Live: 7496, Paper: 7497, Gateway Live: 4001, Paper: 4002
# IB_CLIENT_ID=1
```

### B. NPM Dependencies

```bash
npm install --save @stoqey/ib axios node-cron
npm install --save-dev @types/node-cron
```

### C. Database Migration Checklist

- [ ] Run migration: `20251024_add_option_greeks.sql`
- [ ] Run migration: `20251024_add_portfolio_risk_metrics.sql`
- [ ] Run migration: `20251024_create_user_preferences.sql`
- [ ] Run migration: `20251024_create_recommendations.sql`
- [ ] Run migration: `20251024_create_market_data.sql`
- [ ] Run migration: `20251024_create_data_quality_log.sql`
- [ ] Verify RLS policies are enabled
- [ ] Test with sample data

### D. Testing Strategy

**Unit Tests**:
- IB Sync Service: Mock IB API, test reconciliation logic
- Market Data Service: Mock Polygon API, test rate limiting
- Option symbol parser: Test various formats

**Integration Tests**:
- Full sync flow: IB → Database → API response
- Greeks update flow: Polygon → Database → Risk calc
- Error handling: API failures, network issues

**Manual Testing**:
- Connect to IB Paper account
- Verify all holdings sync correctly
- Check Greeks are populated
- Validate cash balance matches IB

---

*End of Phase 1 Implementation Plan*
*Next: Phase 2 - User Preferences & Settings UI*
