import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { extractToken } from './_helpers/token-parser';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Lazy load yahoo-finance2 to avoid initialization issues
 */
let yahooFinanceModule: any = null;

async function getYahooFinance() {
  if (!yahooFinanceModule) {
    try {
      yahooFinanceModule = await import('yahoo-finance2');
      if (yahooFinanceModule.default) {
        yahooFinanceModule = yahooFinanceModule.default;
      }
    } catch (error) {
      console.error('Failed to load yahoo-finance2:', error);
      throw new Error('Yahoo Finance module not available');
    }
  }
  return yahooFinanceModule;
}

/**
 * Fetch current stock price and beta from Yahoo Finance
 */
async function fetchStockData(symbol: string): Promise<{ price: number; beta: number; name: string } | null> {
  try {
    const yahooFinance = await getYahooFinance();

    // Fetch quote for current price
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice || quote.ask || quote.bid || 0;
    const name = quote.longName || quote.shortName || symbol;

    // Fetch beta from quoteSummary
    let beta = 1.0;
    try {
      const summary = await yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics'] });
      beta = summary.defaultKeyStatistics?.beta || 1.0;
    } catch (betaError) {
      console.warn(`Failed to fetch beta for ${symbol}, using default 1.0:`, betaError);
    }

    return { price, beta, name };
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Estimate option price based on underlying stock price
 * Note: This is a simplified estimation. Full option chain data would require more complex implementation.
 */
async function estimateOptionPrice(optionSymbol: string, underlyingSymbol: string): Promise<number | null> {
  try {
    // Fetch underlying stock price
    const stockData = await fetchStockData(underlyingSymbol);
    if (!stockData) return null;

    const stockPrice = stockData.price;

    // Parse option symbol to extract strike price and type
    // Format: "MSFT 250718P500" -> Strike: 500, Type: Put
    const match = optionSymbol.match(/(\d+)$/);
    const strikePrice = match ? parseInt(match[1]) : 100;

    const isCall = optionSymbol.includes('C');
    const inTheMoney = isCall ? (stockPrice > strikePrice) : (stockPrice < strikePrice);

    // Simple estimation
    if (inTheMoney) {
      return Math.abs(stockPrice - strikePrice) + (stockPrice * 0.02);
    } else {
      return stockPrice * 0.02;
    }
  } catch (error) {
    console.error(`Failed to estimate option price for ${optionSymbol}:`, error);
    return null;
  }
}

/**
 * Refresh market prices for portfolio holdings
 * POST /api/portfolio-refresh-prices-simple?portfolioId=xxx
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
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

    // Handle guest mode - cannot refresh prices for guest portfolios
    if (isGuestMode || !authHeader) {
      return res.status(403).json({
        error: 'Price refresh is not available in guest mode',
        message: 'Please sign in to refresh market prices'
      });
    }

    const token = extractToken(authHeader);

    if (!token) {
      console.error('[portfolio-refresh-prices-simple] Token extraction failed');
      return res.status(401).json({ error: 'Invalid or malformed authorization token' });
    }

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

    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      console.error('Portfolio error:', portfolioError);
      return res.status(404).json({ error: 'Portfolio not found' });
    }

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

    // Fetch option holdings (only ACTIVE ones for price refresh)
    const { data: options, error: optionsError} = await supabaseAdmin
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('status', 'ACTIVE');

    if (optionsError) {
      console.error('Options error:', optionsError);
      return res.status(500).json({ error: 'Failed to fetch options' });
    }

    // Update stock prices
    let stocksUpdated = 0;
    const stockUpdatePromises = (stocks || []).map(async (stock: any) => {
      const stockData = await fetchStockData(stock.symbol);

      if (stockData) {
        const { error: updateError } = await supabaseAdmin
          .from('stock_holdings')
          .update({
            current_price: stockData.price.toFixed(2),
            beta: stockData.beta.toFixed(2),
            name: stockData.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', stock.id);

        if (!updateError) {
          stocksUpdated++;
          console.log(`Updated ${stock.symbol}: $${stockData.price.toFixed(2)}, beta: ${stockData.beta.toFixed(2)}`);
        } else {
          console.error(`Failed to update ${stock.symbol}:`, updateError);
        }
      }
    });

    // Update option prices
    let optionsUpdated = 0;
    const optionUpdatePromises = (options || []).map(async (option: any) => {
      const estimatedPrice = await estimateOptionPrice(option.option_symbol, option.underlying_symbol);

      if (estimatedPrice !== null) {
        const { error: updateError } = await supabaseAdmin
          .from('option_holdings')
          .update({
            current_price: estimatedPrice.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('id', option.id);

        if (!updateError) {
          optionsUpdated++;
          console.log(`Updated option ${option.option_symbol}: $${estimatedPrice.toFixed(2)}`);
        } else {
          console.error(`Failed to update option ${option.option_symbol}:`, updateError);
        }
      }
    });

    // Execute all updates in parallel
    await Promise.all([...stockUpdatePromises, ...optionUpdatePromises]);

    // Calculate and update portfolio total_equity
    // Fetch updated holdings to get current prices
    const { data: updatedStocks } = await supabaseAdmin
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    const { data: updatedOptions } = await supabaseAdmin
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('status', 'ACTIVE');

    // Calculate total stock value
    const totalStockValue = (updatedStocks || []).reduce((sum: number, stock: any) => {
      return sum + (stock.quantity * parseFloat(stock.current_price || '0'));
    }, 0);

    // Calculate total option value (contracts * price * 100)
    const totalOptionValue = (updatedOptions || []).reduce((sum: number, option: any) => {
      return sum + (option.contracts * parseFloat(option.current_price || '0') * 100);
    }, 0);

    // Calculate total equity = stock value + option value + cash - margin
    const cashBalance = parseFloat(portfolio.cash_balance || '0');
    const marginUsed = parseFloat(portfolio.margin_used || '0');
    const totalEquity = totalStockValue + totalOptionValue + cashBalance - marginUsed;

    // Update portfolio total_equity
    await supabaseAdmin
      .from('portfolios')
      .update({
        total_equity: totalEquity.toFixed(2),
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);

    res.status(200).json({
      success: true,
      stocksUpdated,
      optionsUpdated,
      totalStocks: (stocks || []).length,
      totalOptions: (options || []).length,
      totalEquity: totalEquity.toFixed(2),
      message: `Successfully refreshed ${stocksUpdated} stock prices and ${optionsUpdated} option prices. Total equity: $${totalEquity.toFixed(2)}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in POST /portfolio-refresh-prices-simple:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
