import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../../_utils/response';
import { requireAuth } from '../../_utils/auth';
import { getStorage } from '../../_utils/storage';
import { verifyPortfolioAccess } from '../../_utils/portfolio-auth';

/**
 * Calculate risk metrics for a portfolio
 * GET /api/portfolio/:id/risk
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
    
    // Fetch holdings
    const stockHoldings = await storage.getStockHoldings(portfolioId, req);
    const optionHoldings = await storage.getOptionHoldings(portfolioId, req);
    
    // Calculate stock value
    const stockValue = stockHoldings.reduce((sum: number, holding: any) => {
      return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
    }, 0);
    
    // Calculate option max loss
    const optionMaxLoss = optionHoldings.reduce((sum: number, option: any) => {
      if (option.direction === "BUY") {
        return sum + (Math.abs(option.contracts) * parseFloat(option.costPrice) * 100);
      } else {
        if (option.optionType === "PUT") {
          const maxLoss = (parseFloat(option.strikePrice) - parseFloat(option.costPrice)) * Math.abs(option.contracts) * 100;
          return sum + Math.max(maxLoss, 0);
        } else {
          const underlyingPrice = stockHoldings.find((s: any) => s.symbol === option.underlyingSymbol)?.currentPrice || "100";
          const estimatedLoss = parseFloat(underlyingPrice) * 3 * Math.abs(option.contracts) * 100;
          return sum + estimatedLoss;
        }
      }
    }, 0);
    
    const totalEquity = parseFloat(portfolio.totalEquity || "0");
    const marginUsed = parseFloat(portfolio.marginUsed || "0");
    const leverageRatio = totalEquity > 0 ? (stockValue + optionMaxLoss) / totalEquity : 0;
    
    // Calculate portfolio beta
    const totalStockValue = stockHoldings.reduce((sum: number, holding: any) => {
      return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
    }, 0);
    
    const weightedBeta = stockHoldings.reduce((sum: number, holding: any) => {
      const weight = totalStockValue > 0 ? (holding.quantity * parseFloat(holding.currentPrice || "0")) / totalStockValue : 0;
      const beta = parseFloat(holding.beta || "1.0");
      return sum + (weight * beta);
    }, 0);
    
    // Calculate max concentration
    const maxConcentration = stockHoldings.reduce((max: number, holding: any) => {
      const value = holding.quantity * parseFloat(holding.currentPrice || "0");
      const concentration = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
      return Math.max(max, concentration);
    }, 0);
    
    // Calculate margin usage ratio
    const marginUsageRatio = totalEquity > 0 ? (marginUsed / totalEquity) * 100 : 0;
    
    // Determine risk level
    let riskLevel = "GREEN";
    if (leverageRatio >= 1.5) {
      riskLevel = "RED";
    } else if (leverageRatio >= 1.0) {
      riskLevel = "YELLOW";
    }
    
    const riskMetrics = {
      leverageRatio: leverageRatio.toFixed(4),
      portfolioBeta: weightedBeta.toFixed(4),
      maxConcentration: maxConcentration.toFixed(2),
      marginUsageRatio: marginUsageRatio.toFixed(2),
      riskLevel,
      stockValue: stockValue.toFixed(2),
      optionMaxLoss: optionMaxLoss.toFixed(2),
      totalEquity: totalEquity.toFixed(2),
      remainingLiquidity: ((totalEquity - marginUsed) / totalEquity * 100).toFixed(2)
    };
    
    // Save risk metrics
    await storage.createRiskMetrics({
      portfolioId: portfolioId,
      leverageRatio: riskMetrics.leverageRatio,
      portfolioBeta: riskMetrics.portfolioBeta,
      maxConcentration: riskMetrics.maxConcentration,
      marginUsageRatio: riskMetrics.marginUsageRatio,
      riskLevel
    }, req);
    
    sendSuccess(res, riskMetrics);
  } catch (error) {
    console.error("Risk calculation error:", error);
    sendError(res, "Failed to calculate risk metrics", 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}