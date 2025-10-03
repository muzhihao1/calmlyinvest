/**
 * Test endpoint to verify Market Data API integration in Vercel
 * Access: https://www.calmlyinvest.com/api/test-marketdata?symbol=MSFT%20251010P515
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const symbol = req.query.symbol as string || 'MSFT 251010P515';

  try {
    console.log('🧪 Testing Market Data API integration...');
    console.log(`📊 Test symbol: ${symbol}`);

    // Check environment variable
    const token = process.env.MARKETDATA_API_TOKEN;
    console.log(`🔑 Token configured: ${token ? 'YES' : 'NO'}`);
    console.log(`🔑 Token length: ${token?.length || 0}`);

    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'MARKETDATA_API_TOKEN not configured',
        env: Object.keys(process.env).filter(k => k.includes('MARKET') || k.includes('SUPABASE'))
      });
    }

    // Convert symbol
    const parts = symbol.trim().split(' ');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid symbol format' });
    }

    const underlying = parts[0].toUpperCase();
    const optionPart = parts[1];
    const match = optionPart.match(/^(\d{6})([CP])(\d+(?:\.\d+)?)$/);

    if (!match) {
      return res.status(400).json({ error: 'Invalid option format' });
    }

    const [, date, type, strike] = match;
    const strikeNum = parseFloat(strike);
    const strikeFormatted = Math.round(strikeNum * 1000).toString().padStart(8, '0');
    const marketDataSymbol = `${underlying}${date}${type}${strikeFormatted}`;

    console.log(`✅ Symbol converted: ${symbol} → ${marketDataSymbol}`);

    // Test axios import
    let axios;
    try {
      console.log('📦 Attempting to import axios...');
      axios = (await import('axios')).default;
      console.log('✅ axios imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import axios:', importError);
      return res.status(500).json({
        success: false,
        error: 'Failed to import axios',
        details: importError instanceof Error ? importError.message : String(importError)
      });
    }

    // Call Market Data API
    console.log(`📡 Calling Market Data API: ${marketDataSymbol}`);
    const response = await axios.get(
      `https://api.marketdata.app/v1/options/quotes/${marketDataSymbol}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`✅ API Response status: ${response.data.s}`);

    if (response.data.s !== 'ok') {
      return res.status(500).json({
        success: false,
        error: 'Invalid API response',
        status: response.data.s
      });
    }

    const data = response.data;
    let price = data.mid?.[0];

    if (!price || price === 0) {
      if (data.last && data.last[0] > 0) {
        price = data.last[0];
      } else if (data.bid && data.ask && data.bid[0] > 0 && data.ask[0] > 0) {
        price = (data.bid[0] + data.ask[0]) / 2;
      }
    }

    const delta = data.delta?.[0] || 0;

    console.log(`✅ Price: $${price?.toFixed(2)}, Delta: ${delta.toFixed(4)}`);

    return res.status(200).json({
      success: true,
      symbol,
      marketDataSymbol,
      price: price?.toFixed(2),
      delta: delta.toFixed(4),
      bid: data.bid?.[0]?.toFixed(2),
      ask: data.ask?.[0]?.toFixed(2),
      last: data.last?.[0]?.toFixed(2),
      underlyingPrice: data.underlyingPrice?.[0]?.toFixed(2),
      tokenConfigured: true,
      axiosAvailable: true
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      statusCode: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
  }
}
