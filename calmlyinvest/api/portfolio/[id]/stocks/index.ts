import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError, handleValidationError } from '../../../_utils/response.js';
import { requireAuth } from '../../../_utils/auth.js';
import { getStorage } from '../../../_utils/storage.js';
import { verifyPortfolioAccess } from '../../../_utils/portfolio-auth.js';
import { insertStockHoldingSchema } from '../../../../shared/schema-supabase';
import { z } from 'zod';

/**
 * Get or create stock holdings for a portfolio
 * GET /api/portfolio/:id/stocks
 * POST /api/portfolio/:id/stocks
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
    
    switch (req.method) {
      case 'GET': {
        // Fetch stock holdings
        const holdings = await storage.getStockHoldings(portfolioId, req);
        sendSuccess(res, holdings);
        break;
      }
      
      case 'POST': {
        // For guest mode, skip UUID validation for portfolioId
        let validatedData;
        if (user.id === 'guest-user' && portfolioId.startsWith('demo-')) {
          // Manually validate without UUID check for guest mode
          validatedData = {
            portfolioId: portfolioId,
            symbol: req.body.symbol,
            name: req.body.name,
            quantity: parseInt(req.body.quantity),
            costPrice: req.body.costPrice,
            currentPrice: req.body.currentPrice,
            beta: req.body.beta
          };
        } else {
          validatedData = insertStockHoldingSchema.parse({
            ...req.body,
            portfolioId: portfolioId
          });
        }
        
        // Create stock holding
        const holding = await storage.createStockHolding(validatedData, req);
        sendSuccess(res, holding, 201);
        break;
      }
      
      default:
        sendError(res, 'Method not allowed', 405);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleValidationError(res, error);
      return;
    }
    
    console.error(`Error ${req.method} stock holdings:`, error);
    sendError(res, `Failed to ${req.method?.toLowerCase() || 'process'} stock holdings`, 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}