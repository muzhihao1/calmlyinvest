import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const userId = (req.query.userId || req.body?.userId) as string;
  
  if (req.method === 'GET') {
    // Return default risk settings
    res.status(200).json({
      leverageSafeThreshold: "1.0",
      leverageWarningThreshold: "1.5",
      concentrationLimit: "20.0",
      industryConcentrationLimit: "60.0",
      minCashRatio: "30.0",
      leverageAlerts: true,
      expirationAlerts: true,
      volatilityAlerts: false,
      dataUpdateFrequency: 5
    });
  } else if (req.method === 'PUT') {
    // Mock settings update
    res.status(200).json({
      ...req.body,
      updatedAt: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}