import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const portfolioId = req.query.portfolioId as string;

  if (!portfolioId) {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  try {
    const authHeader = req.headers.authorization;
    const isGuestMode = req.headers['x-guest-user'] === 'true';

    // Handle guest mode
    if (isGuestMode || !authHeader) {
      return res.status(200).json({
        portfolioId: portfolioId,
        leverageRatio: '0.00',
        portfolioBeta: '0.00',
        maxConcentration: '0.00',
        marginUsage: '0.00',
        cashRatio: '100.00',
        riskLevel: 'low',
        lastCalculated: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user authentication
    const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

    // Fetch portfolio details
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      console.error('Portfolio error:', portfolioError);
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Verify portfolio belongs to user
    if (portfolio.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch stock holdings
    const { data: stocks, error: stocksError } = await supabaseAdmin
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (stocksError) {
      console.error('Stocks error:', stocksError);
      return res.status(500).json({ error: 'Failed to fetch stocks' });
    }

    // Fetch option holdings
    const { data: options, error: optionsError } = await supabaseAdmin
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (optionsError) {
      console.error('Options error:', optionsError);
      return res.status(500).json({ error: 'Failed to fetch options' });
    }

    // Calculate risk metrics
    const totalEquity = parseFloat(portfolio.total_equity || '0');
    const cashBalance = parseFloat(portfolio.cash_balance || '0');
    const marginUsed = parseFloat(portfolio.margin_used || '0');

    // Calculate stock metrics
    let totalStockValue = 0;
    let weightedBeta = 0;
    let maxStockValue = 0;

    (stocks || []).forEach((stock: any) => {
      const quantity = parseFloat(stock.quantity || '0');
      const currentPrice = parseFloat(stock.current_price || '0');
      const beta = parseFloat(stock.beta || '1.0');

      const stockValue = quantity * currentPrice;
      totalStockValue += stockValue;
      weightedBeta += stockValue * beta;

      if (stockValue > maxStockValue) {
        maxStockValue = stockValue;
      }
    });

    // Calculate option metrics (simplified - options reduce buying power)
    let totalOptionValue = 0;
    (options || []).forEach((option: any) => {
      const contracts = parseFloat(option.contracts || '0');
      const currentPrice = parseFloat(option.current_price || '0');
      // Each contract = 100 shares
      totalOptionValue += contracts * currentPrice * 100;
    });

    const totalMarketValue = totalStockValue + totalOptionValue;

    // Calculate risk indicators
    const leverageRatio = totalEquity > 0 ? totalMarketValue / totalEquity : 0;
    const portfolioBeta = totalStockValue > 0 ? weightedBeta / totalStockValue : 0;
    const maxConcentration = totalMarketValue > 0 ? (maxStockValue / totalMarketValue) * 100 : 0;
    const marginUsageRatio = totalEquity > 0 ? (marginUsed / totalEquity) * 100 : 0;
    const cashRatio = totalEquity > 0 ? (cashBalance / totalEquity) * 100 : 0;

    // Determine risk level
    let riskLevel = 'low';
    if (leverageRatio >= 1.5 || maxConcentration >= 30 || marginUsageRatio >= 70) {
      riskLevel = 'high';
    } else if (leverageRatio >= 1.0 || maxConcentration >= 20 || marginUsageRatio >= 50) {
      riskLevel = 'medium';
    }

    const riskMetrics = {
      portfolioId: portfolioId,
      leverageRatio: leverageRatio.toFixed(2),
      portfolioBeta: portfolioBeta.toFixed(2),
      maxConcentration: maxConcentration.toFixed(2),
      // Support both field naming conventions for compatibility
      marginUsage: marginUsageRatio.toFixed(2),
      marginUsageRatio: marginUsageRatio.toFixed(2),
      cashRatio: cashRatio.toFixed(2),
      remainingLiquidity: cashRatio.toFixed(2),
      totalMarketValue: totalMarketValue.toFixed(2),
      totalStockValue: totalStockValue.toFixed(2),
      stockValue: totalStockValue.toFixed(2), // Alias for frontend compatibility
      totalOptionValue: totalOptionValue.toFixed(2),
      optionMaxLoss: totalOptionValue.toFixed(2), // Alias for frontend compatibility
      totalEquity: totalEquity.toFixed(2),
      cashBalance: cashBalance.toFixed(2),
      marginUsed: marginUsed.toFixed(2),
      riskLevel: riskLevel,
      lastCalculated: new Date().toISOString()
    };

    res.status(200).json(riskMetrics);
  } catch (error) {
    console.error('Error in GET /portfolio-risk-simple:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}