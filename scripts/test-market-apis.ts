/**
 * Test script to verify current market data APIs
 * Usage: npx tsx scripts/test-market-apis.ts
 */

import yahooFinance from 'yahoo-finance2';

interface TestResult {
  api: string;
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  latency?: number;
}

const results: TestResult[] = [];

// Color output helpers
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
};

function logTest(test: string) {
  console.log(colors.blue(`\n📊 Testing: ${test}`));
}

function logSuccess(message: string, data?: any) {
  console.log(colors.green(`✅ ${message}`));
  if (data) {
    console.log(colors.cyan(JSON.stringify(data, null, 2)));
  }
}

function logError(message: string, error?: any) {
  console.log(colors.red(`❌ ${message}`));
  if (error) {
    console.log(colors.yellow(error.message || error));
  }
}

function logWarning(message: string) {
  console.log(colors.yellow(`⚠️  ${message}`));
}

/**
 * Test 1: Yahoo Finance - Stock Quote
 */
async function testYahooStockQuote() {
  logTest('Yahoo Finance - Stock Quote (AAPL)');
  const startTime = Date.now();

  try {
    const quote = await yahooFinance.quote('AAPL');
    const latency = Date.now() - startTime;

    const data = {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
    };

    logSuccess(`Got quote in ${latency}ms`, data);

    results.push({
      api: 'Yahoo Finance',
      test: 'Stock Quote',
      success: true,
      data,
      latency,
    });

    return true;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logError('Failed to fetch stock quote', error);

    results.push({
      api: 'Yahoo Finance',
      test: 'Stock Quote',
      success: false,
      error: error.message,
      latency,
    });

    return false;
  }
}

/**
 * Test 2: Yahoo Finance - Batch Quotes
 */
async function testYahooBatchQuotes() {
  logTest('Yahoo Finance - Batch Quotes (AAPL, TSLA, MSFT)');
  const startTime = Date.now();

  try {
    const quotes = await yahooFinance.quote(['AAPL', 'TSLA', 'MSFT']);
    const latency = Date.now() - startTime;

    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    const data = quotesArray.map(q => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
    }));

    logSuccess(`Got ${quotesArray.length} quotes in ${latency}ms`, data);

    results.push({
      api: 'Yahoo Finance',
      test: 'Batch Quotes',
      success: true,
      data,
      latency,
    });

    return true;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logError('Failed to fetch batch quotes', error);

    results.push({
      api: 'Yahoo Finance',
      test: 'Batch Quotes',
      success: false,
      error: error.message,
      latency,
    });

    return false;
  }
}

/**
 * Test 3: Yahoo Finance - Quote Summary (Beta)
 */
async function testYahooQuoteSummary() {
  logTest('Yahoo Finance - Quote Summary with Beta (AAPL)');
  const startTime = Date.now();

  try {
    const summary = await yahooFinance.quoteSummary('AAPL', {
      modules: ['defaultKeyStatistics', 'summaryDetail']
    });
    const latency = Date.now() - startTime;

    const data = {
      beta: summary.defaultKeyStatistics?.beta,
      fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow,
      dividendYield: summary.summaryDetail?.dividendYield,
    };

    logSuccess(`Got quote summary in ${latency}ms`, data);

    results.push({
      api: 'Yahoo Finance',
      test: 'Quote Summary (Beta)',
      success: true,
      data,
      latency,
    });

    return true;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logError('Failed to fetch quote summary', error);

    results.push({
      api: 'Yahoo Finance',
      test: 'Quote Summary',
      success: false,
      error: error.message,
      latency,
    });

    return false;
  }
}

/**
 * Test 4: Yahoo Finance - Option Chain (Critical for Options)
 */
async function testYahooOptionChain() {
  logTest('Yahoo Finance - Option Chain (AAPL)');
  const startTime = Date.now();

  try {
    // Get option chain for current month
    const optionChain = await yahooFinance.options('AAPL');
    const latency = Date.now() - startTime;

    const expirationDates = optionChain.expirationDates || [];
    const firstExpiry = expirationDates[0];

    // Get options for first expiration date
    const options = firstExpiry ? await yahooFinance.options('AAPL', { date: firstExpiry }) : null;

    const calls = options?.options?.[0]?.calls || [];
    const puts = options?.options?.[0]?.puts || [];

    const sampleCall = calls[0];
    const samplePut = puts[0];

    const data = {
      expirationDatesCount: expirationDates.length,
      firstExpiry: firstExpiry ? new Date(firstExpiry * 1000).toISOString().split('T')[0] : null,
      callsCount: calls.length,
      putsCount: puts.length,
      sampleCall: sampleCall ? {
        strike: sampleCall.strike,
        lastPrice: sampleCall.lastPrice,
        bid: sampleCall.bid,
        ask: sampleCall.ask,
        volume: sampleCall.volume,
        impliedVolatility: sampleCall.impliedVolatility,
        // Greeks available?
        delta: (sampleCall as any).delta,
        gamma: (sampleCall as any).gamma,
        theta: (sampleCall as any).theta,
        vega: (sampleCall as any).vega,
      } : null,
      samplePut: samplePut ? {
        strike: samplePut.strike,
        lastPrice: samplePut.lastPrice,
        impliedVolatility: samplePut.impliedVolatility,
      } : null,
    };

    logSuccess(`Got option chain in ${latency}ms`, data);

    if (sampleCall && !(sampleCall as any).delta) {
      logWarning('⚠️  Yahoo Finance does NOT provide Greeks (Delta, Gamma, Theta, Vega)');
      logWarning('    Option prices are available, but Greeks are missing');
    }

    results.push({
      api: 'Yahoo Finance',
      test: 'Option Chain',
      success: true,
      data,
      latency,
    });

    return true;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logError('Failed to fetch option chain', error);

    results.push({
      api: 'Yahoo Finance',
      test: 'Option Chain',
      success: false,
      error: error.message,
      latency,
    });

    return false;
  }
}

