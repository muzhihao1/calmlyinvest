import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, sendSuccess, sendError } from './_utils/response.js';

/**
 * Health check endpoint
 * GET /api/health
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
    // Check if environment variables are configured
    const hasSupabaseConfig = !!(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    ) && !!(
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    sendSuccess(res, {
      status: 'ok',
      storage: 'supabase',
      environment: process.env.VERCEL_ENV || 'development',
      hasSupabaseConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendError(res, error instanceof Error ? error : new Error('Health check failed'), 503, {
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
}