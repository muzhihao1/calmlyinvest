import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Extract token from Authorization header
 * Inline implementation to avoid import issues in Vercel serverless
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    console.log('[Token Parser] No Authorization header provided');
    return null;
  }

  const normalized = authHeader.trim();

  if (!normalized.startsWith('Bearer ')) {
    console.error(`[Token Parser] Header doesn't start with "Bearer "`);
    return null;
  }

  const token = normalized.substring(7);

  if (!token || token.length === 0) {
    console.error('[Token Parser] Token is empty after extraction');
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error(`[Token Parser] Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return null;
  }

  if (parts.some(part => part.length === 0)) {
    console.error('[Token Parser] JWT contains empty parts');
    return null;
  }

  return token;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In-memory storage for guest mode (shared between functions)
const guestStocks: Record<string, any[]> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Guest-User');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check environment variables at runtime
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[portfolio-stocks-simple] Missing Supabase environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
      hint: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;
  const authHeader = req.headers.authorization;

  // Check if it's guest mode
  const isGuestMode = portfolioId === 'demo-portfolio-1' || authHeader === 'Bearer guest-mode';

  try {
    if (req.method === 'GET') {
      if (isGuestMode) {
        // Guest mode - return from in-memory storage
        const stocks = guestStocks[portfolioId] || [];
        res.status(200).json(stocks);
      } else {
        // Authenticated mode - get from database
        if (!authHeader) {
          res.status(401).json({ error: 'Authorization required' });
          return;
        }

        const token = extractToken(authHeader);

        if (!token) {
          console.error('[portfolio-stocks-simple] Token extraction failed');
          res.status(401).json({ error: 'Invalid or malformed authorization token' });
          return;
        }

        // Verify the user with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        // Get stocks for this portfolio
        const { data: stocks, error: fetchError } = await supabase
          .from('stock_holdings')
          .select('*')
          .eq('portfolio_id', portfolioId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[portfolio-stocks-simple] Error fetching stocks:', fetchError);
          res.status(500).json({ error: 'Failed to fetch stocks', details: fetchError.message });
          return;
        }

        // Transform snake_case to camelCase for frontend
        const transformedStocks = (stocks || []).map((stock: any) => ({
          id: stock.id,
          portfolioId: stock.portfolio_id,
          symbol: stock.symbol,
          name: stock.name,
          quantity: stock.quantity,
          costPrice: stock.cost_price,
          currentPrice: stock.current_price,
          beta: stock.beta,
          createdAt: stock.created_at,
          updatedAt: stock.updated_at
        }));

        res.status(200).json(transformedStocks);
      }
    } else if (req.method === 'POST') {
      const stockData = req.body;

      if (isGuestMode) {
        // Guest mode - store in memory
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
        // Authenticated mode - save to database
        if (!authHeader) {
          res.status(401).json({ error: 'Authorization required' });
          return;
        }

        const token = extractToken(authHeader);

        if (!token) {
          console.error('[portfolio-stocks-simple] Token extraction failed in POST');
          res.status(401).json({ error: 'Invalid or malformed authorization token' });
          return;
        }

        // Verify the user with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        // Create new stock holding
        const newStock = {
          portfolio_id: portfolioId,
          symbol: stockData.symbol,
          name: stockData.name || stockData.symbol,
          quantity: parseInt(stockData.quantity),
          cost_price: parseFloat(stockData.costPrice),
          current_price: parseFloat(stockData.currentPrice || stockData.costPrice),
          beta: parseFloat(stockData.beta || '1.0')
        };

        const { data: insertedStock, error: insertError } = await supabase
          .from('stock_holdings')
          .insert([newStock])
          .select()
          .single();

        if (insertError) {
          console.error('[portfolio-stocks-simple] Error creating stock:', insertError);
          res.status(500).json({ error: 'Failed to create stock', details: insertError.message });
          return;
        }

        // Transform snake_case to camelCase for frontend
        const transformedStock = {
          id: insertedStock.id,
          portfolioId: insertedStock.portfolio_id,
          symbol: insertedStock.symbol,
          name: insertedStock.name,
          quantity: insertedStock.quantity,
          costPrice: insertedStock.cost_price,
          currentPrice: insertedStock.current_price,
          beta: insertedStock.beta,
          createdAt: insertedStock.created_at,
          updatedAt: insertedStock.updated_at
        };

        res.status(201).json(transformedStock);
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[portfolio-stocks-simple] Unexpected error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error'
    });
  }
}
