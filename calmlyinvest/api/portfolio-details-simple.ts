import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, sendSuccess, sendError } from "./_utils/response";
import { requireAuth } from "./_utils/auth";
import { getStorage } from "./_utils/storage";
import { verifyPortfolioAccess } from "./_utils/portfolio-auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    res.status(200).end();
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

  if (user.id === "guest-user" && portfolioId === "demo-portfolio-1") {
    if (req.method === "GET") {
      sendSuccess(res, {
        id: "demo-portfolio-1",
        userId: "guest-user",
        name: "Demo Portfolio",
        totalEquity: "10000.00",
        cashBalance: "5000.00",
        marginUsed: "0.00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (req.method === "PUT") {
      sendError(res, "Guest portfolio cannot be modified", 403);
    } else if (req.method === "DELETE") {
      sendError(res, "Guest portfolio cannot be deleted", 403);
    } else {
      sendError(res, "Method not allowed", 405);
    }
    return;
  }

  const storage = await getStorage(user, req);

  try {
    switch (req.method) {
      case "GET": {
        const { portfolio, error, status } = await verifyPortfolioAccess(
          storage,
          portfolioId,
          user,
          req,
        );

        if (error) {
          sendError(res, error, status || 500);
          return;
        }

        sendSuccess(res, portfolio);
        break;
      }

      case "PUT": {
        const existing = await storage.getPortfolio(portfolioId, req);
        if (!existing || existing.userId !== user.id) {
          sendError(res, "Portfolio not found", 404);
          return;
        }

        const updatedPortfolio = await storage.updatePortfolio(portfolioId, req.body, req);
        sendSuccess(res, updatedPortfolio);
        break;
      }

      case "DELETE": {
        const existing = await storage.getPortfolio(portfolioId, req);
        if (!existing || existing.userId !== user.id) {
          sendError(res, "Portfolio not found", 404);
          return;
        }

        await storage.deletePortfolio(portfolioId, req);
        res.status(204).end();
        break;
      }

      default:
        sendError(res, "Method not allowed", 405);
    }
  } catch (error) {
    console.error(`Error ${req.method} portfolio (simple):`, error);
    sendError(res, "Failed to process portfolio request", 500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
