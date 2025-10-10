import type { VercelResponse } from '@vercel/node';
import { z } from 'zod';

/**
 * Send success response
 */
export function sendSuccess(res: VercelResponse, data: any, status = 200) {
  res.status(status).json(data);
}

/**
 * Send error response
 */
export function sendError(res: VercelResponse, error: string | Error, status = 500, details?: any) {
  const message = error instanceof Error ? error.message : error;
  
  res.status(status).json({
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(res: VercelResponse, error: z.ZodError) {
  sendError(res, 'Invalid input data', 400, error.errors);
}

/**
 * Set CORS headers
 */
export function setCorsHeaders(res: VercelResponse, req: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Guest-User');
}