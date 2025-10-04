/**
 * API endpoint to fetch rollover history for a portfolio
 *
 * Returns enriched rollover data from the option_rollover_history view
 * which includes position details and calculated metrics
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { portfolioId } = req.query;

    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    console.log('📊 Fetching rollover history for portfolio:', portfolioId);

    // Query the rollover history view
    const { data: rollovers, error } = await supabase
      .from('option_rollover_history')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('rollover_date', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch rollover history:', error);
      return res.status(500).json({ error: 'Failed to fetch rollover history' });
    }

    console.log(`✅ Found ${rollovers?.length || 0} rollover records`);

    // Return the rollover history
    return res.status(200).json(rollovers || []);

  } catch (error: any) {
    console.error('❌ Rollover history fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
