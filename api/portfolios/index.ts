import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError, handleValidationError } from '../_utils/response';
import { requireAuth } from '../_utils/auth';
import { getStorage } from '../_utils/storage';
import { insertPortfolioSchema } from '../../shared/schema-supabase';
import { z } from 'zod';

/**
 * Create a new portfolio
 * POST /api/portfolios
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
  
  try {
    // Verify authentication
    const authResult = await requireAuth(req);
    if ('error' in authResult) {
      sendError(res, authResult.error, authResult.status);
      return;
    }
    const user = authResult;
    
    // Validate input data
    const validatedData = insertPortfolioSchema.parse({
      ...req.body,
      userId: user.id
    });
    
    // Get storage adapter
    const storage = await getStorage(user, req);
    
    // Create portfolio
    const portfolio = await storage.createPortfolio(validatedData, req);
    
    sendSuccess(res, portfolio, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Portfolio validation error:', error.errors);
      handleValidationError(res, error);
      return;
    }
    
    console.error('Failed to create portfolio:', error);
    sendError(res, 'Failed to create portfolio', 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}