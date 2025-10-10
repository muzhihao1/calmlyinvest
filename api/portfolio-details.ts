import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from './utils/response';
import { requireAuth } from './utils/auth';
import { getStorage } from './utils/storage';
import { verifyPortfolioAccess } from './utils/portfolio-auth';

/**
 * Get, update, or delete a portfolio
 * GET /api/portfolio-details?portfolioId=xxx
 * PUT /api/portfolio-details (with portfolioId in body)
 * DELETE /api/portfolio-details?portfolioId=xxx
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Verify authentication
  const authResult = await requireAuth(req);
  if ('error' in authResult) {
    sendError(res, authResult.error, authResult.status);
    return;
  }
  const user = authResult;
  
  // Extract portfolio ID from query or body
  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;
  if (!portfolioId) {
    sendError(res, 'Portfolio ID is required', 400);
    return;
  }
  
  // Get storage adapter
  const storage = await getStorage(user, req);
  
  try {
    switch (req.method) {
      case 'GET': {
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
        
        sendSuccess(res, portfolio);
        break;
      }
      
      case 'PUT': {
        // Verify portfolio ownership (stricter than access)
        const portfolio = await storage.getPortfolio(portfolioId, req);
        if (!portfolio || portfolio.userId !== user.id) {
          sendError(res, 'Portfolio not found', 404);
          return;
        }
        
        // Update portfolio
        const updatedPortfolio = await storage.updatePortfolio(portfolioId, req.body, req);
        sendSuccess(res, updatedPortfolio);
        break;
      }
      
      case 'DELETE': {
        // Verify portfolio ownership (stricter than access)
        const portfolio = await storage.getPortfolio(portfolioId, req);
        if (!portfolio || portfolio.userId !== user.id) {
          sendError(res, 'Portfolio not found', 404);
          return;
        }
        
        // Delete portfolio
        await storage.deletePortfolio(portfolioId, req);
        res.status(204).end();
        break;
      }
      
      default:
        sendError(res, 'Method not allowed', 405);
    }
  } catch (error) {
    console.error(`Error ${req.method} portfolio:`, error);
    sendError(res, `Failed to ${req.method?.toLowerCase() || 'process'} portfolio`, 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}