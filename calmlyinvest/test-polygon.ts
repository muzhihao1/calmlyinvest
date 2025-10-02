#!/usr/bin/env tsx
/**
 * Polygon.io API Test Script
 *
 * Tests the Polygon.io integration to ensure:
 * 1. API key is valid
 * 2. Can fetch option data
 * 3. Greeks are available
 */

import 'dotenv/config';
import { PolygonDataProvider } from './server/polygon-provider';

async function testPolygonAPI() {
  console.log('🧪 Testing Polygon.io API Integration...\n');

  // Check if API key is configured
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    console.error('❌ POLYGON_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('');

  // Create provider instance
  const polygon = new PolygonDataProvider();

  // Test cases - various option symbols
  const testCases = [
    {
      symbol: 'QQQ 250718P440',
      description: 'QQQ Put Option (July 18, 2025, Strike $440)'
    },
    {
      symbol: 'AAPL 250620C180',
      description: 'AAPL Call Option (June 20, 2025, Strike $180)'
    }
  ];

  console.log('📋 Test Cases:\n');

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.description}`);
    console.log(`   Symbol: ${testCase.symbol}`);
    console.log('   ' + '-'.repeat(60));

    try {
      const quote = await polygon.getOptionQuote(testCase.symbol);

      console.log('   ✅ SUCCESS!');
      console.log('');
      console.log('   📊 Option Data:');
      console.log(`      Price:       $${quote.price.toFixed(2)}`);
      console.log(`      Delta:       ${quote.delta.toFixed(4)}`);
      console.log(`      Gamma:       ${quote.gamma.toFixed(4)}`);
      console.log(`      Theta:       ${quote.theta.toFixed(4)}`);
      console.log(`      Vega:        ${quote.vega.toFixed(4)}`);

      if (quote.impliedVolatility) {
        console.log(`      IV:          ${(quote.impliedVolatility * 100).toFixed(2)}%`);
      }

      if (quote.openInterest) {
        console.log(`      Open Int:    ${quote.openInterest.toLocaleString()}`);
      }

      console.log('');

    } catch (error) {
      if (error instanceof Error) {
        console.log('   ❌ FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('');

        if (error.message.includes('Invalid Polygon.io API key')) {
          console.log('   💡 Solution: Check your POLYGON_API_KEY in .env file');
        } else if (error.message.includes('Option not found')) {
          console.log('   💡 This is expected if the option contract doesn\'t exist or has expired');
        } else if (error.message.includes('Rate limit exceeded')) {
          console.log('   💡 Free tier rate limit hit. Wait a minute and try again.');
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. If tests passed: Start your app with `npm run dev`');
  console.log('2. If tests failed: Check the error messages above');
  console.log('3. Check POLYGON_SETUP_GUIDE.md for troubleshooting');
  console.log('='.repeat(60) + '\n');
}

// Run the test
testPolygonAPI().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
