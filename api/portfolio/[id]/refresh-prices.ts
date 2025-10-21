import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Extract token from Authorization header
 * Inline implementation to avoid import issues in Vercel serverless
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    console.log('[Token Parser] No Authorization header provided');
    return null;
  }

  const normalized = authHeader.trim();

  if (!normalized.startsWith('Bearer ')) {
    console.error(`[Token Parser] Header doesn't start with "Bearer "`);
    return null;
  }

  const token = normalized.substring(7);

  if (!token || token.length === 0) {
    console.error('[Token Parser] Token is empty after extraction');
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error(`[Token Parser] Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return null;
  }

  if (parts.some(part => part.length === 0)) {
    console.error('[Token Parser] JWT contains empty parts');
    return null;
  }

  return token;
}

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

    // Enhanced logging to diagnose price issues
    console.log(`📊 Yahoo Finance raw data for ${symbol}:`, {
      regularMarketPrice: quote.regularMarketPrice,
      ask: quote.ask,
      bid: quote.bid,
      regularMarketTime: quote.regularMarketTime,
      marketState: quote.marketState,
      longName: quote.longName,
      shortName: quote.shortName
    });

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

    console.log(`✅ Fetched data for ${symbol}: price=$${price}, beta=${beta}, name=${name}`);
    return { price, beta, name };
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Convert internal option symbol format to Market Data API format
 *
 * Supports both formats:
 * - With space: "MSFT 251010P515"
 * - Without space: "MSFT251010P515"
 * Output: "MSFT251010P00515000"
 */
function convertToMarketDataSymbol(optionSymbol: string): string {
  try {
    const trimmed = optionSymbol.trim();

    // Try to parse format: TICKER + YYMMDD + C/P + STRIKE
    // e.g., "MSFT251010P515" or "MSFT 251010P515"
    const match = trimmed.match(/^([A-Z]+)\s?(\d{6})([CP])(\d+(?:\.\d+)?)$/);

    if (!match) {
      throw new Error(`Invalid option symbol format: ${optionSymbol}`);
    }

    const [, underlying, date, type, strike] = match;

    // Convert strike to 8-digit format (multiply by 1000)
    const strikeNum = parseFloat(strike);
    const strikeFormatted = Math.round(strikeNum * 1000).toString().padStart(8, '0');

    // Market Data format: UNDERLYING + YYMMDD + C/P + STRIKE
    const marketDataSymbol = `${underlying}${date}${type}${strikeFormatted}`;

    console.log(`📊 Converted ${optionSymbol} → ${marketDataSymbol}`);

    return marketDataSymbol;
  } catch (error) {
    console.error(`❌ Failed to convert option symbol: ${optionSymbol}`, error);
    throw error;
  }
}

/**
 * Get the previous trading day (excluding weekends)
 * For Monday, returns Friday. For other days, returns yesterday.
 */
function getPreviousTradingDay(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  let daysToSubtract = 1; // Default: yesterday

  if (dayOfWeek === 0) {
    // Sunday -> go back to Friday (2 days)
    daysToSubtract = 2;
  } else if (dayOfWeek === 1) {
    // Monday -> go back to Friday (3 days)
    daysToSubtract = 3;
  }

  const previousDay = new Date(today);
  previousDay.setDate(today.getDate() - daysToSubtract);

  // Format as YYYY-MM-DD for API
  const year = previousDay.getFullYear();
  const month = String(previousDay.getMonth() + 1).padStart(2, '0');
  const day = String(previousDay.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get option quote with Greeks from Market Data API
 * Returns both price and Delta value for accurate option tracking
 *
 * Uses historical EOD (End of Day) data from the previous trading day
 * to get accurate closing prices instead of volatile intraday prices.
 */
async function getOptionQuoteFromMarketData(optionSymbol: string): Promise<{
  price: number;
  delta: number;
} | null> {
  const marketDataToken = process.env.MARKETDATA_API_TOKEN;

  if (!marketDataToken) {
    console.warn('⚠️ MARKETDATA_API_TOKEN not configured. Using fallback estimation.');
    return null;
  }

  try {
    const marketDataSymbol = convertToMarketDataSymbol(optionSymbol);

    // Get previous trading day for EOD data
    const previousTradingDay = getPreviousTradingDay();

    console.log(`📡 Fetching EOD option data from Market Data API: ${marketDataSymbol} (date: ${previousTradingDay})`);

    // Dynamically import axios
    const axios = (await import('axios')).default;

    const response = await axios.get(
      `https://api.marketdata.app/v1/options/quotes/${marketDataSymbol}/`,
      {
        params: {
          date: previousTradingDay  // 🔑 KEY FIX: Request historical EOD data
        },
        headers: {
          'Authorization': `Bearer ${marketDataToken}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`📡 Market Data API Response for ${optionSymbol}:`, JSON.stringify({
      status: response.data.s,
      symbol: response.data.optionSymbol,
      bid: response.data.bid,
      ask: response.data.ask,
      mid: response.data.mid,
      last: response.data.last,
      delta: response.data.delta,
      updated: response.data.updated
    }, null, 2));

    if (response.data.s !== 'ok') {
      throw new Error(`Invalid response status: ${response.data.s}`);
    }

    const data = response.data;

    if (!data.mid || data.mid.length === 0) {
      console.warn(`⚠️ No mid price for ${optionSymbol}, trying fallback...`);
      console.log(`   Bid: ${data.bid}, Ask: ${data.ask}, Last: ${data.last}`);
    }

    // Determine option price (prefer mid, fallback to last or avg of bid/ask)
    let price = data.mid && data.mid[0] ? data.mid[0] : null;

    if (!price || price === 0) {
      if (data.last && data.last[0] > 0) {
        price = data.last[0];
        console.log(`💰 Price from last: $${price}`);
      } else if (data.bid && data.ask && data.bid[0] > 0 && data.ask[0] > 0) {
        price = (data.bid[0] + data.ask[0]) / 2;
        console.log(`💰 Price from bid/ask avg: $${price}`);
      } else {
        throw new Error('No valid price data available');
      }
    } else {
      console.log(`💰 Price from mid: $${price}`);
    }

    // Extract Delta
    const delta = data.delta && data.delta[0] !== undefined ? data.delta[0] : 0;

    console.log(`✅ Market Data API: ${optionSymbol} = $${price.toFixed(2)}, Delta=${delta.toFixed(4)}`);

    return { price, delta };
  } catch (error) {
    console.error(`❌ Failed to fetch from Market Data API for ${optionSymbol}:`, error);
    return null;
  }
}

/**
 * Fetch option price from Yahoo Finance
 * Fallback when Market Data API is not available
 */
async function fetchOptionPriceFromYahoo(optionSymbol: string, underlyingSymbol: string): Promise<number | null> {
  try {
    const yahooFinance = await getYahooFinance();

    // Convert our format to Yahoo Finance format
    // Our format: "MSFT 251024P515" or "MSFT251024P515"
    // Yahoo format: "MSFT251024P00515000"
    const yahooSymbol = convertToMarketDataSymbol(optionSymbol);

    console.log(`🔍 Trying Yahoo Finance for option: ${yahooSymbol}`);

    try {
      const quote = await yahooFinance.quote(yahooSymbol);

      // Yahoo returns option prices in regularMarketPrice, bid, ask
      let price = quote.regularMarketPrice || quote.bid || quote.ask;

      if (price && price > 0) {
        console.log(`✅ Yahoo Finance: ${optionSymbol} = $${price.toFixed(2)}`);
        return price;
      }
    } catch (yahooError) {
      console.warn(`⚠️ Yahoo Finance failed for ${yahooSymbol}, trying alternative format...`);
    }

    // If Yahoo Finance fails, return null (caller will use cost price as fallback)
    console.warn(`⚠️ Could not fetch price for ${optionSymbol} from Yahoo Finance`);
    return null;
  } catch (error) {
    console.error(`Failed to fetch option price from Yahoo for ${optionSymbol}:`, error);
    return null;
  }
}

/**
 * Refresh market prices for portfolio holdings
 * POST /api/portfolio/:id/refresh-prices
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

  // Extract portfolio ID from query parameter (Vercel dynamic route)
  const portfolioId = req.query.id as string;

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
      console.error('[refresh-prices] Token extraction failed');
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

    console.log(`Starting price refresh for portfolio ${portfolioId} (user: ${user.id})`);

    // Check environment configuration
    const marketDataConfigured = !!process.env.MARKETDATA_API_TOKEN;
    console.log(`🔧 Environment Configuration:`, {
      MARKETDATA_API_TOKEN: marketDataConfigured ? '✅ Configured' : '❌ Not configured (will fallback to Yahoo Finance)',
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey
    });

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

    console.log(`Found ${(stocks || []).length} stocks and ${(options || []).length} options to update`);

    // Update stock prices
    let stocksUpdated = 0;
    let stocksFailed = 0;
    const stockUpdatePromises = (stocks || []).map(async (stock: any) => {
      try {
        console.log(`🔄 Processing stock ${stock.symbol} (ID: ${stock.id}, current DB price: $${stock.current_price})`);
        const stockData = await fetchStockData(stock.symbol);

        if (stockData) {
          const updatePayload = {
            current_price: stockData.price.toFixed(2),
            beta: stockData.beta.toFixed(2),
            name: stockData.name,
            updated_at: new Date().toISOString()
          };

          console.log(`💾 Updating ${stock.symbol} in database:`, updatePayload);

          const { data: updateResult, error: updateError } = await supabaseAdmin
            .from('stock_holdings')
            .update(updatePayload)
            .eq('id', stock.id)
            .select();

          if (!updateError) {
            stocksUpdated++;
            console.log(`✅ Successfully updated ${stock.symbol}: OLD=$${stock.current_price} → NEW=$${stockData.price.toFixed(2)}, beta: ${stockData.beta.toFixed(2)}`);
            console.log(`📋 Update result:`, updateResult);
          } else {
            stocksFailed++;
            console.error(`❌ Database update failed for ${stock.symbol}:`, JSON.stringify(updateError));
          }
        } else {
          stocksFailed++;
          console.error(`❌ Yahoo Finance returned null for ${stock.symbol}`);
        }
      } catch (error) {
        stocksFailed++;
        console.error(`❌ Exception while updating ${stock.symbol}:`, error);
      }
    });

    // Update option prices with real market data (including Greeks)
    let optionsUpdated = 0;
    let optionsFailed = 0;
    const optionUpdatePromises = (options || []).map(async (option: any) => {
      try {
        console.log(`🔄 Updating option: ${option.option_symbol}`);

        // Try to get real market data with Greeks (Delta) first
        const marketDataQuote = await getOptionQuoteFromMarketData(option.option_symbol);

        console.log(`🔍 Market Data result for ${option.option_symbol}:`, marketDataQuote ? `Price=${marketDataQuote.price}, Delta=${marketDataQuote.delta}` : 'NULL (fallback will be used)');

        if (marketDataQuote) {
          // Update with EOD market data (price + Delta)
          console.log(`💾 Attempting DB update for option ID ${option.id}: current_price=${marketDataQuote.price.toFixed(2)}, delta_value=${marketDataQuote.delta.toFixed(4)}`);

          const { data: updateResult, error: updateError } = await supabaseAdmin
            .from('option_holdings')
            .update({
              current_price: marketDataQuote.price.toFixed(2),
              delta_value: marketDataQuote.delta.toFixed(4), // ✅ Update Delta too!
              updated_at: new Date().toISOString()
            })
            .eq('id', option.id)
            .select();

          console.log(`📋 Update result:`, { updateResult, updateError });

          if (!updateError) {
            optionsUpdated++;
            console.log(`✓ Updated option ${option.option_symbol}: EOD Price=$${marketDataQuote.price.toFixed(2)}, Delta=${marketDataQuote.delta.toFixed(4)}`);
          } else {
            optionsFailed++;
            console.error(`✗ Failed to update option ${option.option_symbol}:`, JSON.stringify(updateError));
          }
        } else {
          // Fallback to Yahoo Finance
          console.log(`⚠️ Falling back to Yahoo Finance for ${option.option_symbol}`);
          const yahooPrice = await fetchOptionPriceFromYahoo(option.option_symbol, option.underlying_symbol);

          if (yahooPrice !== null) {
            const { error: updateError } = await supabaseAdmin
              .from('option_holdings')
              .update({
                current_price: yahooPrice.toFixed(2),
                updated_at: new Date().toISOString()
                // Note: Delta not updated when using Yahoo Finance fallback
              })
              .eq('id', option.id);

            if (!updateError) {
              optionsUpdated++;
              console.log(`✓ Updated option ${option.option_symbol} (from Yahoo): $${yahooPrice.toFixed(2)}`);
            } else {
              optionsFailed++;
              console.error(`✗ Failed to update option ${option.option_symbol}:`, updateError);
            }
          } else {
            // Last resort: keep current price unchanged (likely FLEX option or low liquidity)
            // Check if this is a non-standard expiration (potential FLEX option)
            const expDate = new Date(option.expiration_date);
            const dayOfWeek = expDate.getDay(); // 0=Sunday, 5=Friday
            const isFriday = dayOfWeek === 5;

            if (!isFriday) {
              console.warn(`⚠️ ${option.option_symbol} has non-Friday expiration (${option.expiration_date}). This may be a FLEX option not covered by standard market data APIs. Keeping current price: $${option.current_price}`);
            } else {
              console.warn(`⚠️ Could not fetch price for option ${option.option_symbol}. Keeping current price: $${option.current_price}`);
            }

            // Don't count as failure - we kept the existing price
            optionsUpdated++;
          }
        }
      } catch (error) {
        optionsFailed++;
        console.error(`✗ Error updating option ${option.option_symbol}:`, error);
      }
    });

    // Execute all updates in parallel
    await Promise.all([...stockUpdatePromises, ...optionUpdatePromises]);

    console.log(`Price refresh complete: ${stocksUpdated}/${(stocks || []).length} stocks, ${optionsUpdated}/${(options || []).length} options updated`);

    res.status(200).json({
      success: true,
      stocksUpdated,
      optionsUpdated,
      stocksFailed,
      optionsFailed,
      totalStocks: (stocks || []).length,
      totalOptions: (options || []).length,
      message: `成功更新 ${stocksUpdated} 个股票价格和 ${optionsUpdated} 个期权价格`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in POST /api/portfolio/:id/refresh-prices:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
