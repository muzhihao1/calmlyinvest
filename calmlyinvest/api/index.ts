import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Legacy catch-all handler - all endpoints have been migrated to individual functions
 * This file is kept temporarily for backward compatibility during migration
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  console.warn(`Legacy API handler called: ${req.method} ${req.url}`);
  
  res.status(404).json({
    error: 'Not Found',
    message: 'This API endpoint has been migrated. Please check the API documentation for the correct endpoint.',
    requestedPath: req.url,
    method: req.method
  });
}