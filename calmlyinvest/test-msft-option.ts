#!/usr/bin/env tsx
import 'dotenv/config';
import { MarketDataProvider } from './server/marketdata-provider';

async function testMSFTOption() {
  console.log('🧪 Testing MSFT Option: MSFT251010P515\n');
  
  const marketData = new MarketDataProvider();
  
  try {
    const quote = await marketData.getOptionQuote('MSFT 251010P515');
    
    console.log('✅ SUCCESS!\n');
    console.log('📊 Option Data:');
    console.log(`   Current Price: $${quote.price.toFixed(2)}`);
    console.log(`   Delta:         ${quote.delta.toFixed(4)}`);
    console.log(`   Gamma:         ${quote.gamma.toFixed(4)}`);
    console.log(`   Theta:         ${quote.theta.toFixed(4)}`);
    console.log(`   Vega:          ${quote.vega.toFixed(4)}`);
    if (quote.impliedVolatility) {
      console.log(`   IV:            ${(quote.impliedVolatility * 100).toFixed(2)}%`);
    }
    if (quote.openInterest) {
      console.log(`   Open Interest: ${quote.openInterest.toLocaleString()}`);
    }
    if (quote.volume !== undefined) {
      console.log(`   Volume:        ${quote.volume.toLocaleString()}`);
    }
    
    console.log('\n📈 Comparison with IB:');
    console.log(`   App shows:  $10.39, Delta -0.546`);
    console.log(`   IB shows:   $4.47, Delta 0.374`);
    console.log(`   API shows:  $${quote.price.toFixed(2)}, Delta ${quote.delta.toFixed(4)}`);
    
  } catch (error) {
    console.error('❌ FAILED');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testMSFTOption();
