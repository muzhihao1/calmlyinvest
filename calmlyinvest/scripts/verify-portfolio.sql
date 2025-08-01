-- 验证用户 279838958@qq.com 的持仓更新
-- Verify portfolio update for user 279838958@qq.com

-- 1. 查看用户和投资组合信息
SELECT 
  u.email,
  p.id as portfolio_id,
  p.name as portfolio_name,
  p.total_equity,
  p.cash_balance,
  p.margin_used,
  p.updated_at
FROM auth.users u
JOIN portfolios p ON p.user_id = u.id
WHERE u.email = '279838958@qq.com';

-- 2. 查看股票持仓
SELECT 
  sh.symbol,
  sh.name,
  sh.quantity,
  sh.cost_price,
  sh.current_price,
  (sh.quantity * sh.current_price::numeric) as market_value
FROM stock_holdings sh
JOIN portfolios p ON sh.portfolio_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = '279838958@qq.com'
ORDER BY sh.symbol;

-- 3. 查看期权持仓
SELECT 
  oh.underlying_symbol,
  oh.option_symbol,
  oh.option_type,
  oh.direction,
  oh.contracts,
  oh.strike_price,
  oh.expiration_date,
  oh.cost_price,
  oh.current_price,
  oh.delta_value
FROM option_holdings oh
JOIN portfolios p ON oh.portfolio_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = '279838958@qq.com'
ORDER BY oh.underlying_symbol, oh.expiration_date;

-- 4. 汇总统计
WITH portfolio_stats AS (
  SELECT 
    p.id,
    COUNT(DISTINCT sh.id) as stock_count,
    COUNT(DISTINCT oh.id) as option_count,
    SUM(sh.quantity * sh.current_price::numeric) as total_stock_value
  FROM portfolios p
  JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN stock_holdings sh ON sh.portfolio_id = p.id
  LEFT JOIN option_holdings oh ON oh.portfolio_id = p.id
  WHERE u.email = '279838958@qq.com'
  GROUP BY p.id
)
SELECT 
  stock_count as "股票数量",
  option_count as "期权数量",
  total_stock_value as "股票总市值",
  '更新成功！' as "状态"
FROM portfolio_stats;