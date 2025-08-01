import type { Express } from "express";
import { storageWrapper } from "./storage-wrapper";
import { 
  insertPortfolioSchema,
  insertStockHoldingSchema, 
  insertOptionHoldingSchema, 
  insertRiskSettingsSchema 
} from "@shared/schema-supabase";
import { z } from "zod";
import { getMarketDataProvider, updateStockPrices, updateOptionPrices } from "./market-data";
import { requireAuth, optionalAuth } from "./auth-supabase";

export interface Suggestion {
  type: string;
  priority: string;
  title: string;
  description: string;
  action: string;
  [key: string]: any;
}

// Helper function to check portfolio access
function isAuthorizedForPortfolio(portfolio: any, userId: string | undefined, portfolioId: string): boolean {
  // Guest users can access demo portfolio
  if (userId === 'guest-user' && portfolioId === 'demo-portfolio-1') {
    return true;
  }
  // Regular users must own the portfolio
  return portfolio && portfolio.userId === userId;
}

export function registerRoutes(app: Express): void {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      res.json({ 
        status: 'ok',
        storage: 'supabase',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Debug endpoint (remove in production)
  app.get("/api/debug/env", async (req, res) => {
    res.json({
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    });
  });
  
  // All routes below require authentication
  
  // Portfolio routes
  app.get("/api/portfolios/:userId", requireAuth, async (req, res) => {
    try {
      
      // Ensure user can only access their own portfolios
      if (req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const portfolios = await storageWrapper.getPortfolios(req.params.userId, req);
      res.json(portfolios);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      res.status(500).json({ error: "Failed to fetch portfolios" });
    }
  });

  app.get("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      
      // Ensure user owns this portfolio or is guest accessing demo
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ error: "Failed to fetch portfolio", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post("/api/portfolios", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPortfolioSchema.parse({
        ...req.body,
        userId: req.user?.id
      });
      const portfolio = await storageWrapper.createPortfolio(validatedData, req);
      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Portfolio validation error:', error.errors);
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error('Failed to create portfolio:', error);
      res.status(500).json({ error: "Failed to create portfolio", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.put("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      // Check ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!portfolio || portfolio.userId !== req.user?.id) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      
      const updatedPortfolio = await storageWrapper.updatePortfolio(req.params.id, req.body, req);
      res.json(updatedPortfolio);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      res.status(500).json({ error: "Failed to update portfolio", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.delete("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      // Check ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!portfolio || portfolio.userId !== req.user?.id) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      
      await storageWrapper.deletePortfolio(req.params.id, req);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      res.status(500).json({ error: "Failed to delete portfolio", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Stock holdings routes
  app.get("/api/portfolio/:id/stocks", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const holdings = await storageWrapper.getStockHoldings(req.params.id, req);
      res.json(holdings);
    } catch (error) {
      console.error('Error fetching stock holdings:', error);
      res.status(500).json({ error: "Failed to fetch stock holdings", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/portfolio/:id/stocks", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // For guest mode, skip UUID validation for portfolioId
      let validatedData;
      if (req.user?.id === 'guest-user' && req.params.id.startsWith('demo-')) {
        // Manually validate without UUID check for guest mode
        validatedData = {
          portfolioId: req.params.id,
          symbol: req.body.symbol,
          name: req.body.name,
          quantity: parseInt(req.body.quantity),
          costPrice: req.body.costPrice,
          currentPrice: req.body.currentPrice,
          beta: req.body.beta
        };
      } else {
        validatedData = insertStockHoldingSchema.parse({
          ...req.body,
          portfolioId: req.params.id
        });
      }
      
      const holding = await storageWrapper.createStockHolding(validatedData, req);
      res.status(201).json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error('Error creating stock holding:', error);
      res.status(500).json({ error: "Failed to create stock holding", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/stocks/:id", requireAuth, async (req, res) => {
    try {
      const holding = await storageWrapper.updateStockHolding(req.params.id, req.body, req);
      res.json(holding);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock holding" });
    }
  });

  app.delete("/api/stocks/:id", requireAuth, async (req, res) => {
    try {
      await storageWrapper.deleteStockHolding(req.params.id, req);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock holding" });
    }
  });

  // Stock quote route
  app.get("/api/stock/quote/:symbol", requireAuth, async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const provider = getMarketDataProvider();
      const quote = await provider.getStockQuote(symbol);
      res.json(quote);
    } catch (error) {
      console.error('Stock quote error:', error);
      res.status(500).json({ error: "Failed to fetch stock quote", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Option holdings routes
  app.get("/api/portfolio/:id/options", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const holdings = await storageWrapper.getOptionHoldings(req.params.id, req);
      res.json(holdings);
    } catch (error) {
      console.error('Error fetching option holdings:', error);
      res.status(500).json({ error: "Failed to fetch option holdings", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/portfolio/:id/options", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const validatedData = insertOptionHoldingSchema.parse({
        ...req.body,
        portfolioId: req.params.id
      });
      const holding = await storageWrapper.createOptionHolding(validatedData, req);
      res.status(201).json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create option holding" });
    }
  });

  app.put("/api/options/:id", requireAuth, async (req, res) => {
    try {
      const holding = await storageWrapper.updateOptionHolding(req.params.id, req.body, req);
      res.json(holding);
    } catch (error) {
      res.status(500).json({ error: "Failed to update option holding" });
    }
  });

  app.delete("/api/options/:id", requireAuth, async (req, res) => {
    try {
      await storageWrapper.deleteOptionHolding(req.params.id, req);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete option holding" });
    }
  });

  // Risk calculation routes
  app.get("/api/portfolio/:id/risk", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const stockHoldings = await storageWrapper.getStockHoldings(req.params.id, req);
      const optionHoldings = await storageWrapper.getOptionHoldings(req.params.id, req);

      // Calculate risk metrics
      const stockValue = stockHoldings.reduce((sum, holding) => {
        return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
      }, 0);

      const optionMaxLoss = optionHoldings.reduce((sum, option) => {
        if (option.direction === "BUY") {
          return sum + (Math.abs(option.contracts) * parseFloat(option.costPrice) * 100);
        } else {
          if (option.optionType === "PUT") {
            const maxLoss = (parseFloat(option.strikePrice) - parseFloat(option.costPrice)) * Math.abs(option.contracts) * 100;
            return sum + Math.max(maxLoss, 0);
          } else {
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

      // Save risk metrics
      await storageWrapper.createRiskMetrics({
        portfolioId: req.params.id,
        leverageRatio: riskMetrics.leverageRatio,
        portfolioBeta: riskMetrics.portfolioBeta,
        maxConcentration: riskMetrics.maxConcentration,
        marginUsageRatio: riskMetrics.marginUsageRatio,
        riskLevel
      }, req);

      res.json(riskMetrics);
    } catch (error) {
      console.error("Risk calculation error:", error);
      res.status(500).json({ error: "Failed to calculate risk metrics" });
    }
  });

  // Risk settings routes
  app.get("/api/user/:userId/risk-settings", requireAuth, async (req, res) => {
    try {
      // Ensure user can only access their own settings
      if (req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const settings = await storageWrapper.getRiskSettings(req.params.userId, req);
      if (!settings) {
        // Return default settings
        return res.json({
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
      }
      res.json(settings);
    } catch (error) {
      console.error('Error fetching risk settings:', error);
      res.status(500).json({ error: "Failed to fetch risk settings", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/user/:userId/risk-settings", requireAuth, async (req, res) => {
    try {
      // Ensure user can only update their own settings
      if (req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const validatedData = insertRiskSettingsSchema.parse({
        ...req.body,
        userId: req.params.userId
      });
      const settings = await storageWrapper.updateRiskSettings(req.params.userId, validatedData, req);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error('Error updating risk settings:', error);
      res.status(500).json({ error: "Failed to update risk settings", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Smart suggestions route
  app.get("/api/portfolio/:id/suggestions", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const stockHoldings = await storageWrapper.getStockHoldings(req.params.id, req);
      const optionHoldings = await storageWrapper.getOptionHoldings(req.params.id, req);

      const suggestions: Suggestion[] = [];
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

  // Market data refresh endpoint
  app.post("/api/portfolio/:id/refresh-prices", requireAuth, async (req, res) => {
    try {
      // Check portfolio ownership
      const portfolio = await storageWrapper.getPortfolio(req.params.id, req);
      if (!isAuthorizedForPortfolio(portfolio, req.user?.id, req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Get current holdings
      const stockHoldings = await storageWrapper.getStockHoldings(req.params.id, req);
      const optionHoldings = await storageWrapper.getOptionHoldings(req.params.id, req);
      
      // Update prices from market data provider
      const updatedStocks = await updateStockPrices(stockHoldings);
      const updatedOptions = await updateOptionPrices(optionHoldings);
      
      // Update each holding in storage
      let stocksUpdated = 0;
      for (const stock of updatedStocks) {
        await storageWrapper.updateStockHolding(stock.id, {
          currentPrice: stock.currentPrice,
          beta: stock.beta,
          name: stock.name
        }, req);
        stocksUpdated++;
      }
      
      let optionsUpdated = 0;
      for (const option of updatedOptions) {
        await storageWrapper.updateOptionHolding(option.id, {
          currentPrice: option.currentPrice
        }, req);
        optionsUpdated++;
      }
      
      res.json({
        success: true,
        stocksUpdated,
        optionsUpdated,
        message: `Updated ${stocksUpdated} stock prices and ${optionsUpdated} option prices`
      });
    } catch (error) {
      console.error("Price refresh error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to refresh prices" 
      });
    }
  });

}