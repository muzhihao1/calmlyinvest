import axios from 'axios';

/**
 * Polygon.io Option Snapshot Response
 */
interface PolygonGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface PolygonLastQuote {
  bid: number;
  bid_size: number;
  ask: number;
  ask_size: number;
  last_updated: number;
}

interface PolygonLastTrade {
  price: number;
  size: number;
  exchange: number;
  conditions: number[];
  timestamp: number;
}

interface PolygonOptionSnapshot {
  status: string;
  results: {
    ticker: string;
    day?: {
      close: number;
      high: number;
      low: number;
      open: number;
      volume: number;
      vwap: number;
    };
    details?: {
      contract_type: string;
      exercise_style: string;
      expiration_date: string;
      shares_per_contract: number;
      strike_price: number;
      underlying_ticker: string;
    };
    greeks?: PolygonGreeks;
    implied_volatility?: number;
    last_quote?: PolygonLastQuote;
    last_trade?: PolygonLastTrade;
    open_interest?: number;
  };
}

/**
 * Polygon.io Data Provider for options market data and Greeks
 *
 * Features:
 * - Real option prices from 17 U.S. options exchanges
 * - Greeks (Delta, Gamma, Theta, Vega) from market data
 * - Option chain data
 * - 15-minute delayed data (Free)
 * - Real-time data (Paid plans starting at $99/month)
 *
 * Registration: https://polygon.io/
 * - Instant sign-up, no approval needed
 * - API key provided immediately
 * - Unlimited API calls on free tier
 * - 4 years of historical data
 *
 * Documentation: https://polygon.io/docs/options
 */
