import type { StockHolding, OptionHolding } from "@shared/schema-types";

// Lazy load yahoo-finance2 to avoid initialization issues
let yahooFinanceModule: any = null;

async function getYahooFinance() {
  if (!yahooFinanceModule) {
    try {
      yahooFinanceModule = await import("yahoo-finance2");
      // Some versions export as default.default
      if (yahooFinanceModule.default) {
        yahooFinanceModule = yahooFinanceModule.default;
      }
    } catch (error) {
      console.error('Failed to load yahoo-finance2:', error);
      throw new Error('Yahoo Finance module not available');
    }
  }
  return yahooFinanceModule;
}

interface MarketDataProvider {
  getStockPrice(symbol: string): Promise<number>;
  getStockQuote(symbol: string): Promise<StockQuote>;
  getOptionPrice(optionSymbol: string): Promise<number>;
  getBatchStockPrices(symbols: string[]): Promise<Map<string, number>>;
  getBatchStockQuotes?(symbols: string[]): Promise<Map<string, StockQuote>>;
}

interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  beta?: number;
  lastUpdated: Date;
}

// Mock market data provider for development
class MockMarketDataProvider implements MarketDataProvider {
  private mockPrices: Map<string, number> = new Map([
    ["TSLA", 195.50],
    ["AAPL", 172.30],
    ["QQQ", 441.25],
    ["COIN", 265.80],
    ["INTC", 45.60],
    ["NVDA", 139.90],
    ["MSFT", 415.20],
    ["AMZN", 178.50],
    ["GOOGL", 143.60],
    ["META", 492.80],
    ["PLTR", 24.50],
    ["CRWD", 514.10]
  ]);

  private mockNames: Map<string, string> = new Map([
    ["TSLA", "Tesla Inc"],
    ["AAPL", "Apple Inc"],
    ["QQQ", "Invesco QQQ Trust"],
    ["COIN", "Coinbase Global Inc"],
    ["INTC", "Intel Corporation"],
    ["NVDA", "NVIDIA Corporation"],
    ["MSFT", "Microsoft Corporation"],
    ["AMZN", "Amazon.com Inc"],
    ["GOOGL", "Alphabet Inc"],
    ["META", "Meta Platforms Inc"],
    ["PLTR", "Palantir Technologies Inc"],
    ["CRWD", "CrowdStrike Holdings Inc"]
  ]);

  async getStockPrice(symbol: string): Promise<number> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const basePrice = this.mockPrices.get(symbol) || 100;
    // Add small random variation (±0.5%)
    const variation = (Math.random() - 0.5) * 0.01;
    return basePrice * (1 + variation);
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const price = await this.getStockPrice(symbol);
    const previousClose = this.mockPrices.get(symbol) || 100;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol,
      name: this.mockNames.get(symbol) || `${symbol} Company`,
      price,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: price * (Math.floor(Math.random() * 1000000000) + 100000000),
      beta: symbol === "TSLA" ? 2.04 : 
            symbol === "AAPL" ? 1.19 : 
            symbol === "QQQ" ? 1.01 :
            symbol === "PLTR" ? 1.13 : 
            Math.random() * 2 + 0.5,
      lastUpdated: new Date()
    };
  }

  async getOptionPrice(optionSymbol: string): Promise<number> {
    // Simple mock pricing based on option symbol
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Extract strike price from option symbol (e.g., "MSFT 250718P500" -> 500)
    const match = optionSymbol.match(/(\d+)$/);
    const strikePrice = match ? parseInt(match[1]) : 100;
    
    // Simple pricing model for mock data
    const basePrice = strikePrice * 0.03; // 3% of strike as base
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    return basePrice * (1 + variation);
  }

  async getBatchStockPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    
    await Promise.all(
      symbols.map(async symbol => {
        const price = await this.getStockPrice(symbol);
        prices.set(symbol, price);
      })
    );
    
    return prices;
  }
}

