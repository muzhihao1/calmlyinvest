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
  
  const testResults: any = {
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test 1: Basic Supabase client creation
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    testResults.hasEnvVars = !!(supabaseUrl && serviceKey);
    
    if (supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        testResults.canCreateClient = true;
        
        // Test a simple query
        const { data, error } = await supabase.from('portfolios').select('id').limit(1);
        testResults.canQueryDatabase = !error;
        testResults.queryError = error?.message;
        testResults.queryData = data;
        
      } catch (err) {
        testResults.canCreateClient = false;
        testResults.clientError = err instanceof Error ? err.message : 'Client creation failed';
      }
    }
    
    res.status(200).json(testResults);
    
  } catch (error) {
    console.error('Storage test error:', error);
    res.status(500).json({ 
      error: 'Storage test failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      testResults
    });  
  }
}