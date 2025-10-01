import type { VercelRequest, VercelResponse } from '@vercel/node';

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
 * API handler for stock quote simple endpoint
 * GET /api/stock-quote-simple?symbol=TSLA
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    console.log(`[stock-quote-simple] Fetching quote for ${symbol}...`);

    // Fetch real stock data from Yahoo Finance
    const stockData = await fetchStockData(symbol.toUpperCase());

    if (!stockData) {
      console.error(`[stock-quote-simple] No data found for ${symbol}`);
      return res.status(404).json({
        error: 'Stock data not found',
        message: `Could not fetch data for symbol ${symbol.toUpperCase()}`
      });
    }

    // Return formatted quote data
    const quote = {
      symbol: symbol.toUpperCase(),
      name: stockData.name,
      price: stockData.price,
      beta: stockData.beta,
      previousClose: stockData.price * 0.99, // Approximate previous close
      change: stockData.price * 0.01,
      changePercent: 1.0,
    };

    console.log(`[stock-quote-simple] Returning quote for ${symbol}:`, quote);
    return res.status(200).json(quote);
  } catch (error) {
    console.error(`[stock-quote-simple] Error fetching stock quote for ${symbol}:`, error);
    return res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
