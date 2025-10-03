/**
 * Debug endpoint to check raw option data from database
 * Access: https://www.calmlyinvest.com/api/debug-option-data?symbol=MSFT251010P515&portfolioId=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const symbol = req.query.symbol as string;
  const portfolioId = req.query.portfolioId as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query database for this specific option
    const { data, error } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('option_symbol', symbol);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: error
      });
    }

    return res.status(200).json({
      success: true,
      query: { symbol, portfolioId },
      results: data,
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
