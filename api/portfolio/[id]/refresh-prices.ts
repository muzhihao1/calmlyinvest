import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { extractToken } from '../_helpers/token-parser';

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

    console.log(`Fetched data for ${symbol}: price=$${price}, beta=${beta}, name=${name}`);
    return { price, beta, name };
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}:`, error);
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
 * Get option quote with Greeks from Market Data API
 * Returns both price and Delta value for accurate option tracking
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

    console.log(`📡 Fetching option data from Market Data API: ${marketDataSymbol}`);

    // Dynamically import axios
    const axios = (await import('axios')).default;

    const response = await axios.get(
      `https://api.marketdata.app/v1/options/quotes/${marketDataSymbol}/`,
      {
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
 * Validate option price for reasonableness
 *
 * Checks if the fetched price makes sense given:
 * - Underlying stock price
 * - Strike price
 * - Option type (CALL/PUT)
 * - Time to expiration
 *
 * Returns validation result with warning if price seems suspicious
 */
interface PriceValidationResult {
  isValid: boolean;
  warning?: string;
  suggestedAction?: string;
}

async function validateOptionPrice(
  optionPrice: number,
  optionSymbol: string,
  underlyingSymbol: string,
  strikePrice: number,
  optionType: 'C' | 'P',
  expirationDate: string
): Promise<PriceValidationResult> {
  try {
    // Fetch underlying stock price
    const stockData = await fetchStockData(underlyingSymbol);
    if (!stockData) {
      return {
        isValid: true, // Can't validate without stock price
        warning: `无法获取 ${underlyingSymbol} 股票价格，跳过验证`
      };
    }

    const stockPrice = stockData.price;

    // Calculate intrinsic value
    let intrinsicValue = 0;
    if (optionType === 'C') {
      // Call option: max(stock - strike, 0)
      intrinsicValue = Math.max(stockPrice - strikePrice, 0);
    } else {
      // Put option: max(strike - stock, 0)
      intrinsicValue = Math.max(strikePrice - stockPrice, 0);
    }

    // Calculate days to expiration
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysToExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Basic sanity checks

    // 1. Option price should never be negative
    if (optionPrice < 0) {
      return {
        isValid: false,
        warning: `❌ 期权价格为负数: $${optionPrice}`,
        suggestedAction: '使用成本价或手动输入正确价格'
      };
    }

    // 2. Option price should never be less than intrinsic value
    if (optionPrice < intrinsicValue - 0.01) { // Small tolerance for rounding
      return {
        isValid: false,
        warning: `❌ 期权价格 ($${optionPrice.toFixed(2)}) 低于内在价值 ($${intrinsicValue.toFixed(2)})`,
        suggestedAction: '检查数据源，可能是过期数据'
      };
    }

    // 3. Time value should be reasonable (not too high)
    const timeValue = optionPrice - intrinsicValue;
    const maxReasonableTimeValue = stockPrice * 0.15; // 15% of stock price is generous

    if (timeValue > maxReasonableTimeValue) {
      return {
        isValid: false,
        warning: `⚠️ 时间价值过高: $${timeValue.toFixed(2)} (期权价格=$${optionPrice.toFixed(2)}, 内在价值=$${intrinsicValue.toFixed(2)})`,
        suggestedAction: '可能是延迟数据或数据错误，建议手动验证'
      };
    }

    // 4. For near-expiration options, time value should decay
    if (daysToExpiration <= 7 && timeValue > stockPrice * 0.05) {
      return {
        isValid: false,
        warning: `⚠️ 临近到期(${daysToExpiration}天)但时间价值仍高达 $${timeValue.toFixed(2)}`,
        suggestedAction: '可能是过期数据，建议手动核实'
      };
    }

    // 5. Check for extremely out-of-the-money options with high prices
    const moneyness = optionType === 'C'
      ? (stockPrice - strikePrice) / strikePrice
      : (strikePrice - stockPrice) / stockPrice;

    if (moneyness < -0.05 && optionPrice > stockPrice * 0.03) { // 5% OTM but price > 3% of stock
      return {
        isValid: false,
        warning: `⚠️ 虚值期权(OTM ${Math.abs(moneyness * 100).toFixed(1)}%)但价格过高: $${optionPrice.toFixed(2)}`,
        suggestedAction: '检查行权价是否正确，可能是数据源错误'
      };
    }

    // All checks passed
    console.log(`✅ Price validation passed for ${optionSymbol}: $${optionPrice.toFixed(2)} (intrinsic=$${intrinsicValue.toFixed(2)}, time=$${timeValue.toFixed(2)})`);
    return {
      isValid: true
    };

  } catch (error) {
    console.error(`Error validating price for ${optionSymbol}:`, error);
    return {
      isValid: true, // Don't block on validation errors
      warning: '价格验证失败，跳过检查'
    };
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
            console.log(`✓ Updated ${stock.symbol}: $${stockData.price.toFixed(2)}, beta: ${stockData.beta.toFixed(2)}`);
          } else {
            stocksFailed++;
            console.error(`✗ Failed to update ${stock.symbol}:`, updateError);
          }
        } else {
          stocksFailed++;
          console.error(`✗ Failed to fetch data for ${stock.symbol}`);
        }
      } catch (error) {
        stocksFailed++;
        console.error(`✗ Error updating ${stock.symbol}:`, error);
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
          // Validate the fetched price before updating
          // Parse strike price and option type from symbol (e.g., "NVDA 251121P190")
          const symbolMatch = option.option_symbol.match(/([A-Z]+)\s?(\d{6})([CP])(\d+(?:\.\d+)?)/);
          if (symbolMatch) {
            const [, underlying, , optionType, strikeStr] = symbolMatch;
            const strikePrice = parseFloat(strikeStr);

            // Validate the price
            const validation = await validateOptionPrice(
              marketDataQuote.price,
              option.option_symbol,
              option.underlying_symbol,
              strikePrice,
              optionType as 'C' | 'P',
              option.expiration_date
            );

            if (!validation.isValid) {
              console.warn(`⚠️ Price validation FAILED for ${option.option_symbol}:`);
              console.warn(`   ${validation.warning}`);
              console.warn(`   ${validation.suggestedAction}`);
              console.warn(`   ⚠️ Keeping current price: $${option.current_price} (API price rejected: $${marketDataQuote.price.toFixed(2)})`);

              // Keep current price, don't update
              optionsUpdated++;
              continue; // Skip this option
            } else if (validation.warning) {
              console.log(`ℹ️ Validation note for ${option.option_symbol}: ${validation.warning}`);
            }
          }

          // Update with real market data (price + Delta)
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
            console.log(`✓ Updated option ${option.option_symbol}: Price=$${marketDataQuote.price.toFixed(2)}, Delta=${marketDataQuote.delta.toFixed(4)}`);
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
