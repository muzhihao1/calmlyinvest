import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// In Vercel serverless functions, use SUPABASE_URL (not VITE_SUPABASE_URL)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate required environment variables
  if (!supabaseUrl) {
    console.error('SUPABASE_URL environment variable is not set');
    res.status(500).json({
      error: 'Server configuration error: SUPABASE_URL not configured',
      details: 'Please set SUPABASE_URL in Vercel environment variables'
    });
    return;
  }

  if (!supabaseAnonKey) {
    console.error('SUPABASE_ANON_KEY environment variable is not set');
    res.status(500).json({
      error: 'Server configuration error: SUPABASE_ANON_KEY not configured',
      details: 'Please set SUPABASE_ANON_KEY in Vercel environment variables'
    });
    return;
  }

  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    res.status(500).json({
      error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not configured',
      details: 'Please set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables'
    });
    return;
  }

  console.log('[user-portfolios-simple] Request received:', {
    method: req.method,
    userId: req.query.userId,
    hasAuth: !!req.headers.authorization
  });
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const userId = req.query.userId as string;
  
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  
  // Return mock portfolio data for guest-user
  if (userId === 'guest-user') {
    res.status(200).json([
      {
        id: 'demo-portfolio-1',
        userId: 'guest-user',
        name: 'Demo Portfolio',
        totalEquity: '10000.00',
        cashBalance: '5000.00',
        marginUsed: '0.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
    return;
  }
  
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader === 'Bearer guest-mode') {
      res.status(200).json([]);
      return;
    }
    
    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
    // Create authenticated Supabase client with user's token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user || user.id !== userId) {
      console.error('[user-portfolios-simple] Auth error:', {
        authError,
        hasUser: !!user,
        userIdMatch: user?.id === userId,
        requestedUserId: userId,
        actualUserId: user?.id
      });
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('[user-portfolios-simple] User authenticated:', {
      userId: user.id,
      email: user.email
    });
    
    // Use service role client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch portfolios for the authenticated user
    const { data: portfolios, error: fetchError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[user-portfolios-simple] Error fetching portfolios:', {
        error: fetchError,
        userId,
        errorCode: fetchError.code,
        errorDetails: fetchError.details,
        errorHint: fetchError.hint
      });
      res.status(500).json({ error: 'Failed to fetch portfolios', details: fetchError.message });
      return;
    }

    console.log('[user-portfolios-simple] Portfolios fetched:', {
      userId,
      count: portfolios?.length || 0
    });

    // If no portfolios exist, create a default one
    if (!portfolios || portfolios.length === 0) {
      console.log('[user-portfolios-simple] No portfolios found, creating default portfolio');
      const defaultPortfolio = {
        user_id: userId,
        name: '我的投资组合',
        total_equity: '1000000',
        cash_balance: '300000',
        margin_used: '0'
      };
      
      const { data: newPortfolio, error: createError } = await supabaseAdmin
        .from('portfolios')
        .insert([defaultPortfolio])
        .select()
        .single();

      if (createError) {
        console.error('[user-portfolios-simple] Error creating portfolio:', {
          error: createError,
          userId,
          errorCode: createError.code,
          errorDetails: createError.details,
          errorHint: createError.hint
        });
        res.status(500).json({ error: 'Failed to create portfolio', details: createError.message });
        return;
      }

      console.log('[user-portfolios-simple] Portfolio created successfully:', {
        portfolioId: newPortfolio.id,
        userId
      });
      res.status(200).json([newPortfolio]);
    } else {
      console.log('[user-portfolios-simple] Returning existing portfolios:', {
        userId,
        portfolioIds: portfolios.map(p => p.id)
      });
      res.status(200).json(portfolios);
    }
  } catch (error) {
    console.error('[user-portfolios-simple] Unexpected error:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
