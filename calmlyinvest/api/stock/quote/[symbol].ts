import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../../_utils/response.js';
import { requireAuth } from '../../_utils/auth.js';
import { getMarketDataProvider } from '../../_utils/market-data.js';

/**
 * Get stock quote by symbol
 * GET /api/stock/quote/:symbol
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405);
    return;
  }
  
  // Verify authentication
  const authResult = await requireAuth(req);
  if ('error' in authResult) {
    sendError(res, authResult.error, authResult.status);
    return;
  }
  
  // Extract symbol from query
  const symbol = req.query.symbol as string;
  if (!symbol) {
    sendError(res, 'Stock symbol is required', 400);
    return;
  }
  
  try {
    // Get market data provider and fetch quote
    const provider = getMarketDataProvider();
    const quote = await provider.getStockQuote(symbol.toUpperCase());
    
    sendSuccess(res, quote);
  } catch (error) {
    console.error('Stock quote error:', error);
    sendError(res, 'Failed to fetch stock quote', 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}