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
  const { symbol } = query;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  // Return mock stock quote data
  const mockQuotes: Record<string, any> = {
    'AAPL': {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 195.50,
      previousClose: 193.20,
      change: 2.30,
      changePercent: 1.19,
      marketCap: 3000000000000,
      volume: 45000000,
      beta: 1.25
    },
    'GOOGL': {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 150.25,
      previousClose: 148.50,
      change: 1.75,
      changePercent: 1.18,
      marketCap: 1900000000000,
      volume: 25000000,
      beta: 1.08
    },
    'MSFT': {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 425.00,
      previousClose: 420.00,
      change: 5.00,
      changePercent: 1.19,
      marketCap: 3100000000000,
      volume: 22000000,
      beta: 0.95
    }
  };

  // Return mock data for the requested symbol
  const quote = mockQuotes[symbol.toUpperCase()] || {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase() + ' Corp.',
    price: 100.00,
    previousClose: 98.00,
    change: 2.00,
    changePercent: 2.04,
    marketCap: 1000000000,
    volume: 1000000,
    beta: 1.00
  };

  res.status(200).json(quote);
}

export default allowCors(handler);