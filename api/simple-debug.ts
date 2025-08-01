import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const envCheck = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,  
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasViteSupabaseAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(envCheck);
  } catch (error) {
    console.error('Simple debug error:', error);
    res.status(500).json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}