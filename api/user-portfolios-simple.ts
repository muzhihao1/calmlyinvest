import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from './_utils/response';
import { requireAuth } from './_utils/auth';
import { getStorage } from './_utils/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405);
    return;
  }
  
  const userId = req.query.userId as string;
  const isGuestMode = req.headers['x-guest-user'] === 'true';
  
  try {
    // Return mock portfolio data for guest-user
    if (userId === 'guest-user' || isGuestMode) {
      sendSuccess(res, [
        {
          id: 'demo-portfolio-1',
          userId: 'guest-user',
          name: '访客演示组合',
          totalEquity: '1000000.00',
          cashBalance: '300000.00',
          marginUsed: '0.00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      return;
    }
    
    // For authenticated users, verify authentication and get portfolios
    const authResult = await requireAuth(req);
    if ('error' in authResult) {
      // If auth fails, return empty array instead of error
      // This allows the frontend to handle unauthenticated state gracefully
      sendSuccess(res, []);
      return;
    }
    
    const user = authResult;
    const storage = await getStorage(user, req);
    
    // Get user's portfolios
    const portfolios = await storage.getPortfolios(user.id, req);
    
    // If user has no portfolios, create a default one
    if (portfolios.length === 0) {
      const defaultPortfolio = await storage.createPortfolio({
        userId: user.id,
        name: '我的投资组合',
        totalEquity: '1000000',
        cashBalance: '300000',
        marginUsed: '0'
      }, req);
      
      sendSuccess(res, [defaultPortfolio]);
    } else {
      sendSuccess(res, portfolios);
    }
  } catch (error) {
    console.error('Failed to fetch portfolios:', error);
    sendError(res, 'Failed to fetch portfolios', 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}