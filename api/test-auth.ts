import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Test basic imports first
    const authHeader = req.headers.authorization;
    
    // Check if we can import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    // Test Supabase client creation
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let authResult = null;
    let authError = null;
    
    // Test auth if token provided
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        authResult = { hasUser: !!user, userId: user?.id, error: error?.message };
      } catch (err) {
        authError = err instanceof Error ? err.message : 'Auth test failed';
      }
    }
    
    res.status(200).json({
      hasAuthHeader: !!authHeader,
      canImportSupabase: true,
      supabaseConfigured: !!(supabaseUrl && supabaseKey),
      authResult,
      authError,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ 
      error: 'Auth test failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}