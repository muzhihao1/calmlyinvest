import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { extractToken } from './_helpers/token-parser';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;

  // Parse includeAll query parameter
  // Default: false (only ACTIVE) for backward compatibility
  // Set to 'true' or '1' to include all statuses (ACTIVE, ROLLED, CLOSED, etc.)
  const includeAllParam = req.query.includeAll as string | undefined;
  const includeAll = includeAllParam === 'true' || includeAllParam === '1';

  if (!portfolioId) {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const isGuestMode = req.headers['x-guest-user'] === 'true';

      if (isGuestMode || !authHeader) {
        // Guest mode - return empty array
        return res.status(200).json([]);
      }

      const token = extractToken(authHeader);

      if (!token) {
        console.error('[portfolio-options-simple] Token extraction failed');
        return res.status(401).json({ error: 'Invalid or malformed authorization token' });
      }

      // Verify user authentication
      const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Use admin client to fetch options
      if (!supabaseServiceKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

      // Verify portfolio belongs to user
      const { data: portfolio, error: portfolioError } = await supabaseAdmin
        .from('portfolios')
        .select('user_id')
        .eq('id', portfolioId)
        .single();

      if (portfolioError || !portfolio) {
        console.error('Portfolio error:', portfolioError);
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      if (portfolio.user_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch options from database
      // By default (includeAll=false), only return ACTIVE options for backward compatibility
      // Set includeAll=true to get all statuses (ACTIVE, ROLLED, CLOSED, etc.)
      console.log('[portfolio-options-simple] Fetching options:', { portfolioId, includeAll });

      let query = supabaseAdmin
        .from('option_holdings')
        .select('*')
        .eq('portfolio_id', portfolioId);

      // Only filter by status='ACTIVE' if includeAll is false (default behavior)
      if (!includeAll) {
        query = query.eq('status', 'ACTIVE');
      }

      const { data: options, error: fetchError } = await query;

      if (fetchError) {
        console.error('[portfolio-options-simple] Error fetching options:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch options', details: fetchError.message });
      }

      console.log('[portfolio-options-simple] Fetched options:', {
        count: options?.length || 0,
        sample: options?.[0] ? {
          optionSymbol: options[0].option_symbol,
          currentPrice: options[0].current_price,
          deltaValue: options[0].delta_value
        } : null
      });

      // Transform snake_case to camelCase for frontend
      const transformedOptions = (options || []).map((option: any) => ({
        id: option.id,
        portfolioId: option.portfolio_id,
        optionSymbol: option.option_symbol,
        underlyingSymbol: option.underlying_symbol,
        optionType: option.option_type,
        direction: option.direction,
        contracts: option.contracts,
        strikePrice: option.strike_price,
        expirationDate: option.expiration_date,
        costPrice: option.cost_price,
        currentPrice: option.current_price,
        deltaValue: option.delta_value,
        createdAt: option.created_at,
        updatedAt: option.updated_at
      }));

      console.log('[portfolio-options-simple] Returning transformed options:', {
        count: transformedOptions.length,
        sample: transformedOptions[0] || null
      });

      res.status(200).json(transformedOptions);
    } catch (error) {
      console.error('Error in GET /portfolio-options-simple:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      const isGuestMode = req.headers['x-guest-user'] === 'true';

      if (isGuestMode || !authHeader) {
        // Guest mode not supported for options
        return res.status(401).json({ error: 'Authentication required for option operations' });
      }

      const token = extractToken(authHeader);

      if (!token) {
        console.error('[portfolio-options-simple] Token extraction failed in POST');
        return res.status(401).json({ error: 'Invalid or malformed authorization token' });
      }

      // Verify user authentication
      const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Use admin client for database operations
      if (!supabaseServiceKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

      // Verify portfolio belongs to user
      const { data: portfolio, error: portfolioError } = await supabaseAdmin
        .from('portfolios')
        .select('user_id')
        .eq('id', portfolioId)
        .single();

      if (portfolioError || !portfolio) {
        console.error('Portfolio error:', portfolioError);
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      if (portfolio.user_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Create new option holding
      const optionData = req.body;

      const newOption = {
        portfolio_id: portfolioId,
        option_symbol: optionData.optionSymbol,
        underlying_symbol: optionData.underlyingSymbol,
        option_type: optionData.optionType,
        direction: optionData.direction,
        contracts: parseInt(optionData.contracts),
        strike_price: parseFloat(optionData.strikePrice),
        expiration_date: optionData.expirationDate,
        cost_price: parseFloat(optionData.costPrice),
        current_price: parseFloat(optionData.currentPrice || optionData.costPrice),
        delta_value: parseFloat(optionData.deltaValue || '0'),
        status: 'ACTIVE'
        // Note: created_at and updated_at are auto-generated
      };

      console.log('[portfolio-options-simple] Creating option:', newOption);

      const { data: insertedOption, error: insertError } = await supabaseAdmin
        .from('option_holdings')
        .insert([newOption])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating option:', insertError);
        return res.status(500).json({ error: 'Failed to create option', details: insertError.message });
      }

      // Transform snake_case to camelCase for frontend
      const transformedOption = {
        id: insertedOption.id,
        portfolioId: insertedOption.portfolio_id,
        optionSymbol: insertedOption.option_symbol,
        underlyingSymbol: insertedOption.underlying_symbol,
        optionType: insertedOption.option_type,
        direction: insertedOption.direction,
        contracts: insertedOption.contracts,
        strikePrice: insertedOption.strike_price,
        expirationDate: insertedOption.expiration_date,
        costPrice: insertedOption.cost_price,
        currentPrice: insertedOption.current_price,
        deltaValue: insertedOption.delta_value,
        createdAt: insertedOption.created_at,
        updatedAt: insertedOption.updated_at
      };

      console.log('[portfolio-options-simple] Option created successfully:', transformedOption);

      res.status(201).json(transformedOption);
    } catch (error) {
      console.error('Error in POST /portfolio-options-simple:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}