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
    // Return empty options for now
    res.status(200).json([]);
  } else if (req.method === 'POST') {
    // Mock option creation
    const newOption = {
      id: `option-${Date.now()}`,
      portfolioId: portfolioId,
      symbol: req.body?.symbol || 'DEMO',
      optionType: req.body?.optionType || 'call',
      strikePrice: req.body?.strikePrice || '15.00',
      expirationDate: req.body?.expirationDate || '2024-12-31',
      quantity: req.body?.quantity || 1,
      premium: req.body?.premium || '2.50',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(newOption);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}