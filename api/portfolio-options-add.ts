import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Enable CORS
const allowCors = (handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Guest-User'
    );
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    return await handler(req, res);
  };
};

// In-memory storage for guest mode
const guestOptions: Record<string, any[]> = {};

async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, headers } = req;
  const { portfolioId } = query;

  if (!portfolioId || typeof portfolioId !== 'string') {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  // Check if it's guest mode
  const isGuestMode = headers['x-guest-user'] === 'true';
  const authHeader = headers.authorization;
  
  try {
    switch (method) {
      case 'POST': {
        // Create a new option holding
        const optionData = req.body;

        if (isGuestMode) {
          // Guest mode - use in-memory storage
          const newOption = {
            id: `option-${Date.now()}`,
            portfolioId,
            optionSymbol: optionData.optionSymbol,
            underlyingSymbol: optionData.underlyingSymbol,
            optionType: optionData.optionType,
            direction: optionData.direction,
            contracts: optionData.contracts,
            strikePrice: optionData.strikePrice,
            expirationDate: optionData.expirationDate,
            costPrice: optionData.costPrice,
            currentPrice: optionData.currentPrice || optionData.costPrice,
            deltaValue: optionData.deltaValue || '0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Store in memory
          if (!guestOptions[portfolioId]) {
            guestOptions[portfolioId] = [];
          }
          guestOptions[portfolioId].push(newOption);

          res.status(201).json(newOption);
        } else {
          // Authenticated mode - save to Supabase database
          const token = authHeader?.replace('Bearer ', '');

          if (!token) {
            return res.status(401).json({ error: 'Authorization required' });
          }

          // Verify the user with Supabase (using anon key + token)
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

          // Create admin client to bypass RLS
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

          // Create new option holding with proper database field names
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
            current_price: optionData.currentPrice ? parseFloat(optionData.currentPrice) : null,
            delta_value: optionData.deltaValue ? parseFloat(optionData.deltaValue) : null
          };

          console.log('Inserting option:', newOption);

          // Use admin client to bypass RLS
          const { data: insertedOption, error: insertError } = await supabaseAdmin
            .from('option_holdings')
            .insert([newOption])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating option:', insertError);
            return res.status(500).json({ error: 'Failed to create option', details: insertError.message });
          }

          console.log('Option created successfully:', insertedOption);
          res.status(201).json(insertedOption);
        }
        break;
      }
      
      case 'GET': {
        // Get options for portfolio
        if (isGuestMode) {
          const options = guestOptions[portfolioId] || [];
          res.status(200).json(options);
        } else {
          // Authenticated mode - fetch from Supabase
          const token = authHeader?.replace('Bearer ', '');

          if (!token) {
            return res.status(401).json({ error: 'Authorization required' });
          }

          // Verify the user with Supabase (using anon key + token)
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

          // Create admin client to bypass RLS
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

          // Fetch options from database using admin client
          const { data: options, error: fetchError } = await supabaseAdmin
            .from('option_holdings')
            .select('*')
            .eq('portfolio_id', portfolioId);

          if (fetchError) {
            console.error('Error fetching options:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch options', details: fetchError.message });
          }

          res.status(200).json(options || []);
        }
        break;
      }
      
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Option holding API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default allowCors(handler);