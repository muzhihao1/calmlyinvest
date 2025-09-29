import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError, handleValidationError } from '../../_utils/response.js';
import { requireAuth } from '../../_utils/auth.js';
import { getStorage } from '../../_utils/storage.js';
import { insertRiskSettingsSchema } from '../../../shared/schema-supabase';
import { z } from 'zod';

/**
 * Get or update risk settings for a user
 * GET /api/user/:userId/risk-settings
 * PUT /api/user/:userId/risk-settings
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET and PUT requests
  if (req.method !== 'GET' && req.method !== 'PUT') {
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
  
  // Extract userId from query
  const userId = req.query.userId as string;
  if (!userId) {
    sendError(res, 'User ID is required', 400);
    return;
  }
  
  // Ensure user can only access their own settings
  if (user.id !== userId) {
    sendError(res, 'Unauthorized', 403);
    return;
  }
  
  // Get storage adapter
  const storage = await getStorage(user, req);
  
  try {
    switch (req.method) {
      case 'GET': {
        const settings = await storage.getRiskSettings(userId, req);
        if (!settings) {
          // Return default settings
          sendSuccess(res, {
            leverageSafeThreshold: "1.0",
            leverageWarningThreshold: "1.5",
            concentrationLimit: "20.0",
            industryConcentrationLimit: "60.0",
            minCashRatio: "30.0",
            leverageAlerts: true,
            expirationAlerts: true,
            volatilityAlerts: false,
            dataUpdateFrequency: 5
          });
          return;
        }
        sendSuccess(res, settings);
        break;
      }
      
      case 'PUT': {
        const validatedData = insertRiskSettingsSchema.parse({
          ...req.body,
          userId: userId
        });
        const settings = await storage.updateRiskSettings(userId, validatedData, req);
        sendSuccess(res, settings);
        break;
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleValidationError(res, error);
      return;
    }
    
    console.error(`Error ${req.method} risk settings:`, error);
    sendError(res, `Failed to ${req.method.toLowerCase()} risk settings`, 500, {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}