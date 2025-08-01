import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface User {
  id: string;
  email?: string;
}

/**
 * Extract and verify authentication token from request
 */
export async function verifyAuth(req: VercelRequest): Promise<User | null> {
  try {
    // Check for guest user
    const guestHeader = req.headers['x-guest-user'];
    if (guestHeader === 'true') {
      return { id: 'guest-user' };
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Middleware-style auth check that returns error response if unauthorized
 */
export async function requireAuth(req: VercelRequest): Promise<User | { error: string; status: number }> {
  const user = await verifyAuth(req);
  
  if (!user) {
    return {
      error: 'Unauthorized',
      status: 401
    };
  }
  
  return user;
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 */
export async function optionalAuth(req: VercelRequest): Promise<User | null> {
  return verifyAuth(req);
}