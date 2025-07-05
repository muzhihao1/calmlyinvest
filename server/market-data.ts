import type { StockHolding, OptionHolding } from "@shared/schema";

interface MarketDataProvider {
  getStockPrice(symbol: string): Promise<number>;
  getStockQuote(symbol: string): Promise<StockQuote>;
  getOptionPrice(optionSymbol: string): Promise<number>;
  getBatchStockPrices(symbols: string[]): Promise<Map<string, number>>;
}

interface StockQuote {
  symbol: string;
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
    ["META", 492.80]
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
      price,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: price * (Math.floor(Math.random() * 1000000000) + 100000000),
      beta: symbol === "TSLA" ? 2.04 : 
            symbol === "AAPL" ? 1.19 : 
            symbol === "QQQ" ? 1.01 : 
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

// Real market data provider (to be implemented with actual API)
class RealMarketDataProvider implements MarketDataProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getStockPrice(symbol: string): Promise<number> {
    // TODO: Implement with real API (e.g., Alpha Vantage, Yahoo Finance, IEX Cloud)
    throw new Error("Real market data provider not implemented. Please provide API credentials.");
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    throw new Error("Real market data provider not implemented. Please provide API credentials.");
  }

  async getOptionPrice(optionSymbol: string): Promise<number> {
    throw new Error("Real market data provider not implemented. Please provide API credentials.");
  }

  async getBatchStockPrices(symbols: string[]): Promise<Map<string, number>> {
    throw new Error("Real market data provider not implemented. Please provide API credentials.");
  }
}

// Factory function to create appropriate provider
export function createMarketDataProvider(): MarketDataProvider {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  
  if (apiKey) {
    console.log("Using real market data provider");
    return new RealMarketDataProvider(apiKey);
  } else {
    console.log("Using mock market data provider (no API key provided)");
    return new MockMarketDataProvider();
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

// Update stock holdings with current prices
export async function updateStockPrices(holdings: StockHolding[]): Promise<StockHolding[]> {
  const provider = getMarketDataProvider();
  const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
  const prices = await provider.getBatchStockPrices(symbols);
  
  return holdings.map(holding => ({
    ...holding,
    currentPrice: prices.get(holding.symbol)?.toFixed(2) || holding.currentPrice
  }));
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