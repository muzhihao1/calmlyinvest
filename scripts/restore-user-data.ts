import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsfthqchyupkbmazcuis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTg0NjUsImV4cCI6MjA2ODA5NDQ2NX0.GAajoAAyNgbq5SVPhtL99NFIoycaLjXbcCJJqc8wLrQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreUserData() {
  const userId = '8e82d664-5ef9-47c1-a540-9af664860a7c';
  
  console.log('Starting data restoration for user:', userId);
  
  try {
    // 1. Create portfolio
    console.log('Creating portfolio...');
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .upsert({
        user_id: userId,
        name: 'Main Portfolio',
        total_equity: 44337.96,
        cash_balance: 14387.18,
        margin_used: 40580.97
      }, {
        onConflict: 'user_id,name'
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('Portfolio creation error:', portfolioError);
      // Try to get existing portfolio
      const { data: existingPortfolio } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('name', 'Main Portfolio')
        .single();
      
      if (existingPortfolio) {
        console.log('Using existing portfolio:', existingPortfolio.id);
        const portfolioId = existingPortfolio.id;
        await createHoldings(portfolioId);
      }
      return;
    }

    console.log('Portfolio created with ID:', portfolio.id);
    await createHoldings(portfolio.id);
    
  } catch (error) {
    console.error('Error restoring data:', error);
  }
}

async function createHoldings(portfolioId: number) {
  // 2. Create stock holdings
  console.log('Creating stock holdings...');
  const stockHoldings = [
    { symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 30, cost_price: 222.31, current_price: 225.02, beta: 1.33 },
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', quantity: 10, cost_price: 487.11, current_price: 478.45, beta: 1.16 },
    { symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, cost_price: 143.05, current_price: 142.10, beta: 2.64 },
    { symbol: 'SHOP', name: 'Shopify Inc', quantity: 32, cost_price: 115.16, current_price: 112.11, beta: 2.63 },
    { symbol: 'TSLA', name: 'Tesla Inc', quantity: 40, cost_price: 309.87, current_price: 313.51, beta: 2.46 }
  ];

  for (const stock of stockHoldings) {
    const { error } = await supabase
      .from('stock_holdings')
      .insert({
        portfolio_id: portfolioId,
        ...stock
      });
    
    if (error) {
      console.error(`Error creating stock ${stock.symbol}:`, error);
    } else {
      console.log(`Created stock holding: ${stock.symbol}`);
    }
  }

  // 3. Create option holdings
  console.log('Creating option holdings...');
  const optionHoldings = [
    {
      option_symbol: 'MSFT 250718P500',
      underlying_symbol: 'MSFT',
      option_type: 'PUT',
      direction: 'SELL',
      contracts: -1,
      strike_price: 500.00,
      expiration_date: '2025-07-18',
      cost_price: 5.00,
      current_price: 1.00,
      delta_value: -0.10
    },
    {
      option_symbol: 'AAPL 260116C300',
      underlying_symbol: 'AAPL',
      option_type: 'CALL',
      direction: 'BUY',
      contracts: 2,
      strike_price: 300.00,
      expiration_date: '2026-01-16',
      cost_price: 10.00,
      current_price: 18.00,
      delta_value: 0.40
    },
    {
      option_symbol: 'GOOGL 250815P2000',
      underlying_symbol: 'GOOGL',
      option_type: 'PUT',
      direction: 'SELL',
      contracts: -1,
      strike_price: 2000.00,
      expiration_date: '2025-08-15',
      cost_price: 8.00,
      current_price: 2.00,
      delta_value: -0.05
    },
    {
      option_symbol: 'NVDA 251219C700',
      underlying_symbol: 'NVDA',
      option_type: 'CALL',
      direction: 'BUY',
      contracts: 1,
      strike_price: 700.00,
      expiration_date: '2025-12-19',
      cost_price: 25.00,
      current_price: 45.00,
      delta_value: 0.35
    }
  ];

  for (const option of optionHoldings) {
    const { error } = await supabase
      .from('option_holdings')
      .insert({
        portfolio_id: portfolioId,
        ...option
      });
    
    if (error) {
      console.error(`Error creating option ${option.option_symbol}:`, error);
    } else {
      console.log(`Created option holding: ${option.option_symbol}`);
    }
  }

  // 4. Create risk settings
  console.log('Creating risk settings...');
  const { error: riskError } = await supabase
    .from('risk_settings')
    .upsert({
      user_id: '8e82d664-5ef9-47c1-a540-9af664860a7c',
      leverage_safe_threshold: 1.0,
      leverage_warning_threshold: 1.5,
      concentration_limit: 20.0,
      industry_concentration_limit: 60.0,
      min_cash_ratio: 30.0,
      leverage_alerts: true,
      expiration_alerts: true,
      volatility_alerts: false,
      data_update_frequency: 5
    }, {
      onConflict: 'user_id'
    });

  if (riskError) {
    console.error('Error creating risk settings:', riskError);
  } else {
    console.log('Risk settings created/updated');
  }

  console.log('Data restoration complete!');
}

// Run the restoration
restoreUserData().catch(console.error);