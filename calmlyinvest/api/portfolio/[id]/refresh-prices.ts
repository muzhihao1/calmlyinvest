import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../../_utils/response.js';
import { requireAuth } from '../../_utils/auth.js';
import { getStorage } from '../../_utils/storage.js';
import { verifyPortfolioAccess } from '../../_utils/portfolio-auth.js';
import { updateStockPrices, updateOptionPrices } from '../../_utils/market-data.js';

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
    console.log(`🚀 Starting price refresh for portfolio ${portfolioId}`);

    // Verify portfolio access
    const { portfolio, error, status } = await verifyPortfolioAccess(
      storage,
      portfolioId,
      user,
      req
    );

    if (error) {
      console.error(`❌ Portfolio access denied: ${error}`);
      sendError(res, error, status || 500);
      return;
    }

    // Get current holdings
    const stockHoldings = await storage.getStockHoldings(portfolioId, req);
    const optionHoldings = await storage.getOptionHoldings(portfolioId, req);
    console.log(`📦 Found ${stockHoldings.length} stocks and ${optionHoldings.length} options`);
    
    // Update prices from market data provider
    console.log(`🔄 Fetching prices for ${stockHoldings.length} stocks and ${optionHoldings.length} options`);
    const updatedStocks = await updateStockPrices(stockHoldings);
    const updatedOptions = await updateOptionPrices(optionHoldings);
    console.log(`✅ Received ${updatedStocks.length} updated stocks and ${updatedOptions.length} updated options`);

    // Update each holding in storage
    let stocksUpdated = 0;
    for (const stock of updatedStocks) {
      console.log(`📊 Updating stock ${stock.symbol}: $${stock.currentPrice}`);
      await storage.updateStockHolding(stock.id, {
        currentPrice: stock.currentPrice,
        beta: stock.beta,
        name: stock.name
      }, req);
      stocksUpdated++;
    }

    let optionsUpdated = 0;
    for (const option of updatedOptions) {
      console.log(`📊 Updating option ${option.optionSymbol}: Price=$${option.currentPrice}, Delta=${option.deltaValue}`);
      await storage.updateOptionHolding(option.id, {
        currentPrice: option.currentPrice,
        deltaValue: option.deltaValue  // 也更新Delta值！
      }, req);
      console.log(`✅ Updated option ${option.id} in database`);
      optionsUpdated++;
    }
    
    console.log(`✅ Price refresh complete: ${stocksUpdated} stocks, ${optionsUpdated} options`);

    sendSuccess(res, {
      success: true,
      stocksUpdated,
      optionsUpdated,
      message: `Updated ${stocksUpdated} stock prices and ${optionsUpdated} option prices`
    });
  } catch (error) {
    console.error("❌ Price refresh error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    sendError(res, error instanceof Error ? error.message : "Failed to refresh prices", 500);
  }
}