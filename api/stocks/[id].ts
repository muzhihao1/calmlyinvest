import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../_utils/response';
import { requireAuth } from '../_utils/auth';
import { getStorage } from '../_utils/storage';

/**
 * Update or delete a stock holding
 * PUT /api/stocks/:id
 * DELETE /api/stocks/:id
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow PUT and DELETE requests
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
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
  
  // Extract stock holding ID from query
  const holdingId = req.query.id as string;
  if (!holdingId) {
    sendError(res, 'Stock holding ID is required', 400);
    return;
  }
  
  // Get storage adapter
  const storage = await getStorage(user, req);
  
  try {
    switch (req.method) {
      case 'PUT': {
        // Update stock holding
        const holding = await storage.updateStockHolding(holdingId, req.body, req);
        sendSuccess(res, holding);
        break;
      }
      
      case 'DELETE': {
        // Delete stock holding
        console.log(`[DELETE] Attempting to delete stock holding: ${holdingId}`);
        console.log(`[DELETE] User ID: ${user.id}`);
        try {
          await storage.deleteStockHolding(holdingId, req);
          console.log(`[DELETE] Successfully deleted stock holding: ${holdingId}`);
          res.status(204).end();
        } catch (deleteError) {
          console.error(`[DELETE] Error deleting stock holding ${holdingId}:`, deleteError);
          throw deleteError;
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error ${req.method} stock holding:`, error);
    console.error(`Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    sendError(res, `Failed to ${req.method.toLowerCase()} stock holding`, 500, {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}