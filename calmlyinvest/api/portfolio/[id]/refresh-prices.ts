import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../../_utils/response';
import { requireAuth } from '../../_utils/auth';
import { getStorage } from '../../_utils/storage';
import { verifyPortfolioAccess } from '../../_utils/portfolio-auth';
import { updateStockPrices, updateOptionPrices } from '../../../server/market-data';

/**
 * Refresh market prices for portfolio holdings
 * POST /api/portfolio/:id/refresh-prices
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    sendError(res, 'Method not allowed', 405);
    return;
  }
  
  // Verify authentication
  const authResult = await requireAuth(req);
  if ('error' in authResult) {
    sendError(res, authResult.error, authResult.status);
    return;
  }
  const user = authResult;
  
  // Extract portfolio ID from query
  const portfolioId = req.query.id as string;
  if (!portfolioId) {
    sendError(res, 'Portfolio ID is required', 400);
    return;
  }
  
  // Get storage adapter
  const storage = await getStorage(user, req);
  
  try {
    // Verify portfolio access
    const { portfolio, error, status } = await verifyPortfolioAccess(
      storage,
      portfolioId,
      user,
      req
    );
    
    if (error) {
      sendError(res, error, status || 500);
      return;
    }
    
    // Get current holdings
    const stockHoldings = await storage.getStockHoldings(portfolioId, req);
    const optionHoldings = await storage.getOptionHoldings(portfolioId, req);
    
    // Update prices from market data provider
    const updatedStocks = await updateStockPrices(stockHoldings);
    const updatedOptions = await updateOptionPrices(optionHoldings);
    
    // Update each holding in storage
    let stocksUpdated = 0;
    for (const stock of updatedStocks) {
      await storage.updateStockHolding(stock.id, {
        currentPrice: stock.currentPrice,
        beta: stock.beta,
        name: stock.name
      }, req);
      stocksUpdated++;
    }
    
    let optionsUpdated = 0;
    for (const option of updatedOptions) {
      await storage.updateOptionHolding(option.id, {
        currentPrice: option.currentPrice
      }, req);
      optionsUpdated++;
    }
    
    sendSuccess(res, {
      success: true,
      stocksUpdated,
      optionsUpdated,
      message: `Updated ${stocksUpdated} stock prices and ${optionsUpdated} option prices`
    });
  } catch (error) {
    console.error("Price refresh error:", error);
    sendError(res, error instanceof Error ? error.message : "Failed to refresh prices", 500);
  }
}