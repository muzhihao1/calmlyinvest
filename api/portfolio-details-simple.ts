import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  
  if (req.method === 'GET') {
    // Return mock portfolio details for both demo and real portfolios
    if (portfolioId === 'demo-portfolio-1') {
      res.status(200).json({
        id: 'demo-portfolio-1',
        userId: 'guest-user',
        name: 'Demo Portfolio',
        totalEquity: '10000.00',
        cashBalance: '5000.00',
        marginUsed: '0.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (portfolioId) {
      // For real portfolios, return a placeholder response to avoid blocking UI
      res.status(200).json({
        id: portfolioId,
        userId: 'authenticated-user',
        name: '我的投资组合',
        totalEquity: '1000000.00',
        cashBalance: '300000.00',
        marginUsed: '0.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      res.status(404).json({ error: 'Portfolio not found' });
    }
  } else if (req.method === 'PUT') {
    // Mock portfolio update
    const updatedPortfolio = {
      id: portfolioId,
      userId: 'guest-user',
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.status(200).json(updatedPortfolio);
  } else if (req.method === 'DELETE') {
    // Mock portfolio deletion
    res.status(204).end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}