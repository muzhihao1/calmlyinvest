import axios from 'axios';

/**
 * Market Data API Response for Option Quote
 */
interface MarketDataGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface MarketDataOptionQuote {
  s: string; // status
  optionSymbol: string[];
  underlying: string[];
  expiration: number[];
  side: string[]; // "call" or "put"
  strike: number[];
  firstTraded: number[];
  dte: number[]; // days to expiration
  ask: number[];
  askSize: number[];
  bid: number[];
  bidSize: number[];
  mid: number[];
  last: number[];
  openInterest: number[];
  volume: number[];
  inTheMoney: boolean[];
  intrinsicValue: number[];
  extrinsicValue: number[];
  underlyingPrice: number[];
  iv: number[]; // implied volatility
  delta: number[];
  gamma: number[];
  theta: number[];
  vega: number[];
  rho: number[];
  updated: number[];
}

/**
 * Market Data API Provider for real-time options quotes and Greeks
 *
 * Features:
 * - Real-time option prices
 * - Live Greeks (Delta, Gamma, Theta, Vega, Rho)
 * - Implied Volatility
 * - Open Interest & Volume
 * - Intrinsic/Extrinsic Value calculations
 *
 * Free Trial: 30 days with full access (no credit card required)
 * After trial: Paid plans available
 *
 * Documentation: https://www.marketdata.app/docs/api/options
 */
export class MarketDataProvider {
  private apiToken: string;
  private baseUrl: string = 'https://api.marketdata.app/v1';

  constructor() {
    this.apiToken = process.env.MARKETDATA_API_TOKEN || '';

    if (!this.apiToken) {
      console.warn('⚠️ MARKETDATA_API_TOKEN not configured. Option data will not be available.');
    }
  }

  /**
   * Convert internal option symbol format to Market Data API format
   *
   * Internal format: "QQQ 250718P440"
   * Market Data format: "QQQ250718P00440000"
   *
   * Format breakdown (OCC standard):
   * - QQQ: underlying symbol
   * - 250718: expiration date (YYMMDD)
   * - P: option type (P=Put, C=Call)
   * - 00440000: strike price (8 digits, multiplied by 1000)
   *
   * @param optionSymbol Internal option symbol
   * @returns Market Data formatted option symbol
   */
  private convertToMarketDataSymbol(optionSymbol: string): string {
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

      // Market Data format: UNDERLYING + YYMMDD + C/P + STRIKE
      const marketDataSymbol = `${underlying}${date}${type}${strikeFormatted}`;

      console.log(`📊 Converted ${optionSymbol} → ${marketDataSymbol}`);

      return marketDataSymbol;
    } catch (error) {
      console.error(`❌ Failed to convert option symbol: ${optionSymbol}`, error);
      throw error;
    }
  }

  /**
   * Get option quote with Greeks from Market Data API
   *
   * Returns:
   * - Option price (mid, bid, ask, last)
   * - Greeks: Delta, Gamma, Theta, Vega, Rho
   * - Implied Volatility
   * - Open Interest & Volume
   * - Intrinsic/Extrinsic Value
   *
   * Note: Real-time data during free 30-day trial
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
    rho?: number;
    impliedVolatility?: number;
    openInterest?: number;
    volume?: number;
  }> {
    try {
      if (!this.apiToken) {
        throw new Error('MARKETDATA_API_TOKEN not configured');
      }

      const marketDataSymbol = this.convertToMarketDataSymbol(optionSymbol);

      console.log(`📡 Fetching option data from Market Data API: ${marketDataSymbol}`);

      const response = await axios.get<MarketDataOptionQuote>(
        `${this.baseUrl}/options/quotes/${marketDataSymbol}/`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.s !== 'ok') {
        throw new Error(`Invalid response status: ${response.data.s}`);
      }

      // Market Data API returns arrays even for single quotes
      // Extract first element from each array
      const data = response.data;

      if (!data.mid || data.mid.length === 0) {
        throw new Error('No data returned from Market Data API');
      }

      // Determine option price (prefer mid, fallback to last or avg of bid/ask)
      let price = data.mid[0];

      if (!price || price === 0) {
        if (data.last && data.last[0] > 0) {
          price = data.last[0];
          console.log(`💰 Price from last: $${price}`);
        } else if (data.bid && data.ask && data.bid[0] > 0 && data.ask[0] > 0) {
          price = (data.bid[0] + data.ask[0]) / 2;
          console.log(`💰 Price from bid/ask avg: $${price}`);
        } else {
          throw new Error('No valid price data available');
        }
      } else {
        console.log(`💰 Price from mid: $${price}`);
      }

      // Extract Greeks
      const delta = data.delta?.[0] ?? 0;
      const gamma = data.gamma?.[0] ?? 0;
      const theta = data.theta?.[0] ?? 0;
      const vega = data.vega?.[0] ?? 0;
      const rho = data.rho?.[0];

      console.log(`✅ Successfully fetched data for ${optionSymbol}:`);
      console.log(`   Price: $${price.toFixed(2)}`);
      console.log(`   Delta: ${delta.toFixed(4)}`);
      console.log(`   Gamma: ${gamma.toFixed(4)}`);
      console.log(`   Theta: ${theta.toFixed(4)}`);
      console.log(`   Vega: ${vega.toFixed(4)}`);
      if (rho !== undefined) console.log(`   Rho: ${rho.toFixed(4)}`);
      if (data.iv?.[0]) console.log(`   IV: ${(data.iv[0] * 100).toFixed(2)}%`);

      return {
        price,
        delta,
        gamma,
        theta,
        vega,
        rho,
        impliedVolatility: data.iv?.[0],
        openInterest: data.openInterest?.[0],
        volume: data.volume?.[0],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('❌ Market Data API authentication failed. Check your MARKETDATA_API_TOKEN.');
          throw new Error('Invalid Market Data API token');
        } else if (error.response?.status === 404) {
          console.error(`❌ Option not found: ${optionSymbol}`);
          throw new Error(`Option not found: ${optionSymbol}`);
        } else if (error.response?.status === 429) {
          console.error('❌ Market Data API rate limit exceeded');
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          console.error(`❌ Market Data API error: ${error.response?.status} ${error.response?.statusText}`);
          throw new Error(`Market Data API error: ${error.message}`);
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
   * @returns Map of option symbols to quotes with Greeks
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
