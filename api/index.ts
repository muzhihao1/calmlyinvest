import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Cache the Express app to avoid recreating it on every request
let app: express.Express | null = null;

function getApp() {
  if (!app) {
    app = express();
    
    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register all routes
    try {
      registerRoutes(app);
    } catch (error) {
      console.error('Failed to register routes:', error);
      // Don't throw, let the app handle requests with error responses
    }
  }
  return app;
}

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
  
  // Get the Express app (lazy initialization)
  const expressApp = getApp();
  
  // Run the Express app
  return new Promise<void>((resolve, reject) => {
    expressApp(req as any, res as any, (error: any) => {
      if (error) {
        console.error('Express app error:', error);
        res.status(500).json({ 
          error: 'Internal Server Error', 
          message: error.message || 'Unknown error'
        });
        resolve(); // Resolve instead of reject to avoid Vercel error
      } else {
        resolve();
      }
    });
  }).catch((error) => {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || 'Unknown error'
    });
  });
}