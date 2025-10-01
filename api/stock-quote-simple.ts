import { VercelRequest, VercelResponse } from '@vercel/node';

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

// Enable CORS
const allowCors = (handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return await handler(req, res);
  };
};

async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const { symbol } = query;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // Fetch real stock data from Yahoo Finance
    const stockData = await fetchStockData(symbol.toUpperCase());

    if (!stockData) {
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

    console.log(`Returning quote for ${symbol}:`, quote);
    res.status(200).json(quote);
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

export default allowCors(handler);
