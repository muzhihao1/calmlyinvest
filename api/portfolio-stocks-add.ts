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
const guestStocks: Record<string, any[]> = {};

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
        // Create a new stock holding
        const stockData = req.body;
        
        if (isGuestMode) {
          // Guest mode - use in-memory storage
          const newStock = {
            id: `stock-${Date.now()}`,
            portfolioId,
            symbol: stockData.symbol,
            name: stockData.name || stockData.symbol,
            quantity: stockData.quantity,
            costPrice: stockData.costPrice,
            currentPrice: stockData.currentPrice || stockData.costPrice,
            beta: stockData.beta || '1.0',
            marketValue: (parseFloat(stockData.quantity) * parseFloat(stockData.currentPrice || stockData.costPrice)).toFixed(2),
            unrealizedPnl: ((parseFloat(stockData.currentPrice || stockData.costPrice) - parseFloat(stockData.costPrice)) * parseFloat(stockData.quantity)).toFixed(2),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Store in memory
          if (!guestStocks[portfolioId]) {
            guestStocks[portfolioId] = [];
          }
          guestStocks[portfolioId].push(newStock);
          
          res.status(201).json(newStock);
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

          // Create new stock holding with proper database field names
          const newStock = {
            portfolio_id: portfolioId,
            symbol: stockData.symbol,
            name: stockData.name || stockData.symbol,
            quantity: parseInt(stockData.quantity),
            cost_price: parseFloat(stockData.costPrice),
            current_price: parseFloat(stockData.currentPrice || stockData.costPrice),
            beta: parseFloat(stockData.beta || '1.0')
          };

          console.log('Inserting stock:', newStock);

          // Use admin client to bypass RLS
          const { data: insertedStock, error: insertError } = await supabaseAdmin
            .from('stock_holdings')
            .insert([newStock])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating stock:', insertError);
            return res.status(500).json({ error: 'Failed to create stock', details: insertError.message });
          }

          console.log('Stock created successfully:', insertedStock);
          res.status(201).json(insertedStock);
        }
        break;
      }
      
      case 'GET': {
        // Get stocks for portfolio
        if (isGuestMode) {
          const stocks = guestStocks[portfolioId] || [];
          res.status(200).json(stocks);
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

          // Fetch stocks from database using admin client
          const { data: stocks, error: fetchError } = await supabaseAdmin
            .from('stock_holdings')
            .select('*')
            .eq('portfolio_id', portfolioId);

          if (fetchError) {
            console.error('Error fetching stocks:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch stocks', details: fetchError.message });
          }

          res.status(200).json(stocks || []);
        }
        break;
      }
      
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Stock holding API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default allowCors(handler);