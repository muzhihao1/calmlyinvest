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
  
  // Return mock suggestions
  res.status(200).json([
    {
      id: 'suggestion-1',
      type: 'add_stocks',
      title: '开始投资',
      description: '添加一些股票持仓开始您的投资之旅',
      priority: 'medium',
      actionable: true
    },
    {
      id: 'suggestion-2', 
      type: 'diversify',
      title: '分散投资',
      description: '考虑投资不同行业的股票以降低风险',
      priority: 'low',
      actionable: true
    }
  ]);
}