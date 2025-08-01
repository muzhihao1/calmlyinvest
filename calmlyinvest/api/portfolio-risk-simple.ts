import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const portfolioId = req.query.portfolioId as string;
  
  // Return mock risk metrics
  res.status(200).json({
    portfolioId: portfolioId,
    leverageRatio: '0.00',
    portfolioBeta: '0.00',
    maxConcentration: '0.00',
    marginUsage: '0.00',
    cashRatio: '100.00',
    riskLevel: 'low',
    lastCalculated: new Date().toISOString()
  });
}