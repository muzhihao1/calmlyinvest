import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../../_utils/response.js';
import { requireAuth } from '../../_utils/auth.js';
import { getStorage } from '../../_utils/storage.js';
import { verifyPortfolioAccess } from '../../_utils/portfolio-auth.js';

interface Suggestion {
  type: string;
  priority: string;
  title: string;
  description: string;
  action: string;
  [key: string]: any;
}

/**
 * Get smart suggestions for a portfolio
 * GET /api/portfolio/:id/suggestions
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
    
    const suggestions: Suggestion[] = [];
    const totalEquity = parseFloat(portfolio.totalEquity || "0");
    const marginUsed = parseFloat(portfolio.marginUsed || "0");
    const remainingLiquidityRatio = ((totalEquity - marginUsed) / totalEquity) * 100;
    
    // Calculate current metrics for suggestions
    const totalStockValue = stockHoldings.reduce((sum: number, holding: any) => {
      return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
    }, 0);
    
    // Check concentration risk
    stockHoldings.forEach((holding: any) => {
      const value = holding.quantity * parseFloat(holding.currentPrice || "0");
      const concentration = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
      
      if (concentration > 20) {
        suggestions.push({
          type: "IMMEDIATE",
          priority: "HIGH",
          title: `减少${holding.symbol}持仓`,
          description: `当前${holding.symbol}持仓占比${concentration.toFixed(1)}%，远超建议的20%上限。建议减持以降低集中度风险。`,
          action: "REDUCE_POSITION",
          symbol: holding.symbol,
          currentConcentration: concentration.toFixed(1),
          suggestedReduction: Math.ceil((concentration - 20) / 100 * holding.quantity)
        });
      }
    });
    
    // Check liquidity risk
    if (remainingLiquidityRatio < 30) {
      suggestions.push({
        type: "IMMEDIATE",
        priority: remainingLiquidityRatio < 15 ? "HIGH" : "MEDIUM",
        title: "增加现金缓冲",
        description: `剩余流动性仅${remainingLiquidityRatio.toFixed(1)}%，低于建议的30%。建议减少部分持仓或暂停新投资。`,
        action: "INCREASE_CASH",
        currentLiquidity: remainingLiquidityRatio.toFixed(1),
        targetLiquidity: "30.0"
      });
    }
    
    // Check option expiration
    const now = new Date();
    
    optionHoldings.forEach((option: any) => {
      const expirationDate = new Date(option.expirationDate);
      const daysToExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysToExpiration <= 60 && daysToExpiration > 7) {
        suggestions.push({
          type: "OPTION_MANAGEMENT",
          priority: "MEDIUM",
          title: `${option.underlyingSymbol} ${option.optionType} Rollover建议`,
          description: `${option.optionSymbol}距离到期还有${daysToExpiration}天，当前Delta=${option.deltaValue}，建议考虑滚动操作。`,
          action: "ROLLOVER_OPTION",
          optionSymbol: option.optionSymbol,
          daysToExpiration,
          delta: option.deltaValue
        });
      } else if (daysToExpiration <= 7) {
        suggestions.push({
          type: "IMMEDIATE",
          priority: "HIGH",
          title: `${option.underlyingSymbol} 期权即将到期`,
          description: `${option.optionSymbol}将在${daysToExpiration}天内到期，请及时处理。`,
          action: "HANDLE_EXPIRATION",
          optionSymbol: option.optionSymbol,
          daysToExpiration
        });
      }
    });
    
    sendSuccess(res, suggestions);
  } catch (error) {
    console.error("Suggestions calculation error:", error);
    sendError(res, "Failed to generate suggestions", 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}