import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStockHoldingSchema, 
  insertOptionHoldingSchema, 
  insertRiskSettingsSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Portfolio routes
  app.get("/api/portfolios/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const portfolios = await storage.getPortfolios(userId);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolios" });
    }
  });

  app.get("/api/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const portfolio = await storage.getPortfolio(id);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Stock holdings routes
  app.get("/api/portfolio/:id/stocks", async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const holdings = await storage.getStockHoldings(portfolioId);
      res.json(holdings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock holdings" });
    }
  });

  app.post("/api/portfolio/:id/stocks", async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const validatedData = insertStockHoldingSchema.parse({
        ...req.body,
        portfolioId
      });
      const holding = await storage.createStockHolding(validatedData);
      res.status(201).json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create stock holding" });
    }
  });

  app.put("/api/stocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const holding = await storage.updateStockHolding(id, req.body);
      if (!holding) {
        return res.status(404).json({ error: "Stock holding not found" });
      }
      res.json(holding);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock holding" });
    }
  });

  app.delete("/api/stocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStockHolding(id);
      if (!deleted) {
        return res.status(404).json({ error: "Stock holding not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock holding" });
    }
  });

  // Option holdings routes
  app.get("/api/portfolio/:id/options", async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const holdings = await storage.getOptionHoldings(portfolioId);
      res.json(holdings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch option holdings" });
    }
  });

  app.post("/api/portfolio/:id/options", async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const validatedData = insertOptionHoldingSchema.parse({
        ...req.body,
        portfolioId
      });
      const holding = await storage.createOptionHolding(validatedData);
      res.status(201).json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create option holding" });
    }
  });

  app.put("/api/options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const holding = await storage.updateOptionHolding(id, req.body);
      if (!holding) {
        return res.status(404).json({ error: "Option holding not found" });
      }
      res.json(holding);
    } catch (error) {
      res.status(500).json({ error: "Failed to update option holding" });
    }
  });

  app.delete("/api/options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOptionHolding(id);
      if (!deleted) {
        return res.status(404).json({ error: "Option holding not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete option holding" });
    }
  });

  // Risk calculation routes
  app.get("/api/portfolio/:id/risk", async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      
      // Get portfolio data
      const portfolio = await storage.getPortfolio(portfolioId);
      const stockHoldings = await storage.getStockHoldings(portfolioId);
      const optionHoldings = await storage.getOptionHoldings(portfolioId);
      
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      // Calculate risk metrics
      const stockValue = stockHoldings.reduce((sum, holding) => {
        return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
      }, 0);

      const optionMaxLoss = optionHoldings.reduce((sum, option) => {
        if (option.direction === "BUY") {
          // Buy options: max loss is premium paid
          return sum + (Math.abs(option.contracts) * parseFloat(option.costPrice) * 100);
        } else {
          // Sell options: calculate based on type
          if (option.optionType === "PUT") {
            // Sell put: max loss = (strike - premium) * contracts * 100
            const maxLoss = (parseFloat(option.strikePrice) - parseFloat(option.costPrice)) * Math.abs(option.contracts) * 100;
            return sum + Math.max(maxLoss, 0);
          } else {
            // Sell call: unlimited risk, estimate as 3x current underlying price
            const underlyingPrice = stockHoldings.find(s => s.symbol === option.underlyingSymbol)?.currentPrice || "100";
            const estimatedLoss = parseFloat(underlyingPrice) * 3 * Math.abs(option.contracts) * 100;
            return sum + estimatedLoss;
          }
        }
      }, 0);

      const totalEquity = parseFloat(portfolio.totalEquity || "0");
      const leverageRatio = totalEquity > 0 ? (stockValue + optionMaxLoss) / totalEquity : 0;

      // Calculate portfolio beta
      const totalStockValue = stockHoldings.reduce((sum, holding) => {
        return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
      }, 0);

      const weightedBeta = stockHoldings.reduce((sum, holding) => {
        const weight = totalStockValue > 0 ? (holding.quantity * parseFloat(holding.currentPrice || "0")) / totalStockValue : 0;
        const beta = parseFloat(holding.beta || "1.0");
        return sum + (weight * beta);
      }, 0);

      // Calculate max concentration
      const maxConcentration = stockHoldings.reduce((max, holding) => {
        const value = holding.quantity * parseFloat(holding.currentPrice || "0");
        const concentration = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
        return Math.max(max, concentration);
      }, 0);

      // Calculate margin usage ratio
      const marginUsed = parseFloat(portfolio.marginUsed || "0");
      const marginUsageRatio = totalEquity > 0 ? (marginUsed / totalEquity) * 100 : 0;

      // Determine risk level
      let riskLevel = "GREEN";
      if (leverageRatio >= 1.5) {
        riskLevel = "RED";
      } else if (leverageRatio >= 1.0) {
        riskLevel = "YELLOW";
      }

      const riskMetrics = {
        leverageRatio: leverageRatio.toFixed(4),
        portfolioBeta: weightedBeta.toFixed(4),
        maxConcentration: maxConcentration.toFixed(2),
        marginUsageRatio: marginUsageRatio.toFixed(2),
        riskLevel,
        stockValue: stockValue.toFixed(2),
        optionMaxLoss: optionMaxLoss.toFixed(2),
        totalEquity: totalEquity.toFixed(2),
        remainingLiquidity: ((totalEquity - marginUsed) / totalEquity * 100).toFixed(2)
      };

      res.json(riskMetrics);
    } catch (error) {
      console.error("Risk calculation error:", error);
      res.status(500).json({ error: "Failed to calculate risk metrics" });
    }
  });

  // Risk settings routes
  app.get("/api/user/:userId/risk-settings", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getRiskSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk settings" });
    }
  });

  app.put("/api/user/:userId/risk-settings", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertRiskSettingsSchema.parse({
        ...req.body,
        userId
      });
      const settings = await storage.updateRiskSettings(userId, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update risk settings" });
    }
  });

  // Smart suggestions route
  app.get("/api/portfolio/:id/suggestions", async (req, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      
      const portfolio = await storage.getPortfolio(portfolioId);
      const stockHoldings = await storage.getStockHoldings(portfolioId);
      const optionHoldings = await storage.getOptionHoldings(portfolioId);
      
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      const suggestions = [];
      const totalEquity = parseFloat(portfolio.totalEquity || "0");
      const marginUsed = parseFloat(portfolio.marginUsed || "0");
      const remainingLiquidityRatio = ((totalEquity - marginUsed) / totalEquity) * 100;

      // Calculate current metrics for suggestions
      const totalStockValue = stockHoldings.reduce((sum, holding) => {
        return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
      }, 0);

      // Check concentration risk
      stockHoldings.forEach(holding => {
        const value = holding.quantity * parseFloat(holding.currentPrice || "0");
        const concentration = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
        
        if (concentration > 20) {
          suggestions.push({
            type: "IMMEDIATE",
            priority: "HIGH",
            title: `减少${holding.symbol}持仓`,
            description: `当前${holding.symbol}持仓占比${concentration.toFixed(1)}%，远超建议的20%上限。建议减持以降低集中度风险。`,
            action: "REDUCE_POSITION",
            symbol: holding.symbol,
            currentConcentration: concentration.toFixed(1),
            suggestedReduction: Math.ceil((concentration - 20) / 100 * holding.quantity)
          });
        }
      });

      // Check liquidity risk
      if (remainingLiquidityRatio < 30) {
        suggestions.push({
          type: "IMMEDIATE",
          priority: remainingLiquidityRatio < 15 ? "HIGH" : "MEDIUM",
          title: "增加现金缓冲",
          description: `剩余流动性仅${remainingLiquidityRatio.toFixed(1)}%，低于建议的30%。建议减少部分持仓或暂停新投资。`,
          action: "INCREASE_CASH",
          currentLiquidity: remainingLiquidityRatio.toFixed(1),
          targetLiquidity: "30.0"
        });
      }

      // Check option expiration
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      optionHoldings.forEach(option => {
        const expirationDate = new Date(option.expirationDate);
        const daysToExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysToExpiration <= 60 && daysToExpiration > 7) {
          suggestions.push({
            type: "OPTION_MANAGEMENT",
            priority: "MEDIUM",
            title: `${option.underlyingSymbol} ${option.optionType} Rollover建议`,
            description: `${option.optionSymbol}距离到期还有${daysToExpiration}天，当前Delta=${option.deltaValue}，建议考虑滚动操作。`,
            action: "ROLLOVER_OPTION",
            optionSymbol: option.optionSymbol,
            daysToExpiration,
            delta: option.deltaValue
          });
        } else if (daysToExpiration <= 7) {
          suggestions.push({
            type: "IMMEDIATE",
            priority: "HIGH",
            title: `${option.underlyingSymbol} 期权即将到期`,
            description: `${option.optionSymbol}将在${daysToExpiration}天内到期，请及时处理。`,
            action: "HANDLE_EXPIRATION",
            optionSymbol: option.optionSymbol,
            daysToExpiration
          });
        }
      });

      res.json(suggestions);
    } catch (error) {
      console.error("Suggestions calculation error:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
