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
  
  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;
  
  if (req.method === 'GET') {
    // Return empty stocks for now
    res.status(200).json([]);
  } else if (req.method === 'POST') {
    // Mock stock creation
    const newStock = {
      id: `stock-${Date.now()}`,
      portfolioId: portfolioId,
      symbol: req.body?.symbol || 'DEMO',
      name: req.body?.name || 'Demo Stock',
      quantity: req.body?.quantity || 100,
      costPrice: req.body?.costPrice || '10.00',
      currentPrice: req.body?.currentPrice || '12.00',
      beta: req.body?.beta || '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(newStock);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}