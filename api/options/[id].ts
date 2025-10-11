import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../utils/response.js.js';
import { requireAuth } from '../utils/auth.js.js';
import { getStorage } from '../utils/storage.js.js';

/**
 * Update or delete an option holding
 * PUT /api/options/:id
 * DELETE /api/options/:id
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
  
  // Extract option holding ID from query
  const holdingId = req.query.id as string;
  if (!holdingId) {
    sendError(res, 'Option holding ID is required', 400);
    return;
  }
  
  // Get storage adapter
  const storage = await getStorage(user, req);
  
  try {
    switch (req.method) {
      case 'PUT': {
        // Update option holding
        const holding = await storage.updateOptionHolding(holdingId, req.body, req);
        sendSuccess(res, holding);
        break;
      }
      
      case 'DELETE': {
        // Delete option holding
        await storage.deleteOptionHolding(holdingId, req);
        res.status(204).end();
        break;
      }
    }
  } catch (error) {
    console.error(`Error ${req.method} option holding:`, error);
    sendError(res, `Failed to ${req.method.toLowerCase()} option holding`, 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}