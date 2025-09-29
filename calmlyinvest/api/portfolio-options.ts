import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError, handleValidationError } from './_utils/response.js';
import { requireAuth } from './_utils/auth.js';
import { getStorage } from './_utils/storage.js';
import { verifyPortfolioAccess } from './_utils/portfolio-auth.js';
import { insertOptionHoldingSchema } from '@shared/schema-supabase';
import { z } from 'zod';

/**
 * Get or create option holdings for a portfolio
 * GET /api/portfolio-options?portfolioId=xxx
 * POST /api/portfolio-options (with portfolioId in body)
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
        // Fetch option holdings
        const holdings = await storage.getOptionHoldings(portfolioId, req);
        sendSuccess(res, holdings);
        break;
      }
      
      case 'POST': {
        // Validate input
        const validatedData = insertOptionHoldingSchema.parse({
          ...req.body,
          portfolioId: portfolioId
        });
        
        // Create option holding
        const holding = await storage.createOptionHolding(validatedData, req);
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
    
    console.error(`Error ${req.method} option holdings:`, error);
    sendError(res, `Failed to ${req.method?.toLowerCase() || 'process'} option holdings`, 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}