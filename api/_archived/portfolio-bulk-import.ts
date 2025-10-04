import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const allowCors = (handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return await handler(req, res);
  };
};

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { portfolioId, stocks, options, clearExisting } = req.body;

  if (!portfolioId) {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    // Clear existing holdings if requested
    if (clearExisting) {
      await supabaseAdmin
        .from('stock_holdings')
        .delete()
        .eq('portfolio_id', portfolioId);

      await supabaseAdmin
        .from('option_holdings')
        .delete()
        .eq('portfolio_id', portfolioId);
    }

    const results = {
      stocksAdded: 0,
      optionsAdded: 0,
      errors: [] as any[]
    };

    // Add stocks
    if (stocks && stocks.length > 0) {
      const stocksToInsert = stocks.map((stock: any) => ({
        portfolio_id: portfolioId,
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        quantity: parseInt(stock.quantity),
        cost_price: parseFloat(stock.cost_price),
        current_price: parseFloat(stock.current_price || stock.cost_price),
        beta: parseFloat(stock.beta || '1.0')
      }));

      const { data, error } = await supabaseAdmin
        .from('stock_holdings')
        .insert(stocksToInsert)
        .select();

      if (error) {
        results.errors.push({ type: 'stocks', error: error.message });
      } else {
        results.stocksAdded = data?.length || 0;
      }
    }

    // Add options
    if (options && options.length > 0) {
      const optionsToInsert = options.map((option: any) => ({
        portfolio_id: portfolioId,
        option_symbol: option.option_symbol,
        underlying_symbol: option.underlying_symbol,
        option_type: option.option_type,
        direction: option.direction,
        contracts: parseInt(option.contracts),
        strike_price: parseFloat(option.strike_price),
        expiration_date: option.expiration_date,
        cost_price: parseFloat(option.cost_price),
        current_price: option.current_price ? parseFloat(option.current_price) : null,
        delta_value: option.delta_value ? parseFloat(option.delta_value) : null
      }));

      const { data, error } = await supabaseAdmin
        .from('option_holdings')
        .insert(optionsToInsert)
        .select();

      if (error) {
        results.errors.push({ type: 'options', error: error.message });
      } else {
        results.optionsAdded = data?.length || 0;
      }
    }

    res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default allowCors(handler);