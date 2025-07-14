-- Fix UUID mismatch and properly configure Supabase
-- This migration fixes the data type mismatches and ensures proper RLS policies

-- First, check if we have any existing data that needs to be migrated
DO $$
BEGIN
    -- Check if portfolios table exists with integer IDs
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'id' 
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Found old schema with integer IDs. Please run migration script 002_migrate_user_data.ts first.';
        RAISE EXCEPTION 'Cannot proceed: Old schema detected. Run data migration first.';
    END IF;
END $$;

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add helper function to get current user ID (useful for debugging)
CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT auth.uid()
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth.get_current_user_id() TO authenticated;

-- Create function to automatically set user_id on insert for portfolios
CREATE OR REPLACE FUNCTION public.set_portfolio_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id is not provided, set it to the current user
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    -- If user_id is provided but doesn't match current user, reject
    ELSIF NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot create portfolio for another user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id for portfolios
DROP TRIGGER IF EXISTS set_portfolio_user_id_trigger ON public.portfolios;
CREATE TRIGGER set_portfolio_user_id_trigger
    BEFORE INSERT ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION public.set_portfolio_user_id();

-- Update RLS policies to be more robust
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can create own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolios" ON public.portfolios;

-- Create new, more robust policies for portfolios
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT 
    USING (
        auth.uid() = user_id
        OR 
        -- Allow service role to see all (for admin/debugging)
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can create own portfolios" ON public.portfolios
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id
        OR 
        -- Allow if user_id is null (will be set by trigger)
        user_id IS NULL
    );

CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); -- Prevent changing user_id

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create function to help debug RLS issues
CREATE OR REPLACE FUNCTION public.debug_rls_portfolio(portfolio_id UUID)
RETURNS TABLE (
    current_user_id UUID,
    portfolio_user_id UUID,
    can_access BOOLEAN,
    jwt_role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as current_user_id,
        p.user_id as portfolio_user_id,
        (auth.uid() = p.user_id) as can_access,
        auth.jwt() ->> 'role' as jwt_role
    FROM public.portfolios p
    WHERE p.id = portfolio_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_rls_portfolio(UUID) TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id_name ON public.portfolios(user_id, name);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_symbol ON public.stock_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_option_holdings_symbol ON public.option_holdings(underlying_symbol);

-- Create view for easier portfolio summary access
CREATE OR REPLACE VIEW public.portfolio_summary AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.total_equity,
    p.cash_balance,
    p.margin_used,
    COALESCE(COUNT(DISTINCT sh.id), 0) as stock_count,
    COALESCE(COUNT(DISTINCT oh.id), 0) as option_count,
    p.created_at,
    p.updated_at
FROM public.portfolios p
LEFT JOIN public.stock_holdings sh ON sh.portfolio_id = p.id
LEFT JOIN public.option_holdings oh ON oh.portfolio_id = p.id
GROUP BY p.id;

-- Grant access to the view
GRANT SELECT ON public.portfolio_summary TO authenticated;

-- Apply RLS to the view
ALTER VIEW public.portfolio_summary SET (security_invoker = true);

-- Add helper function to create default portfolio for new users
CREATE OR REPLACE FUNCTION public.create_default_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a default portfolio for new users
    INSERT INTO public.portfolios (user_id, name, total_equity, cash_balance, margin_used)
    VALUES (NEW.id, '我的投资组合', 1000000.00, 1000000.00, 0.00);
    
    -- Also create default risk settings
    INSERT INTO public.risk_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To enable automatic portfolio creation for new users, run this in Supabase dashboard:
-- CREATE TRIGGER create_default_portfolio_trigger
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.create_default_portfolio();

-- Add function to safely migrate integer portfolio IDs to UUIDs if needed
CREATE OR REPLACE FUNCTION public.migrate_portfolio_id(old_id TEXT)
RETURNS UUID AS $$
DECLARE
    new_uuid UUID;
BEGIN
    -- Check if it's already a valid UUID
    BEGIN
        new_uuid := old_id::UUID;
        RETURN new_uuid;
    EXCEPTION WHEN OTHERS THEN
        -- Not a valid UUID, generate a new one
        -- This creates a deterministic UUID from the integer ID
        new_uuid := uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, 'portfolio-' || old_id);
        RETURN new_uuid;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function to check portfolio access (useful for debugging)
CREATE OR REPLACE FUNCTION public.check_portfolio_access(portfolio_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    portfolio_exists BOOLEAN;
    portfolio_owner UUID;
    current_user UUID;
BEGIN
    current_user := auth.uid();
    
    -- Check if portfolio exists
    SELECT EXISTS(SELECT 1 FROM public.portfolios WHERE id = portfolio_id) INTO portfolio_exists;
    
    -- Get portfolio owner
    SELECT user_id INTO portfolio_owner FROM public.portfolios WHERE id = portfolio_id;
    
    result := jsonb_build_object(
        'portfolio_id', portfolio_id,
        'portfolio_exists', portfolio_exists,
        'portfolio_owner', portfolio_owner,
        'current_user', current_user,
        'has_access', current_user = portfolio_owner,
        'auth_role', auth.jwt() ->> 'role'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_portfolio_access(UUID) TO authenticated;