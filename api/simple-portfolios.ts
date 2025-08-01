import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    console.log('Simple portfolios endpoint called with method:', req.method);
    
    // For now, return mock data for both GET and POST
    if (req.method === 'GET') {
      // Mock portfolio data
      res.status(200).json([
        {
          id: 'demo-portfolio-1',
          userId: 'guest-user',
          name: 'Demo Portfolio',
          totalEquity: '10000.00',
          cashBalance: '5000.00',
          marginUsed: '0.00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } else if (req.method === 'POST') {
      // Mock portfolio creation
      const newPortfolio = {
        id: `portfolio-${Date.now()}`,
        userId: 'guest-user',
        name: req.body?.name || 'New Portfolio',
        totalEquity: req.body?.totalEquity || '0.00',
        cashBalance: req.body?.cashBalance || '0.00', 
        marginUsed: req.body?.marginUsed || '0.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(newPortfolio);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Simple portfolios error:', error);
    res.status(500).json({ 
      error: 'Simple portfolios failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}