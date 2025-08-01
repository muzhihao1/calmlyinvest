import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from './_utils/response';
import { requireAuth } from './_utils/auth';
import { getStorage } from './_utils/storage';
import { verifyPortfolioAccess } from './_utils/portfolio-auth';

/**
 * Get risk metrics for a portfolio
 * GET /api/portfolio-risk?portfolioId=xxx
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
    
    // Get risk metrics
    const riskMetrics = await storage.getRiskMetrics(portfolioId, req);
    sendSuccess(res, riskMetrics);
    
  } catch (error) {
    console.error('Error getting risk metrics:', error);
    sendError(res, 'Failed to get risk metrics', 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}