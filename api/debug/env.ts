import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from '../utils/response.js';

/**
 * Debug endpoint to check environment variables
 * GET /api/debug/env
 * 
 * Note: This endpoint should be removed or secured in production
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
  
  // In production, restrict access or remove this endpoint
  if (process.env.VERCEL_ENV === 'production') {
    sendError(res, 'Not available in production', 403);
    return;
  }
  
  try {
    sendSuccess(res, {
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL || !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY || !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendError(res, error instanceof Error ? error : new Error('Debug check failed'), 500);
  }
}