export class PolygonDataProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.polygon.io';

  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ POLYGON_API_KEY not configured. Option data will not be available.');
    }
  }

  /**
   * Convert internal option symbol format to Polygon format
   *
   * Internal format: "QQQ 250718P440"
   * Polygon format: "O:QQQ250718P00440000"
   *
   * Format breakdown:
   * - O: prefix for options
   * - QQQ: underlying symbol
   * - 250718: expiration date (YYMMDD)
   * - P: option type (P=Put, C=Call)
   * - 00440000: strike price (8 digits, multiplied by 1000)
   *
   * @param optionSymbol Internal option symbol
   * @returns Polygon-formatted option ticker
   */
  private convertToPolygonSymbol(optionSymbol: string): string {
    try {
      const parts = optionSymbol.trim().split(' ');

      if (parts.length !== 2) {
        throw new Error(`Invalid option symbol format: ${optionSymbol}`);
      }

      const underlying = parts[0].toUpperCase();
      const optionPart = parts[1];

      // Parse option string: YYMMDD + C/P + strike
      // Example: "250718P440" -> date=250718, type=P, strike=440
      const match = optionPart.match(/^(\d{6})([CP])(\d+(?:\.\d+)?)$/);

      if (!match) {
        throw new Error(`Invalid option format: ${optionPart}`);
      }

      const [, date, type, strike] = match;

      // Convert strike to 8-digit format (multiply by 1000)
      // 440 -> 00440000, 440.5 -> 00440500
      const strikeNum = parseFloat(strike);
      const strikeFormatted = Math.round(strikeNum * 1000).toString().padStart(8, '0');

      // Polygon format: O:UNDERLYING + YYMMDD + C/P + STRIKE
      const polygonSymbol = `O:${underlying}${date}${type}${strikeFormatted}`;

      console.log(`📊 Converted ${optionSymbol} → ${polygonSymbol}`);

      return polygonSymbol;
    } catch (error) {
      console.error(`❌ Failed to convert option symbol: ${optionSymbol}`, error);
      throw error;
    }
  }

  /**
   * Get option quote with Greeks from Polygon.io
   *
   * Returns:
   * - Option price (from last trade or mid-point of bid/ask)
   * - Greeks: Delta, Gamma, Theta, Vega
   * - Implied Volatility
   *
   * Note: Free tier provides 15-minute delayed data
   *
   * @param optionSymbol Internal option symbol (e.g., "QQQ 250718P440")
   * @returns Option quote with Greeks
   */
  async getOptionQuote(optionSymbol: string): Promise<{
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    impliedVolatility?: number;
    openInterest?: number;
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('POLYGON_API_KEY not configured');
      }

      const polygonSymbol = this.convertToPolygonSymbol(optionSymbol);

      console.log(`📡 Fetching option data from Polygon.io: ${polygonSymbol}`);

      const response = await axios.get<PolygonOptionSnapshot>(
        `${this.baseUrl}/v3/snapshot/options/${polygonSymbol}`,
        {
          params: {
            apiKey: this.apiKey,
          },
          timeout: 10000,
        }
      );

      if (response.data.status !== 'OK' || !response.data.results) {
        throw new Error(`Invalid response from Polygon.io: ${response.data.status}`);
      }

      const results = response.data.results;

      // Determine option price
      let price = 0;

      if (results.last_trade?.price) {
        // Use last trade price if available
        price = results.last_trade.price;
        console.log(`💰 Price from last trade: $${price}`);
      } else if (results.last_quote?.bid && results.last_quote?.ask) {
        // Use mid-point of bid/ask
        price = (results.last_quote.bid + results.last_quote.ask) / 2;
        console.log(`💰 Price from bid/ask mid: $${price} (bid: ${results.last_quote.bid}, ask: ${results.last_quote.ask})`);
      } else if (results.day?.close) {
        // Fallback to day close
        price = results.day.close;
        console.log(`💰 Price from day close: $${price}`);
      } else {
        throw new Error('No price data available');
      }

      // Get Greeks
      if (!results.greeks) {
        console.warn(`⚠️ No Greeks data available for ${optionSymbol}`);
        // Return with default Greeks if not available
        return {
          price,
          delta: 0,
          gamma: 0,
          theta: 0,
          vega: 0,
          impliedVolatility: results.implied_volatility,
          openInterest: results.open_interest,
        };
      }

      const greeks = results.greeks;

      console.log(`✅ Successfully fetched data for ${optionSymbol}:`);
      console.log(`   Price: $${price.toFixed(2)}`);
      console.log(`   Delta: ${greeks.delta.toFixed(4)}`);
      console.log(`   Gamma: ${greeks.gamma.toFixed(4)}`);
      console.log(`   Theta: ${greeks.theta.toFixed(4)}`);
      console.log(`   Vega: ${greeks.vega.toFixed(4)}`);

      return {
        price,
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.theta,
        vega: greeks.vega,
        impliedVolatility: results.implied_volatility,
        openInterest: results.open_interest,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('❌ Polygon.io authentication failed. Check your POLYGON_API_KEY.');
          throw new Error('Invalid Polygon.io API key');
        } else if (error.response?.status === 404) {
          console.error(`❌ Option not found: ${optionSymbol}`);
          throw new Error(`Option not found: ${optionSymbol}`);
        } else if (error.response?.status === 429) {
          console.error('❌ Polygon.io rate limit exceeded');
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          console.error(`❌ Polygon.io API error: ${error.response?.status} ${error.response?.statusText}`);
          throw new Error(`Polygon.io API error: ${error.message}`);
        }
      }

      console.error(`❌ Failed to fetch option data for ${optionSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple option quotes in parallel
   *
   * @param optionSymbols Array of internal option symbols
   * @returns Array of option quotes with Greeks
   */
  async getBatchOptionQuotes(optionSymbols: string[]): Promise<Map<string, {
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  }>> {
    const results = new Map();

    await Promise.all(
      optionSymbols.map(async (symbol) => {
        try {
          const quote = await this.getOptionQuote(symbol);
          results.set(symbol, quote);
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
          // Don't add to results if failed
        }
      })
    );

    return results;
  }
}
