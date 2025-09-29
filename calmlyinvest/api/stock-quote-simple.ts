import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, sendSuccess, sendError } from "./_utils/response.js";
import { getMarketDataProvider } from "./_utils/market-data.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    sendError(res, "Method not allowed", 405);
    return;
  }

  const symbol = (req.query.symbol || req.body?.symbol) as string;
  if (!symbol) {
    sendError(res, "symbol is required", 400);
    return;
  }

  try {
    const provider = getMarketDataProvider();
    const quote = await provider.getStockQuote(symbol.toUpperCase());

    sendSuccess(res, {
      symbol: quote.symbol,
      name: quote.name,
      currentPrice: quote.price?.toFixed?.(2) ?? quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: quote.marketCap,
      beta: quote.beta,
      updatedAt: quote.lastUpdated.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch stock quote:", error);
    sendError(res, "Failed to fetch stock quote", 500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
