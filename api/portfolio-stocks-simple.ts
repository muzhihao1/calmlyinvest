import { VercelRequest, VercelResponse } from '@vercel/node';

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

  // Check if it's guest mode
  const isGuestMode = headers['x-guest-user'] === 'true';
  
  try {
    switch (method) {
      case 'GET': {
        if (!portfolioId || typeof portfolioId !== 'string') {
          return res.status(400).json({ error: 'Portfolio ID is required' });
        }
        
        if (isGuestMode) {
          // Guest mode - return stocks from memory
          const stocks = guestStocks[portfolioId] || [];
          res.status(200).json(stocks);
        } else {
          // Authenticated mode - for now return empty array
          // This should be replaced with actual database query
          res.status(200).json([]);
        }
        break;
      }
      
      case 'POST': {
        // Create a new stock holding
        const stockData = req.body;
        const pid = stockData.portfolioId || portfolioId;
        
        if (!pid) {
          return res.status(400).json({ error: 'Portfolio ID is required' });
        }
        
        if (isGuestMode) {
          // Guest mode - use in-memory storage
          const newStock = {
            id: `stock-${Date.now()}`,
            portfolioId: pid,
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
          if (!guestStocks[pid]) {
            guestStocks[pid] = [];
          }
          guestStocks[pid].push(newStock);
          
          res.status(201).json(newStock);
        } else {
          // Authenticated mode - for now just return mock
          const newStock = {
            id: `stock-${Date.now()}`,
            portfolioId: pid,
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
          
          res.status(201).json(newStock);
        }
        break;
      }
      
      case 'PUT': {
        // Update stock holding
        const { id } = query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Stock ID is required' });
        }
        
        // For now, just return success
        res.status(200).json({ success: true });
        break;
      }
      
      case 'DELETE': {
        // Delete stock holding
        const { id } = query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Stock ID is required' });
        }
        
        // For now, just return success
        res.status(200).json({ success: true });
        break;
      }
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Stock holding API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default allowCors(handler);