import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory storage for guest mode (shared between functions)
const guestOptions: Record<string, any[]> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Guest-User');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;
  const authHeader = req.headers.authorization;

  console.log('[portfolio-options-simple] Request:', {
    method: req.method,
    portfolioId,
    hasAuth: !!authHeader
  });

  // Check if it's guest mode
  const isGuestMode = portfolioId === 'demo-portfolio-1' || authHeader === 'Bearer guest-mode';

  try {
    if (req.method === 'GET') {
      if (isGuestMode) {
        // Guest mode - return from in-memory storage
        const options = guestOptions[portfolioId] || [];
        console.log('[portfolio-options-simple] Returning guest options:', options.length);
        res.status(200).json(options);
      } else {
        // Authenticated mode - get from database
        if (!authHeader) {
          res.status(401).json({ error: 'Authorization required' });
          return;
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify the user with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          console.error('[portfolio-options-simple] Auth error:', authError);
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        console.log('[portfolio-options-simple] User authenticated:', user.id);

        // Get options for this portfolio
        const { data: options, error: fetchError } = await supabase
          .from('option_holdings')
          .select('*')
          .eq('portfolio_id', portfolioId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[portfolio-options-simple] Error fetching options:', fetchError);
          res.status(500).json({ error: 'Failed to fetch options' });
          return;
        }

        console.log('[portfolio-options-simple] Fetched options from DB:', {
          count: options?.length || 0,
          portfolioId
        });

        // Transform snake_case to camelCase for frontend
        const transformedOptions = (options || []).map((option: any) => ({
          id: option.id,
          portfolioId: option.portfolio_id,
          symbol: option.symbol,
          optionSymbol: option.option_symbol,
          optionType: option.option_type,
          strikePrice: option.strike_price,
          expirationDate: option.expiration_date,
          contracts: option.contracts,
          direction: option.direction,
          costPrice: option.cost_price,
          currentPrice: option.current_price,
          deltaValue: option.delta_value,
          gammaValue: option.gamma_value,
          thetaValue: option.theta_value,
          vegaValue: option.vega_value,
          impliedVolatility: option.implied_volatility,
          createdAt: option.created_at,
          updatedAt: option.updated_at
        }));

        console.log('[portfolio-options-simple] Transformed options:', {
          count: transformedOptions.length,
          sample: transformedOptions[0] ? {
            symbol: transformedOptions[0].optionSymbol,
            currentPrice: transformedOptions[0].currentPrice,
            deltaValue: transformedOptions[0].deltaValue
          } : 'no data'
        });

        res.status(200).json(transformedOptions);
      }
    } else if (req.method === 'POST') {
      const optionData = req.body;

      if (isGuestMode) {
        // Guest mode - store in memory
        const newOption = {
          id: `option-${Date.now()}`,
          portfolioId,
          symbol: optionData.symbol,
          optionSymbol: optionData.optionSymbol,
          optionType: optionData.optionType || 'call',
          strikePrice: optionData.strikePrice,
          expirationDate: optionData.expirationDate,
          contracts: optionData.contracts || 1,
          direction: optionData.direction || 'BUY',
          costPrice: optionData.costPrice,
          currentPrice: optionData.currentPrice || optionData.costPrice,
          deltaValue: optionData.deltaValue || '0',
          gammaValue: optionData.gammaValue || '0',
          thetaValue: optionData.thetaValue || '0',
          vegaValue: optionData.vegaValue || '0',
          impliedVolatility: optionData.impliedVolatility || '0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (!guestOptions[portfolioId]) {
          guestOptions[portfolioId] = [];
        }
        guestOptions[portfolioId].push(newOption);

        res.status(201).json(newOption);
      } else {
        // Authenticated mode - insert into database
        if (!authHeader) {
          res.status(401).json({ error: 'Authorization required' });
          return;
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        // Insert new option
        const { data: newOption, error: insertError } = await supabase
          .from('option_holdings')
          .insert([{
            portfolio_id: portfolioId,
            symbol: optionData.symbol,
            option_symbol: optionData.optionSymbol,
            option_type: optionData.optionType,
            strike_price: optionData.strikePrice,
            expiration_date: optionData.expirationDate,
            contracts: optionData.contracts,
            direction: optionData.direction,
            cost_price: optionData.costPrice,
            current_price: optionData.currentPrice || optionData.costPrice,
            delta_value: optionData.deltaValue || '0',
            gamma_value: optionData.gammaValue || '0',
            theta_value: optionData.thetaValue || '0',
            vega_value: optionData.vegaValue || '0',
            implied_volatility: optionData.impliedVolatility || '0'
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating option:', insertError);
          res.status(500).json({ error: 'Failed to create option' });
          return;
        }

        // Transform response
        const transformedOption = {
          id: newOption.id,
          portfolioId: newOption.portfolio_id,
          symbol: newOption.symbol,
          optionSymbol: newOption.option_symbol,
          optionType: newOption.option_type,
          strikePrice: newOption.strike_price,
          expirationDate: newOption.expiration_date,
          contracts: newOption.contracts,
          direction: newOption.direction,
          costPrice: newOption.cost_price,
          currentPrice: newOption.current_price,
          deltaValue: newOption.delta_value,
          gammaValue: newOption.gamma_value,
          thetaValue: newOption.theta_value,
          vegaValue: newOption.vega_value,
          impliedVolatility: newOption.implied_volatility,
          createdAt: newOption.created_at,
          updatedAt: newOption.updated_at
        };

        res.status(201).json(transformedOption);
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[portfolio-options-simple] Unexpected error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
