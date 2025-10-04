-- Step 3: Update foreign key relationships

-- First drop old foreign key constraints on integer-based tables
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey;
ALTER TABLE stock_holdings DROP CONSTRAINT IF EXISTS stock_holdings_portfolio_id_fkey;
ALTER TABLE option_holdings DROP CONSTRAINT IF EXISTS option_holdings_portfolio_id_fkey;
ALTER TABLE risk_metrics DROP CONSTRAINT IF EXISTS risk_metrics_portfolio_id_fkey;
ALTER TABLE risk_settings DROP CONSTRAINT IF EXISTS risk_settings_user_id_fkey;
ALTER TABLE risk_history DROP CONSTRAINT IF EXISTS risk_history_portfolio_id_fkey;

-- Step 4: Delete old tables and rename new tables

-- Drop old integer-based tables
DROP TABLE IF EXISTS risk_history CASCADE;
DROP TABLE IF EXISTS risk_metrics CASCADE;
DROP TABLE IF EXISTS option_holdings CASCADE;
DROP TABLE IF EXISTS stock_holdings CASCADE;
DROP TABLE IF EXISTS risk_settings CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Rename new UUID-based tables to original names
ALTER TABLE portfolios_new RENAME TO portfolios;
ALTER TABLE stock_holdings_new RENAME TO stock_holdings;
ALTER TABLE option_holdings_new RENAME TO option_holdings;
ALTER TABLE risk_metrics_new RENAME TO risk_metrics;
ALTER TABLE risk_settings_new RENAME TO risk_settings;
ALTER TABLE risk_history_new RENAME TO risk_history;

-- Step 5: Update RLS policies

-- Enable RLS on all tables
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolios
CREATE POLICY "Users can view their own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for stock_holdings
CREATE POLICY "Users can view holdings in their portfolios" ON stock_holdings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create holdings in their portfolios" ON stock_holdings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update holdings in their portfolios" ON stock_holdings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete holdings in their portfolios" ON stock_holdings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Create similar RLS policies for option_holdings
CREATE POLICY "Users can view option holdings in their portfolios" ON option_holdings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create option holdings in their portfolios" ON option_holdings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update option holdings in their portfolios" ON option_holdings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete option holdings in their portfolios" ON option_holdings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Create RLS policies for risk_metrics
CREATE POLICY "Users can view risk metrics for their portfolios" ON risk_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = risk_metrics.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create risk metrics for their portfolios" ON risk_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = risk_metrics.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Create RLS policies for risk_settings
CREATE POLICY "Users can view their own risk settings" ON risk_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own risk settings" ON risk_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own risk settings" ON risk_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for risk_history
CREATE POLICY "Users can view risk history for their portfolios" ON risk_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = risk_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create risk history for their portfolios" ON risk_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = risk_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Verify the migration is complete
SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM portfolios) as portfolios_count,
    (SELECT COUNT(*) FROM stock_holdings) as stock_holdings_count,
    (SELECT COUNT(*) FROM option_holdings) as option_holdings_count,
    (SELECT COUNT(*) FROM risk_metrics) as risk_metrics_count,
    (SELECT COUNT(*) FROM risk_settings) as risk_settings_count,
    (SELECT COUNT(*) FROM risk_history) as risk_history_count;

-- Check that the data is accessible by the user
SELECT * FROM portfolios WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'::uuid;