import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client for when Supabase is not configured
const dummySupabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null })
  }
} as any;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : dummySupabase;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for guest mode
    if (authHeader === 'Bearer guest-mode') {
      req.user = {
        id: 'guest-user',
        email: 'guest@example.com'
      };
      return next();
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow guest mode without token
      req.user = {
        id: 'guest-user',
        email: 'guest@example.com'
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Special handling for "guest-mode" token
    if (token === 'guest-mode') {
      req.user = {
        id: 'guest-user',
        email: 'guest@example.com'
      };
      return next();
    }
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Fall back to guest mode on invalid token
      req.user = {
        id: 'guest-user',
        email: 'guest@example.com'
      };
      return next();
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Fall back to guest mode on error
    req.user = {
      id: 'guest-user',
      email: 'guest@example.com'
    };
    next();
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Try to verify the token
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email
        };
      }
    }

    // Continue even if no user
    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
}