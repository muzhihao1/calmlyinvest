import { VercelRequest, VercelResponse } from '@vercel/node';

// Enable CORS
const allowCors = (handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
  const { method, query } = req;
  const { portfolioId } = query;

  if (!portfolioId || typeof portfolioId !== 'string') {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  try {
    switch (method) {
      case 'POST': {
        // Create a new stock holding
        const stockData = req.body;
        const newStock = {
          id: `stock-${Date.now()}`,
          portfolioId,
          ...stockData,
          marketValue: (parseFloat(stockData.quantity) * parseFloat(stockData.currentPrice || stockData.costPrice)).toFixed(2),
          unrealizedPnl: ((parseFloat(stockData.currentPrice || stockData.costPrice) - parseFloat(stockData.costPrice)) * parseFloat(stockData.quantity)).toFixed(2),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        res.status(201).json(newStock);
        break;
      }
      
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Stock holding API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default allowCors(handler);