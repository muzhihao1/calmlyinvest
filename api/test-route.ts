import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    method: req.method,
    url: req.url,
    query: req.query,
    message: 'Test route is working!'
  });
}