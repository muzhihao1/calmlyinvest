import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, sendSuccess, sendError, handleValidationError } from "./_utils/response";
import { requireAuth } from "./_utils/auth";
import { getStorage } from "./_utils/storage";
import { verifyPortfolioAccess } from "./_utils/portfolio-auth";
import { insertStockHoldingSchema } from "@shared/schema-supabase";
import { z } from "zod";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    sendError(res, "Method not allowed", 405);
    return;
  }

  const authResult = await requireAuth(req);
  if ("error" in authResult) {
    sendError(res, authResult.error, authResult.status);
    return;
  }
  const user = authResult;

  const portfolioId = (req.query.portfolioId || req.body?.portfolioId) as string;
  if (!portfolioId) {
    sendError(res, "Portfolio ID is required", 400);
    return;
  }

  const storage = await getStorage(user, req);

  try {
    const { error, status } = await verifyPortfolioAccess(storage, portfolioId, user, req);
    if (error) {
      sendError(res, error, status || 500);
      return;
    }

    let payload;
    if (user.id === "guest-user" && portfolioId.startsWith("demo-")) {
      payload = {
        portfolioId,
        symbol: req.body.symbol,
        name: req.body.name || req.body.symbol,
        quantity: Number(req.body.quantity),
        costPrice: req.body.costPrice,
        currentPrice: req.body.currentPrice ?? req.body.costPrice,
        beta: req.body.beta ?? "1.0",
      };
    } else {
      payload = insertStockHoldingSchema.parse({
        ...req.body,
        portfolioId,
      });
    }

    const holding = await storage.createStockHolding(payload, req);
    sendSuccess(res, holding, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleValidationError(res, error);
      return;
    }

    console.error("Error adding stock holding:", error);
    sendError(res, "Failed to add stock holding", 500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
