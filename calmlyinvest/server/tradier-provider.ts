import axios from 'axios';

/**
 * Tradier Option Quote Response
 */
interface TradierOptionQuote {
  symbol: string;
  description: string;
  last: number;
  bid: number;
  ask: number;
  change: number;
  change_percentage: number;
  volume: number;
  open_interest: number;
  greeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    phi: number;
    bid_iv: number;
    mid_iv: number;
    ask_iv: number;
    smv_vol: number;
  };
}

interface TradierQuotesResponse {
  quotes: {
    quote: TradierOptionQuote | TradierOptionQuote[];
  };
}

/**
 * Tradier Data Provider for real-time and delayed option market data
 *
 * Features:
 * - Real option prices from market data
 * - Greeks (Delta, Gamma, Theta, Vega) calculation
 * - Option chain data
 *
 * Free Sandbox: 15-minute delayed data
 * Production: Real-time data ($10/month)
 */
export class TradierDataProvider {
  private apiKey: string;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.apiKey = process.env.TRADIER_API_KEY || '';
    this.isSandbox = process.env.TRADIER_SANDBOX === 'true';

    // Sandbox URL for development (free, 15-min delay)
    // Production URL for real-time data
    this.baseUrl = this.isSandbox
      ? 'https://sandbox.tradier.com/v1'
      : 'https://api.tradier.com/v1';

    if (!this.apiKey) {
      console.warn('⚠️ TRADIER_API_KEY not configured. Option price updates will fail.');
    }

