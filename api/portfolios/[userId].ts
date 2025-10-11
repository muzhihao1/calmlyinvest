import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../utils/response.js';
import { requireAuth } from '../utils/auth.js';
import { getStorage } from '../utils/storage.js';

/**
 * Get portfolios for a user
 * GET /api/portfolios/:userId
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
  
  try {
    // Verify authentication
    const authResult = await requireAuth(req);
    if ('error' in authResult) {
      sendError(res, authResult.error, authResult.status);
      return;
    }
    const user = authResult;
    
    // Extract userId from URL path
    const userId = req.query.userId as string;
    
    // Ensure user can only access their own portfolios
    if (user.id !== userId) {
      sendError(res, 'Unauthorized', 403);
      return;
    }
    
    // Get storage adapter
    const storage = await getStorage(user, req);
    
    // Fetch portfolios
    const portfolios = await storage.getPortfolios(userId, req);
    
    sendSuccess(res, portfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    sendError(res, 'Failed to fetch portfolios', 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}