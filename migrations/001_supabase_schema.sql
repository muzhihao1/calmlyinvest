-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS risk_history CASCADE;
DROP TABLE IF EXISTS risk_metrics CASCADE;
DROP TABLE IF EXISTS risk_settings CASCADE;
DROP TABLE IF EXISTS option_holdings CASCADE;
DROP TABLE IF EXISTS stock_holdings CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create portfolios table
CREATE TABLE public.portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    total_equity DECIMAL(15, 2),
    cash_balance DECIMAL(15, 2),
    margin_used DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create stock_holdings table
CREATE TABLE public.stock_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10, 4) NOT NULL,
    current_price DECIMAL(10, 4),
    beta DECIMAL(6, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create option_holdings table
CREATE TABLE public.option_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    option_symbol TEXT NOT NULL,
    underlying_symbol TEXT NOT NULL,
    option_type TEXT NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    contracts INTEGER NOT NULL,
    strike_price DECIMAL(10, 4) NOT NULL,
    expiration_date DATE NOT NULL,
    cost_price DECIMAL(10, 4) NOT NULL,
    current_price DECIMAL(10, 4),
    delta_value DECIMAL(6, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_metrics table
CREATE TABLE public.risk_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    leverage_ratio DECIMAL(6, 4),
    portfolio_beta DECIMAL(6, 4),
    max_concentration DECIMAL(6, 4),
    margin_usage_ratio DECIMAL(6, 4),
    risk_level TEXT CHECK (risk_level IN ('GREEN', 'YELLOW', 'RED')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_settings table
CREATE TABLE public.risk_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    leverage_safe_threshold DECIMAL(4, 2) DEFAULT 1.0,
    leverage_warning_threshold DECIMAL(4, 2) DEFAULT 1.5,
    concentration_limit DECIMAL(4, 2) DEFAULT 20.0,
    industry_concentration_limit DECIMAL(4, 2) DEFAULT 60.0,
    min_cash_ratio DECIMAL(4, 2) DEFAULT 30.0,
    leverage_alerts BOOLEAN DEFAULT TRUE,
    expiration_alerts BOOLEAN DEFAULT TRUE,
    volatility_alerts BOOLEAN DEFAULT FALSE,
    data_update_frequency INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_history table
CREATE TABLE public.risk_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    leverage_ratio DECIMAL(10, 4),
    portfolio_beta DECIMAL(10, 4),
    max_concentration DECIMAL(10, 4),
    margin_usage_ratio DECIMAL(10, 4),
    remaining_liquidity DECIMAL(20, 2),
    risk_level TEXT,
    stock_value DECIMAL(20, 2),
    option_max_loss DECIMAL(20, 2),
    total_equity DECIMAL(20, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_stock_holdings_portfolio_id ON public.stock_holdings(portfolio_id);
CREATE INDEX idx_option_holdings_portfolio_id ON public.option_holdings(portfolio_id);
CREATE INDEX idx_risk_metrics_portfolio_id ON public.risk_metrics(portfolio_id);
CREATE INDEX idx_risk_history_portfolio_id ON public.risk_history(portfolio_id);
CREATE INDEX idx_risk_history_recorded_at ON public.risk_history(recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stock_holdings
CREATE POLICY "Users can view own stock holdings" ON public.stock_holdings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own stock holdings" ON public.stock_holdings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own stock holdings" ON public.stock_holdings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own stock holdings" ON public.stock_holdings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = stock_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Similar RLS policies for option_holdings
CREATE POLICY "Users can view own option holdings" ON public.option_holdings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own option holdings" ON public.option_holdings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own option holdings" ON public.option_holdings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own option holdings" ON public.option_holdings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = option_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- RLS policies for risk_metrics
CREATE POLICY "Users can view own risk metrics" ON public.risk_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = risk_metrics.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own risk metrics" ON public.risk_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = risk_metrics.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- RLS policies for risk_settings
CREATE POLICY "Users can view own risk settings" ON public.risk_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own risk settings" ON public.risk_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk settings" ON public.risk_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for risk_history
CREATE POLICY "Users can view own risk history" ON public.risk_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = risk_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own risk history" ON public.risk_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = risk_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_holdings_updated_at BEFORE UPDATE ON public.stock_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_holdings_updated_at BEFORE UPDATE ON public.option_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_settings_updated_at BEFORE UPDATE ON public.risk_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();