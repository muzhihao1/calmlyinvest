/**
 * Market Data API Test Script
 *
 * Tests the Market Data API integration for option prices and Greeks
 *
 * Usage:
 *   npx tsx scripts/test-market-data-api.ts
 */

import { config } from 'dotenv';
import { MarketDataProvider } from '../server/marketdata-provider';

// Load environment variables
config();

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  data: (label: string, value: any) => console.log(`   ${colors.magenta}${label}:${colors.reset} ${value}`),
};

/**
 * Test option symbols for various scenarios
 * Using future expiration dates (3rd Friday of each month)
 *
 * Format: SYMBOL YYMMDD + C/P + STRIKE
 * - YYMMDD: Expiration date (year-month-day, 6 digits)
 * - C/P: Call or Put
 * - STRIKE: Strike price (whole number)
 */
const TEST_SYMBOLS = [
  {
    symbol: 'AAPL 251121C240',
    description: 'Apple Call, Strike $240, Exp: 2025-11-21 (Nov 3rd Friday)'
  },
  {
    symbol: 'MSFT 251219P480',
    description: 'Microsoft Put, Strike $480, Exp: 2025-12-19 (Dec 3rd Friday)'
  },
  {
    symbol: 'QQQ 251121P500',
    description: 'QQQ Put, Strike $500, Exp: 2025-11-21 (Nov 3rd Friday)'
  },
];

/**
 * Main test execution
 */
async function runTests() {
  log.title('═══════════════════════════════════════════════════');
  log.title('  Market Data API Integration Test');
  log.title('═══════════════════════════════════════════════════');

  // Step 1: Check environment configuration
  log.title('Step 1: Environment Configuration Check');

  const token = process.env.MARKETDATA_API_TOKEN;

  if (!token) {
    log.error('MARKETDATA_API_TOKEN not found in environment');
    log.info('Please add your token to .env file:');
    log.info('MARKETDATA_API_TOKEN=your_token_here');
    log.info('\nGet your free trial token at: https://www.marketdata.app/');
    process.exit(1);
  }

  log.success(`API Token configured (${token.substring(0, 20)}...)`);
  log.data('Token length', `${token.length} characters`);

  // Step 2: Initialize provider
  log.title('Step 2: Initialize Market Data Provider');

  let provider: MarketDataProvider;

  try {
    provider = new MarketDataProvider();
    log.success('Provider initialized successfully');
  } catch (error) {
    log.error('Failed to initialize provider');
    console.error(error);
    process.exit(1);
  }

  // Step 3: Test option quote fetching
  log.title('Step 3: Test Option Quote Fetching');

  let successCount = 0;
  let failCount = 0;

  for (const test of TEST_SYMBOLS) {
    log.info(`\nTesting: ${test.description}`);
    log.data('Symbol', test.symbol);

    try {
      const startTime = Date.now();
      const quote = await provider.getOptionQuote(test.symbol);
      const duration = Date.now() - startTime;

      log.success(`Fetched in ${duration}ms`);
      log.data('Price', `$${quote.price.toFixed(2)}`);
      log.data('Delta', quote.delta.toFixed(4));
      log.data('Gamma', quote.gamma.toFixed(6));
      log.data('Theta', quote.theta.toFixed(4));
      log.data('Vega', quote.vega.toFixed(4));

      if (quote.rho !== undefined) {
        log.data('Rho', quote.rho.toFixed(4));
      }

      if (quote.impliedVolatility !== undefined) {
        log.data('IV', `${(quote.impliedVolatility * 100).toFixed(2)}%`);
      }

      if (quote.volume !== undefined) {
        log.data('Volume', quote.volume.toLocaleString());
      }

      if (quote.openInterest !== undefined) {
        log.data('Open Interest', quote.openInterest.toLocaleString());
      }

      // Validate data quality
      if (quote.price <= 0) {
        log.warn('Price is zero or negative - may indicate stale data');
      }

      if (Math.abs(quote.delta) > 1) {
        log.warn(`Delta out of expected range: ${quote.delta}`);
      }

      successCount++;

    } catch (error: any) {
      log.error(`Failed to fetch quote for ${test.symbol}`);

      if (error.message?.includes('401')) {
        log.error('Authentication failed - check your API token');
      } else if (error.message?.includes('404')) {
        log.warn('Option not found - may be expired or invalid symbol');
      } else if (error.message?.includes('429')) {
        log.error('Rate limit exceeded - wait before retrying');
      } else {
        log.error(error.message || error);
      }

      failCount++;
    }
  }

  // Step 4: Summary
  log.title('Test Summary');
  log.data('Total Tests', TEST_SYMBOLS.length);
  log.data('Successful', successCount);
  log.data('Failed', failCount);
  log.data('Success Rate', `${((successCount / TEST_SYMBOLS.length) * 100).toFixed(1)}%`);

  if (successCount === TEST_SYMBOLS.length) {
    log.success('\n🎉 All tests passed! Market Data API is working correctly.\n');
    process.exit(0);
  } else if (successCount > 0) {
    log.warn('\n⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  } else {
    log.error('\n❌ All tests failed. Please check your API configuration.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log.error('Unexpected error during test execution:');
  console.error(error);
  process.exit(1);
});
