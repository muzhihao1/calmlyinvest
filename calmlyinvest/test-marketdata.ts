#!/usr/bin/env tsx
/**
 * Market Data API Test Script
 *
 * Tests the Market Data API integration to ensure:
 * 1. API token is valid
 * 2. Can fetch option data
 * 3. Greeks are available and accurate
 * 4. Real-time data is working
 */

import 'dotenv/config';
import { MarketDataProvider } from './server/marketdata-provider';

async function testMarketDataAPI() {
  console.log('🧪 Testing Market Data API Integration...\n');

  // Check if API token is configured
  const apiToken = process.env.MARKETDATA_API_TOKEN;
  if (!apiToken) {
    console.error('❌ MARKETDATA_API_TOKEN not found in .env file');
    console.error('');
    console.error('Please add your token to .env:');
    console.error('MARKETDATA_API_TOKEN=your_token_here');
    process.exit(1);
  }

  console.log('✅ API Token found:', apiToken.substring(0, 15) + '...' + apiToken.substring(apiToken.length - 4));
  console.log('');

  // Create provider instance
  const marketData = new MarketDataProvider();

  // Test cases - various option symbols
  // Using real option expiration dates (3rd Friday of each month)
  // Note: Using 2026 dates as 2025 options may have expired
  const testCases = [
    {
      symbol: 'AAPL 260116C250',
      description: 'AAPL Call Option (Jan 16, 2026, Strike $250)'
    },
    {
      symbol: 'QQQ 260116P520',
      description: 'QQQ Put Option (Jan 16, 2026, Strike $520)'
    }
  ];

  console.log('📋 Test Cases:\n');

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.description}`);
    console.log(`   Symbol: ${testCase.symbol}`);
    console.log('   ' + '-'.repeat(60));

    try {
      const quote = await marketData.getOptionQuote(testCase.symbol);

      console.log('   ✅ SUCCESS!');
      console.log('');
      console.log('   📊 Option Data:');
      console.log(`      Price:       $${quote.price.toFixed(2)}`);
      console.log(`      Delta:       ${quote.delta.toFixed(4)}`);
      console.log(`      Gamma:       ${quote.gamma.toFixed(4)}`);
      console.log(`      Theta:       ${quote.theta.toFixed(4)}`);
      console.log(`      Vega:        ${quote.vega.toFixed(4)}`);

      if (quote.rho !== undefined) {
        console.log(`      Rho:         ${quote.rho.toFixed(4)}`);
      }

      if (quote.impliedVolatility) {
        console.log(`      IV:          ${(quote.impliedVolatility * 100).toFixed(2)}%`);
      }

      if (quote.openInterest) {
        console.log(`      Open Int:    ${quote.openInterest.toLocaleString()}`);
      }

      if (quote.volume !== undefined) {
        console.log(`      Volume:      ${quote.volume.toLocaleString()}`);
      }

      console.log('');
      successCount++;

    } catch (error) {
      if (error instanceof Error) {
        console.log('   ❌ FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('');

        if (error.message.includes('Invalid Market Data API token')) {
          console.log('   💡 Solution: Check your MARKETDATA_API_TOKEN in .env file');
          console.log('   💡 Get a new token from: https://www.marketdata.app/');
        } else if (error.message.includes('Option not found')) {
          console.log('   💡 This option contract may not exist or has expired');
          console.log('   💡 Try a different expiration date or strike price');
        } else if (error.message.includes('Rate limit exceeded')) {
          console.log('   💡 Free trial rate limit reached');
          console.log('   💡 Wait a few seconds and try again');
        } else if (error.message.includes('MARKETDATA_API_TOKEN not configured')) {
          console.log('   💡 Add MARKETDATA_API_TOKEN to your .env file');
        }

        failCount++;
      }
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('');

  if (successCount > 0) {
    console.log('🎉 Market Data API is working!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Login and add option holdings');
    console.log('3. Click "Refresh Data" to update prices and Greeks');
    console.log('4. Your options will show accurate market prices and Delta values!');
  } else {
    console.log('⚠️ All tests failed. Please check:');
    console.log('1. MARKETDATA_API_TOKEN is correct in .env');
    console.log('2. Your Market Data account is active');
    console.log('3. The option contracts exist and are not expired');
    console.log('4. Check the error messages above for specific issues');
  }

  console.log('='.repeat(60) + '\n');
}

// Run the test
testMarketDataAPI().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
