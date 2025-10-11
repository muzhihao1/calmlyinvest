import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from './utils/response.js';
import { requireAuth } from './utils/auth.js';
import { getStorage } from './utils/storage.js';
import { verifyPortfolioAccess } from './utils/portfolio-auth.js';

/**
 * Get smart suggestions for a portfolio
 * GET /api/portfolio-suggestions?portfolioId=xxx
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
  const portfolioId = req.query.portfolioId as string;
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
    
    // For now, return mock suggestions
    const suggestions = [
      {
        id: 'suggestion-1',
        type: 'reduce_concentration',
        title: '降低持仓集中度',
        description: '建议适当减少单一股票持仓比例，分散投资风险',
        priority: 'medium',
        actionable: true
      },
      {
        id: 'suggestion-2', 
        type: 'increase_cash',
        title: '增加现金储备',
        description: '当前现金比例较低，建议增加至30%以上',
        priority: 'high',
        actionable: true
      }
    ];
    
    sendSuccess(res, suggestions);
    
  } catch (error) {
    console.error('Error getting suggestions:', error);
    sendError(res, 'Failed to get suggestions', 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}