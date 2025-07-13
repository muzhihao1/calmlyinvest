import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Create Express app instance
const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
registerRoutes(app);

// Main handler function for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log the request for debugging
  console.log(`API Request: ${req.method} ${req.url}`);
  
  // Run the Express app
  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (error: any) => {
      if (error) {
        console.error('Express app error:', error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}