    console.log(`📊 Tradier Provider initialized: ${this.isSandbox ? 'SANDBOX (15-min delay)' : 'PRODUCTION (real-time)'}`);
  }

  /**
   * Check if Tradier API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Convert internal option symbol format to Tradier format
   *
   * Internal format: "MSFT 250718P500" (SYMBOL YYMMDDCT<strike>)
   * Tradier format: "MSFT250718P00500000" (SYMBOL + YYMMDD + C/P + 8-digit strike)
   *
   * @param optionSymbol - Internal option symbol
   * @returns Tradier-compatible option symbol
   */
  private convertToTradierSymbol(optionSymbol: string): string {
    try {
      const parts = optionSymbol.trim().split(' ');
      if (parts.length < 2) {
        throw new Error(`Invalid option symbol format: ${optionSymbol}`);
      }

      const underlying = parts[0].toUpperCase();
      const optionPart = parts[1];

      // Extract date (YYMMDD), type (C/P), and strike
      const match = optionPart.match(/^(\d{6})([CP])(\d+)$/);
      if (!match) {
        throw new Error(`Cannot parse option part: ${optionPart}`);
      }

      const [, date, type, strike] = match;

      // Tradier expects strike as 8-digit integer with 3 decimal places
      // Example: strike 500 -> 00500000, strike 50.5 -> 00050500
      const strikeNum = parseFloat(strike);
      const strikeFormatted = Math.round(strikeNum * 1000).toString().padStart(8, '0');

      const tradierSymbol = `${underlying}${date}${type}${strikeFormatted}`;

      console.log(`🔄 Converted symbol: ${optionSymbol} -> ${tradierSymbol}`);
      return tradierSymbol;
    } catch (error) {
      console.error(`❌ Failed to convert option symbol: ${optionSymbol}`, error);
      throw error;
    }
  }

  /**
   * Get option price from Tradier API
   *
   * @param optionSymbol - Option symbol in internal format
   * @returns Current market price (uses last price, or average of bid/ask)
   */
  async getOptionPrice(optionSymbol: string): Promise<number> {
    if (!this.isConfigured()) {
      throw new Error('Tradier API key not configured');
    }

    try {
      const tradierSymbol = this.convertToTradierSymbol(optionSymbol);

      console.log(`📡 Fetching option price for ${tradierSymbol}...`);

      const response = await axios.get<TradierQuotesResponse>(
        `${this.baseUrl}/markets/quotes`,
        {
          params: {
            symbols: tradierSymbol,
            greeks: false // Don't need Greeks for price-only request
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const quotes = response.data.quotes;
      if (!quotes || !quotes.quote) {
        throw new Error(`No quote data returned for ${tradierSymbol}`);
      }

      // Handle single quote or array of quotes
      const quote = Array.isArray(quotes.quote) ? quotes.quote[0] : quotes.quote;

      // Prefer last price, fallback to mid-point of bid/ask
      let price = quote.last;

      if (!price || price === 0) {
        // If no last price, use average of bid and ask
        if (quote.bid && quote.ask) {
          price = (quote.bid + quote.ask) / 2;
          console.log(`ℹ️ Using bid/ask average: ${price.toFixed(2)}`);
        } else if (quote.bid) {
          price = quote.bid;
          console.log(`ℹ️ Using bid price: ${price.toFixed(2)}`);
        } else if (quote.ask) {
          price = quote.ask;
          console.log(`ℹ️ Using ask price: ${price.toFixed(2)}`);
        } else {
          throw new Error('No valid price data available');
        }
      }

      console.log(`✅ Got price for ${optionSymbol}: $${price.toFixed(2)}`);
      return price;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Tradier API error for ${optionSymbol}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });

        if (error.response?.status === 401) {
          throw new Error('Tradier API authentication failed. Check your API key.');
        } else if (error.response?.status === 429) {
          throw new Error('Tradier API rate limit exceeded. Please try again later.');
        }
      }

      console.error(`❌ Failed to fetch option price for ${optionSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Get option Greeks from Tradier API
   *
   * Greeks measure the sensitivity of option prices to various factors:
   * - Delta: Sensitivity to underlying price changes
   * - Gamma: Rate of change of Delta
   * - Theta: Time decay
   * - Vega: Sensitivity to volatility changes
   *
   * @param optionSymbol - Option symbol in internal format
   * @returns Greeks data
   */
  async getOptionGreeks(optionSymbol: string): Promise<{
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Tradier API key not configured');
    }

    try {
      const tradierSymbol = this.convertToTradierSymbol(optionSymbol);

      console.log(`📊 Fetching Greeks for ${tradierSymbol}...`);

      const response = await axios.get<TradierQuotesResponse>(
        `${this.baseUrl}/markets/quotes`,
        {
          params: {
            symbols: tradierSymbol,
            greeks: true // Request Greeks calculation
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      const quotes = response.data.quotes;
      if (!quotes || !quotes.quote) {
        throw new Error(`No quote data returned for ${tradierSymbol}`);
      }

      const quote = Array.isArray(quotes.quote) ? quotes.quote[0] : quotes.quote;

      if (!quote.greeks) {
        throw new Error('Greeks data not available for this option');
      }

      console.log(`✅ Got Greeks for ${optionSymbol}:`, {
        delta: quote.greeks.delta.toFixed(4),
        gamma: quote.greeks.gamma.toFixed(4),
        theta: quote.greeks.theta.toFixed(4),
        vega: quote.greeks.vega.toFixed(4)
      });

      return {
        delta: quote.greeks.delta,
        gamma: quote.greeks.gamma,
        theta: quote.greeks.theta,
        vega: quote.greeks.vega
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Tradier API error for ${optionSymbol}:`, {
          status: error.response?.status,
          data: error.response?.data
        });
      }

      console.error(`❌ Failed to fetch Greeks for ${optionSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Get both price and Greeks in a single API call
   * More efficient than calling getOptionPrice() and getOptionGreeks() separately
   *
   * @param optionSymbol - Option symbol in internal format
   * @returns Price and Greeks data
   */
  async getOptionQuote(optionSymbol: string): Promise<{
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Tradier API key not configured');
    }

    try {
      const tradierSymbol = this.convertToTradierSymbol(optionSymbol);

      console.log(`📡 Fetching complete quote for ${tradierSymbol}...`);

      const response = await axios.get<TradierQuotesResponse>(
        `${this.baseUrl}/markets/quotes`,
        {
          params: {
            symbols: tradierSymbol,
            greeks: true
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      const quotes = response.data.quotes;
      if (!quotes || !quotes.quote) {
        throw new Error(`No quote data returned for ${tradierSymbol}`);
      }

      const quote = Array.isArray(quotes.quote) ? quotes.quote[0] : quotes.quote;

      // Get price
      let price = quote.last;
      if (!price || price === 0) {
        if (quote.bid && quote.ask) {
          price = (quote.bid + quote.ask) / 2;
        } else if (quote.bid) {
          price = quote.bid;
        } else if (quote.ask) {
          price = quote.ask;
        } else {
          throw new Error('No valid price data available');
        }
      }

      // Get Greeks
      if (!quote.greeks) {
        throw new Error('Greeks data not available for this option');
      }

      console.log(`✅ Got complete quote for ${optionSymbol}:`, {
        price: price.toFixed(2),
        delta: quote.greeks.delta.toFixed(4)
      });

      return {
        price,
        delta: quote.greeks.delta,
        gamma: quote.greeks.gamma,
        theta: quote.greeks.theta,
        vega: quote.greeks.vega
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Tradier API error for ${optionSymbol}:`, {
          status: error.response?.status,
          data: error.response?.data
        });
      }

      console.error(`❌ Failed to fetch complete quote for ${optionSymbol}:`, error);
      throw error;
    }
  }
}