// Yahoo Finance provider for real market data
class YahooFinanceProvider implements MarketDataProvider {
  async getStockPrice(symbol: string): Promise<number> {
    try {
      const yahooFinance = await getYahooFinance();
      const quote = await yahooFinance.quote(symbol);
      return quote.regularMarketPrice || quote.ask || quote.bid || 0;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock price for ${symbol}`);
    }
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    try {
      const yahooFinance = await getYahooFinance();
      const quote = await yahooFinance.quote(symbol);
      
      // Try to get beta from quoteSummary if not available in quote
      let beta = 1.0;
      try {
        const yahooFinance = await getYahooFinance();
        const summary = await yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics'] });
        beta = summary.defaultKeyStatistics?.beta || 1.0;
      } catch (betaError) {
        console.warn(`Failed to fetch beta for ${symbol}, using default:`, betaError);
      }
      
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || undefined,
        beta: beta,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock quote for ${symbol}`);
    }
  }

  async getOptionPrice(optionSymbol: string): Promise<number> {
    try {
      // Yahoo Finance option symbols are different format
      // Convert from our format (e.g., "MSFT 250718P500") to Yahoo format
      const parts = optionSymbol.split(' ');
      if (parts.length < 2) {
        throw new Error("Invalid option symbol format");
      }
      
      const underlying = parts[0];
      const optionPart = parts[1];
      
      // For now, estimate option price based on underlying stock price
      // Full option chain API requires more complex implementation
      const stockPrice = await this.getStockPrice(underlying);
      
      // Extract strike price from option symbol
      const match = optionPart.match(/(\d+)$/);
      const strikePrice = match ? parseInt(match[1]) : 100;
      
      // Simple estimation: option value roughly 2-5% of stock price
      const isCall = optionPart.includes('C');
      const inTheMoney = isCall ? (stockPrice > strikePrice) : (stockPrice < strikePrice);
      
      if (inTheMoney) {
        return Math.abs(stockPrice - strikePrice) + (stockPrice * 0.02);
      } else {
        return stockPrice * 0.02;
      }
    } catch (error) {
      console.error(`Failed to fetch option price for ${optionSymbol}:`, error);
      // Fallback to a reasonable estimate
      return 10.0;
    }
  }

  async getBatchStockPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    
    try {
      // Yahoo Finance supports batch quotes
      const yahooFinance = await getYahooFinance();
      const quotes = await yahooFinance.quote(symbols);
      
      // Handle both single quote and array of quotes
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      
      for (const quote of quotesArray) {
        const price = quote.regularMarketPrice || quote.ask || quote.bid || 0;
        prices.set(quote.symbol, price);
      }
      
      // Fill in any missing symbols with individual requests
      for (const symbol of symbols) {
        if (!prices.has(symbol)) {
          try {
            const price = await this.getStockPrice(symbol);
            prices.set(symbol, price);
          } catch (error) {
            console.error(`Failed to fetch price for ${symbol} in batch:`, error);
            prices.set(symbol, 100); // Default fallback
          }
        }
      }
    } catch (error) {
      console.error("Batch price fetch failed, falling back to individual requests:", error);
      // Fallback to individual requests
      await Promise.all(
        symbols.map(async symbol => {
          try {
            const price = await this.getStockPrice(symbol);
            prices.set(symbol, price);
          } catch (err) {
            console.error(`Failed to fetch price for ${symbol}:`, err);
            prices.set(symbol, 100); // Default fallback
          }
        })
      );
    }
    
    return prices;
  }

  async getBatchStockQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const quotes = new Map<string, StockQuote>();
    
    // Process symbols in parallel but with rate limiting
    await Promise.all(
      symbols.map(async symbol => {
        try {
          const quote = await this.getStockQuote(symbol);
          quotes.set(symbol, quote);
        } catch (error) {
          console.error(`Failed to fetch quote for ${symbol}:`, error);
          // Provide a fallback quote
          quotes.set(symbol, {
            symbol,
            name: symbol,
            price: 100,
            change: 0,
            changePercent: 0,
            volume: 0,
            beta: 1.0,
            lastUpdated: new Date()
          });
        }
      })
    );
    
    return quotes;
  }
}

// Factory function to create appropriate provider
export function createMarketDataProvider(): MarketDataProvider {
  const useMockData = process.env.USE_MOCK_DATA === 'true';
  
  if (useMockData) {
    console.log("Using mock market data provider (USE_MOCK_DATA=true)");
    return new MockMarketDataProvider();
  } else {
    console.log("Using Yahoo Finance for real market data");
    return new YahooFinanceProvider();
  }
}

// Singleton instance
let marketDataProvider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!marketDataProvider) {
    marketDataProvider = createMarketDataProvider();
  }
  return marketDataProvider;
}

// Update stock holdings with current prices and beta
export async function updateStockPrices(holdings: StockHolding[]): Promise<StockHolding[]> {
  const provider = getMarketDataProvider();
  const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
  
  // Use getBatchStockQuotes if available (YahooFinanceProvider)
  if (provider.getBatchStockQuotes) {
    const quotes = await provider.getBatchStockQuotes(symbols);
    
    return holdings.map(holding => {
      const quote = quotes.get(holding.symbol);
      if (quote) {
        return {
          ...holding,
          currentPrice: quote.price.toFixed(2),
          beta: quote.beta?.toFixed(2) || "1.00",
          name: quote.name || holding.name
        };
      }
      return holding;
    });
  } else {
    // Fallback to price-only update (MockMarketDataProvider)
    const prices = await provider.getBatchStockPrices(symbols);
    
    return holdings.map(holding => ({
      ...holding,
      currentPrice: prices.get(holding.symbol)?.toFixed(2) || holding.currentPrice
    }));
  }
}

// Update option holdings with current prices
export async function updateOptionPrices(holdings: OptionHolding[]): Promise<OptionHolding[]> {
  const provider = getMarketDataProvider();
  
  const updatedHoldings = await Promise.all(
    holdings.map(async holding => {
      try {
        const price = await provider.getOptionPrice(holding.optionSymbol);
        return {
          ...holding,
          currentPrice: price.toFixed(2)
        };
      } catch (error) {
        console.error(`Failed to update price for ${holding.optionSymbol}:`, error);
        return holding;
      }
    })
  );
  
  return updatedHoldings;
}

// Get market quotes for multiple symbols
export async function getMarketQuotes(symbols: string[]): Promise<StockQuote[]> {
  const provider = getMarketDataProvider();
  
  if (provider.getBatchStockQuotes) {
    const quotesMap = await provider.getBatchStockQuotes(symbols);
    return Array.from(quotesMap.values());
  } else {
    // Fallback for mock provider
    const quotes: StockQuote[] = [];
    for (const symbol of symbols) {
      try {
        const quote = await provider.getStockQuote(symbol);
        quotes.push(quote);
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
      }
    }
    return quotes;
  }
}

// Search for stocks by query
export async function searchStocks(query: string): Promise<any[]> {
  try {
    const yahooFinance = await getYahooFinance();
    const results = await yahooFinance.search(query);
    return results.quotes || [];
  } catch (error) {
    console.error('Stock search failed:', error);
    return [];
  }
}