# Data Restoration Instructions for User 279838958@qq.com

## Overview
This guide explains how to restore data for user 279838958@qq.com (UUID: 8e82d664-5ef9-47c1-a540-9af664860a7c) in the Supabase database.

## Issue Background
- The database has Row Level Security (RLS) enabled
- Direct REST API calls with the anon key are blocked by RLS policies
- There's no unique constraint on (user_id, name) in the portfolios table, so we can't use UPSERT

## Solution Options

### Option 1: Use Supabase Dashboard SQL Editor (Recommended)
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to the SQL Editor
3. Copy the entire contents of `restore_user_data_final.sql`
4. Paste and execute the SQL
5. Check the results in the output panel

### Option 2: Use Supabase Service Role Key
If you have the service role key (which bypasses RLS):

1. Add to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. Run the TypeScript restoration script:
   ```bash
   npx tsx scripts/restore-user-data.ts
   ```

### Option 3: Temporarily Disable RLS (Not Recommended for Production)
```sql
-- Disable RLS temporarily
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings DISABLE ROW LEVEL SECURITY;

-- Run the restoration SQL
-- ... (contents of restore_user_data_final.sql)

-- Re-enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;
```

## Data Being Restored

### Portfolio
- Name: Main Portfolio
- Total Equity: 44,337.96
- Cash Balance: 14,387.18
- Margin Used: 40,580.97

### Stock Holdings (5 stocks)
1. AMZN - 50 shares @ $150.00 (current: $190.00)
2. CRWD - 30 shares @ $180.00 (current: $360.00)
3. PLTR - 200 shares @ $25.00 (current: $32.00)
4. SHOP - 40 shares @ $70.00 (current: $95.00)
5. TSLA - 20 shares @ $200.00 (current: $390.00)

### Option Holdings (4 options)
1. MSFT PUT 440 (Mar 21, 2025) - SELL 2 contracts
2. AAPL CALL 200 (Apr 18, 2025) - BUY 5 contracts
3. GOOGL PUT 190 (Jun 20, 2025) - SELL 3 contracts
4. NVDA CALL 130 (May 16, 2025) - BUY 10 contracts

### Risk Settings
- Leverage Safe Threshold: 1.0
- Leverage Warning Threshold: 1.5
- Concentration Limit: 20%
- Industry Concentration Limit: 60%
- Min Cash Ratio: 30%
- Alerts: Leverage (ON), Expiration (ON), Volatility (OFF)
- Update Frequency: 5 minutes

## Verification
After running the restoration, the SQL will output verification results showing:
- Number of portfolios created
- Number of stock holdings created
- Number of option holdings created
- Risk settings status
- Portfolio summary with counts

## Troubleshooting

### If you get "relation does not exist" error:
- Make sure you're connected to the correct database
- Check that all tables have been created with the schema in `supabase/schema-auth.sql`

### If you get RLS policy violations:
- Use Option 1 (SQL Editor) or Option 2 (Service Role Key)
- The anon key cannot bypass RLS policies

### If portfolio already exists:
- The script checks for existing portfolios and won't create duplicates
- It will use the existing portfolio ID for holdings

## Next Steps
After successful restoration:
1. Log into the application with email: 279838958@qq.com
2. Verify all holdings appear correctly
3. Check that risk calculations are working
4. Test portfolio updates and modifications