import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Debug endpoint to check environment variables and Supabase connection
 * This should be removed after debugging
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const debug: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'unknown',
      nodeVersion: process.version,

      // Check environment variables (NEVER log the actual values)
      envVars: {
        SUPABASE_URL: {
          exists: !!process.env.SUPABASE_URL,
          type: typeof process.env.SUPABASE_URL,
          length: process.env.SUPABASE_URL?.length || 0
        },
        VITE_SUPABASE_URL: {
          exists: !!process.env.VITE_SUPABASE_URL,
          type: typeof process.env.VITE_SUPABASE_URL,
          length: process.env.VITE_SUPABASE_URL?.length || 0
        },
        SUPABASE_ANON_KEY: {
          exists: !!process.env.SUPABASE_ANON_KEY,
          type: typeof process.env.SUPABASE_ANON_KEY,
          length: process.env.SUPABASE_ANON_KEY?.length || 0
        },
        VITE_SUPABASE_ANON_KEY: {
          exists: !!process.env.VITE_SUPABASE_ANON_KEY,
          type: typeof process.env.VITE_SUPABASE_ANON_KEY,
          length: process.env.VITE_SUPABASE_ANON_KEY?.length || 0
        },
        SUPABASE_SERVICE_ROLE_KEY: {
          exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          type: typeof process.env.SUPABASE_SERVICE_ROLE_KEY,
          length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
        }
      },

      // Computed values
      computed: {
        supabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        supabaseAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };

    // Test Supabase client initialization
    try {
      const { createClient } = await import('@supabase/supabase-js');

      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Missing required environment variables for Supabase');
      }

      const supabase = createClient(url, key);

      // Try a simple query
      const { data, error } = await supabase
        .from('portfolios')
        .select('id')
        .limit(1);

      debug['supabaseTest'] = {
        clientCreated: true,
        queryExecuted: true,
        querySuccess: !error,
        error: error ? { message: error.message, code: error.code } : null,
        dataReceived: !!data
      };

    } catch (supabaseError: any) {
      debug['supabaseTest'] = {
        clientCreated: false,
        error: {
          message: supabaseError.message,
          stack: supabaseError.stack?.split('\n').slice(0, 3).join('\n')
        }
      };
    }

    res.status(200).json(debug);

  } catch (error: any) {
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
  }
}
