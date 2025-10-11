-- Delete ROLLED option holdings that are invisible in UI but consuming margin
-- Run this in Supabase SQL Editor

-- First, check what we're about to delete
SELECT
  id,
  option_symbol,
  underlying_symbol,
  option_type,
  direction,
  contracts,
  strike_price,
  expiration_date,
  status,
  cost_price,
  current_price
FROM option_holdings
WHERE id IN (
  'c01d8cb8-99b2-4c1b-b00a-90d6195fcf08',  -- QQQ251003P600
  '70331027-593f-4a39-ac77-179ae2767ad1'   -- NVDA251017P175
);

-- Delete any rollover records first (to avoid FK constraint violations)
DELETE FROM option_rollovers
WHERE old_option_id IN (
  'c01d8cb8-99b2-4c1b-b00a-90d6195fcf08',
  '70331027-593f-4a39-ac77-179ae2767ad1'
)
OR new_option_id IN (
  'c01d8cb8-99b2-4c1b-b00a-90d6195fcf08',
  '70331027-593f-4a39-ac77-179ae2767ad1'
);

-- Now delete the option holdings
DELETE FROM option_holdings
WHERE id IN (
  'c01d8cb8-99b2-4c1b-b00a-90d6195fcf08',  -- QQQ251003P600
  '70331027-593f-4a39-ac77-179ae2767ad1'   -- NVDA251017P175
);

-- Reset margin_used to 0 for portfolio with no holdings
UPDATE portfolios
SET margin_used = 0.00
WHERE id = '186ecd89-e268-43c4-b3d5-3441a2082cf5'
  AND NOT EXISTS (
    SELECT 1 FROM stock_holdings WHERE portfolio_id = '186ecd89-e268-43c4-b3d5-3441a2082cf5'
  )
  AND NOT EXISTS (
    SELECT 1 FROM option_holdings WHERE portfolio_id = '186ecd89-e268-43c4-b3d5-3441a2082cf5'
  );

-- Verify the result
SELECT
  id,
  total_equity,
  cash_balance,
  margin_used
FROM portfolios
WHERE id = '186ecd89-e268-43c4-b3d5-3441a2082cf5';
