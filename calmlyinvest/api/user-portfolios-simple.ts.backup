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
  
  const userId = req.query.userId as string;
  
  // Return mock portfolio data for guest-user
  if (userId === 'guest-user') {
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
  } else {
    res.status(200).json([]);
  }
}