/**
 * Test 5: Market Data API (if configured)
 */
async function testMarketDataAPI() {
  const apiToken = process.env.MARKETDATA_API_TOKEN;

  if (!apiToken) {
    logWarning('Market Data API not configured (MARKETDATA_API_TOKEN missing)');
    logWarning('This API provides option Greeks. Get free trial at: https://www.marketdata.app/');

    results.push({
      api: 'Market Data API',
      test: 'Configuration Check',
      success: false,
      error: 'API token not configured',
    });

    return false;
  }

  logTest('Market Data API - Option Quote');
  const startTime = Date.now();

  try {
    // Test with a known option symbol (AAPL)
    const response = await fetch(
      `https://api.marketdata.app/v1/options/quotes/AAPL/`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    const latency = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    logSuccess(`Got option quotes in ${latency}ms`, {
      status: data.s,
      optionsCount: data.optionSymbol?.length || 0,
      sample: data.optionSymbol?.[0] ? {
        symbol: data.optionSymbol[0],
        bid: data.bid?.[0],
        ask: data.ask?.[0],
        delta: data.delta?.[0],
        gamma: data.gamma?.[0],
        theta: data.theta?.[0],
        vega: data.vega?.[0],
        iv: data.iv?.[0],
      } : null,
    });

    results.push({
      api: 'Market Data API',
      test: 'Option Quote',
      success: true,
      data: { optionsCount: data.optionSymbol?.length || 0 },
      latency,
    });

    return true;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logError('Failed to fetch from Market Data API', error);

    results.push({
      api: 'Market Data API',
      test: 'Option Quote',
      success: false,
      error: error.message,
      latency,
    });

    return false;
  }
}

/**
 * Generate summary report
 */
function printSummary() {
  console.log('\n' + colors.cyan('='.repeat(80)));
  console.log(colors.cyan('📋 SUMMARY REPORT'));
  console.log(colors.cyan('='.repeat(80)));

  const yahooTests = results.filter(r => r.api === 'Yahoo Finance');
  const marketDataTests = results.filter(r => r.api === 'Market Data API');

  const yahooSuccess = yahooTests.filter(r => r.success).length;
  const yahooTotal = yahooTests.length;

  console.log(colors.blue('\n🔹 Yahoo Finance API:'));
  console.log(`   Success Rate: ${yahooSuccess}/${yahooTotal} tests passed`);

  if (yahooSuccess === yahooTotal) {
    console.log(colors.green('   ✅ Status: WORKING'));
  } else if (yahooSuccess > 0) {
    console.log(colors.yellow('   ⚠️  Status: PARTIALLY WORKING'));
  } else {
    console.log(colors.red('   ❌ Status: FAILED'));
  }

  const avgLatency = yahooTests
    .filter(r => r.latency)
    .reduce((sum, r) => sum + (r.latency || 0), 0) / yahooTests.filter(r => r.latency).length;
  console.log(`   Average Latency: ${avgLatency.toFixed(0)}ms`);

  console.log(colors.blue('\n🔹 Market Data API:'));
  if (marketDataTests.length > 0) {
    const marketSuccess = marketDataTests.filter(r => r.success).length;
    console.log(`   Success Rate: ${marketSuccess}/${marketDataTests.length} tests passed`);

    if (marketSuccess > 0) {
      console.log(colors.green('   ✅ Status: WORKING (Greeks available)'));
    } else {
      console.log(colors.red('   ❌ Status: FAILED'));
    }
  } else {
    console.log(colors.yellow('   ⚠️  Not configured (MARKETDATA_API_TOKEN missing)'));
    console.log('   ℹ️  Register at: https://www.marketdata.app/ (30-day free trial)');
  }

  console.log(colors.cyan('\n' + '='.repeat(80)));
  console.log(colors.cyan('💡 RECOMMENDATIONS'));
  console.log(colors.cyan('='.repeat(80)));

  if (yahooSuccess === yahooTotal) {
    console.log(colors.green('\n✅ Yahoo Finance is working well for:'));
    console.log('   • Stock prices (real-time)');
    console.log('   • Beta values');
    console.log('   • Option prices (last traded price, bid/ask)');
    console.log('   • Implied Volatility (IV)');
  }

  console.log(colors.yellow('\n⚠️  Yahoo Finance DOES NOT provide:'));
  console.log('   • Option Greeks (Delta, Gamma, Theta, Vega)');
  console.log('   • You need Market Data API or IB API for Greeks');

  console.log(colors.blue('\n📌 For FREE option Greeks, you have 3 options:'));
  console.log('   1. Market Data API (30-day free trial, no credit card)');
  console.log('      → Register at: https://www.marketdata.app/');
  console.log('   2. IB TWS API (if you have Interactive Brokers account)');
  console.log('      → Free with IB account, requires TWS running');
  console.log('   3. Calculate Greeks yourself (Black-Scholes model)');
  console.log('      → More complex but completely free');

  console.log('\n');
}

/**
 * Main test runner
 */
async function main() {
  console.log(colors.cyan('╔' + '═'.repeat(78) + '╗'));
  console.log(colors.cyan('║') + colors.blue(' '.repeat(20) + 'Market Data API Testing Suite' + ' '.repeat(29)) + colors.cyan('║'));
  console.log(colors.cyan('╚' + '═'.repeat(78) + '╝'));

  // Run all tests
  await testYahooStockQuote();
  await testYahooBatchQuotes();
  await testYahooQuoteSummary();
  await testYahooOptionChain();
  await testMarketDataAPI();

  // Print summary
  printSummary();
}

main().catch(console.error);
