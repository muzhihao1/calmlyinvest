import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;

  if (!portfolioId) {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const isGuestMode = req.headers['x-guest-user'] === 'true';

      // Handle guest mode
      if (isGuestMode || !authHeader) {
        if (portfolioId === 'demo-portfolio-1') {
          return res.status(200).json({
            id: 'demo-portfolio-1',
            userId: 'guest-user',
            name: 'Demo Portfolio',
            totalEquity: '10000.00',
            cashBalance: '5000.00',
            marginUsed: '0.00',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      const token = authHeader.replace('Bearer ', '');

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

      // Use admin client to fetch portfolio
      if (!supabaseServiceKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

      // Fetch portfolio from database
      const { data: portfolio, error: fetchError } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (fetchError || !portfolio) {
        console.error('Portfolio error:', fetchError);
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      // Verify portfolio belongs to user
      if (portfolio.user_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Dynamically calculate total_equity from holdings
      // Fetch stock holdings
      const { data: stocks } = await supabaseAdmin
        .from('stock_holdings')
        .select('quantity, current_price')
        .eq('portfolio_id', portfolioId);

      // Fetch option holdings (only ACTIVE ones)
      const { data: options } = await supabaseAdmin
        .from('option_holdings')
        .select('contracts, current_price')
        .eq('portfolio_id', portfolioId)
        .eq('status', 'ACTIVE');

      // Calculate total stock value
      const totalStockValue = (stocks || []).reduce((sum: number, stock: any) => {
        return sum + (stock.quantity * parseFloat(stock.current_price || '0'));
      }, 0);

      // Calculate total option value (contracts * price * 100)
      const totalOptionValue = (options || []).reduce((sum: number, option: any) => {
        return sum + (option.contracts * parseFloat(option.current_price || '0') * 100);
      }, 0);

      // Calculate total equity = stock value + option value + cash - margin
      const cashBalance = parseFloat(portfolio.cash_balance || '0');
      const marginUsed = parseFloat(portfolio.margin_used || '0');
      const calculatedTotalEquity = totalStockValue + totalOptionValue + cashBalance - marginUsed;

      // Transform snake_case to camelCase for frontend
      const transformedPortfolio = {
        id: portfolio.id,
        userId: portfolio.user_id,
        name: portfolio.name,
        totalEquity: calculatedTotalEquity.toFixed(2), // Use calculated value
        cashBalance: portfolio.cash_balance,
        marginUsed: portfolio.margin_used,
        createdAt: portfolio.created_at,
        updatedAt: portfolio.updated_at
      };

      res.status(200).json(transformedPortfolio);
    } catch (error) {
      console.error('Error in GET /portfolio-details-simple:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');

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

      // Update portfolio
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.totalEquity !== undefined) updateData.total_equity = req.body.totalEquity;
      if (req.body.cashBalance !== undefined) updateData.cash_balance = req.body.cashBalance;
      if (req.body.marginUsed !== undefined) updateData.margin_used = req.body.marginUsed;

      const { data: updatedPortfolio, error: updateError } = await supabaseAdmin
        .from('portfolios')
        .update(updateData)
        .eq('id', portfolioId)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Failed to update portfolio', details: updateError.message });
      }

      // Transform snake_case to camelCase for frontend
      const transformedPortfolio = {
        id: updatedPortfolio.id,
        userId: updatedPortfolio.user_id,
        name: updatedPortfolio.name,
        totalEquity: updatedPortfolio.total_equity,
        cashBalance: updatedPortfolio.cash_balance,
        marginUsed: updatedPortfolio.margin_used,
        createdAt: updatedPortfolio.created_at,
        updatedAt: updatedPortfolio.updated_at
      };

      res.status(200).json(transformedPortfolio);
    } catch (error) {
      console.error('Error in PUT /portfolio-details-simple:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // Mock portfolio deletion
    res.status(204).end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}