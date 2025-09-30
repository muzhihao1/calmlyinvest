// Script to bulk import holdings from Robinhood to CalmlyInvest
const portfolioId = '186ecd89-e268-43c4-b3d5-3441a2082cf5';
const apiUrl = 'https://calmlyinvest.vercel.app/api/portfolio-bulk-import';

const stocks = [
  { symbol: 'AMZN', name: 'Amazon', quantity: 30, cost_price: 222.17, current_price: 218.58, beta: 1.2 },
  { symbol: 'CRWD', name: 'CrowdStrike', quantity: 9, cost_price: 489.02, current_price: 485.14, beta: 1.5 },
  { symbol: 'ORCL', name: 'Oracle', quantity: 5, cost_price: 282.71, current_price: 278.28, beta: 0.9 },
  { symbol: 'META', name: 'Meta Platforms', quantity: 1, cost_price: 743.37, current_price: 729.90, beta: 1.3 },
  { symbol: 'HIMS', name: 'Hims & Hers Health', quantity: 10, cost_price: 59.12, current_price: 58.27, beta: 1.8 },
  { symbol: 'RKLB', name: 'Rocket Lab USA', quantity: 10, cost_price: 47.01, current_price: 47.03, beta: 2.0 },
  { symbol: 'SNOW', name: 'Snowflake', quantity: 3, cost_price: 225.24, current_price: 225.11, beta: 1.6 },
  { symbol: 'NKE', name: 'Nike', quantity: 7, cost_price: 69.54, current_price: 69.62, beta: 0.8 },
  { symbol: 'FCX', name: 'Freeport-McMoRan', quantity: 20, cost_price: 37.45, current_price: 37.56, beta: 1.7 },
  { symbol: 'ISRG', name: 'Intuitive Surgical', quantity: 2, cost_price: 439.22, current_price: 443.00, beta: 0.7 },
  { symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, cost_price: 178.89, current_price: 179.54, beta: 2.5 },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', quantity: 3, cost_price: 273.21, current_price: 276.30, beta: 1.1 },
  { symbol: 'SHOP', name: 'Shopify', quantity: 32, cost_price: 149.01, current_price: 150.24, beta: 1.4 }
];

const options = [
  {
    option_symbol: 'MSFT251010P515',
    underlying_symbol: 'MSFT',
    option_type: 'PUT',
    direction: 'SELL',
    contracts: 1,
    strike_price: 515.00,
    expiration_date: '2025-10-10',
    cost_price: 6.70,
    current_price: 7.70,
    delta_value: -0.546
  },
  {
    option_symbol: 'OQQ251003P600',
    underlying_symbol: 'OQQ',
    option_type: 'PUT',
    direction: 'SELL',
    contracts: 1,
    strike_price: 600.00,
    expiration_date: '2025-10-03',
    cost_price: 4.31,
    current_price: 4.64,
    delta_value: -0.604
  },
  {
    option_symbol: 'NVDA251017P175',
    underlying_symbol: 'NVDA',
    option_type: 'PUT',
    direction: 'SELL',
    contracts: 1,
    strike_price: 175.00,
    expiration_date: '2025-10-17',
    cost_price: 2.91,
    current_price: 2.54,
    delta_value: -0.264
  },
  {
    option_symbol: 'NVDA251017P185',
    underlying_symbol: 'NVDA',
    option_type: 'PUT',
    direction: 'SELL',
    contracts: 1,
    strike_price: 185.00,
    expiration_date: '2025-10-17',
    cost_price: 7.02,
    current_price: 6.30,
    delta_value: -0.527
  }
];

async function importHoldings() {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        portfolioId,
        stocks,
        options,
        clearExisting: true
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`   - Stocks added: ${result.stocksAdded}`);
      console.log(`   - Options added: ${result.optionsAdded}`);
      if (result.errors.length > 0) {
        console.log('⚠️  Errors:', result.errors);
      }
    } else {
      console.error('❌ Import failed:', result.error);
      if (result.details) {
        console.error('   Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

importHoldings();