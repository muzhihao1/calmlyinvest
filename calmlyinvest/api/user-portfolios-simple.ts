import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      console.error('Auth error:', authError);
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Use service role client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch portfolios for the authenticated user
    const { data: portfolios, error: fetchError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching portfolios:', fetchError);
      res.status(500).json({ error: 'Failed to fetch portfolios' });
      return;
    }
    
    // If no portfolios exist, create a default one
    if (!portfolios || portfolios.length === 0) {
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
        console.error('Error creating portfolio:', createError);
        res.status(500).json({ error: 'Failed to create portfolio' });
        return;
      }
      
      res.status(200).json([newPortfolio]);
    } else {
      res.status(200).json(portfolios);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
