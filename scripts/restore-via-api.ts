import { createClient } from '@supabase/supabase-js';

// Service role key for bypassing RLS
const supabaseUrl = 'https://hsfthqchyupkbmazcuis.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjMzNzc5NSwiZXhwIjoyMDY3OTEzNzk1fQ.ZbPvIdNH6Fpg9p3NJr_QFxtXz4N7fFMXPPGSLKDVVNk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function restoreUserData() {
  const userId = '8e82d664-5ef9-47c1-a540-9af664860a7c';
  
  console.log('Starting data restoration for user:', userId);
  
  try {
    // 1. Check if portfolio exists
    const { data: existingPortfolios, error: checkError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    if (checkError) {
      console.error('Error checking portfolios:', checkError);
      return;
    }

    console.log('Existing portfolios:', existingPortfolios);

    let portfolioId: number;

    if (existingPortfolios && existingPortfolios.length > 0) {
      // Use existing portfolio
      portfolioId = existingPortfolios[0].id;
      console.log('Using existing portfolio ID:', portfolioId);
      
      // Update portfolio values
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          total_equity: 44337.96,
          cash_balance: 14387.18,
          margin_used: 40580.97
        })
        .eq('id', portfolioId);

      if (updateError) {
        console.error('Error updating portfolio:', updateError);
      } else {
        console.log('Portfolio updated successfully');
      }
    } else {
      // Create new portfolio
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          name: 'Main Portfolio',
          total_equity: 44337.96,
          cash_balance: 14387.18,
          margin_used: 40580.97
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating portfolio:', createError);
        return;
      }

      portfolioId = newPortfolio.id;
      console.log('Created new portfolio with ID:', portfolioId);
    }

    // 2. Clear existing holdings for clean slate
    console.log('Clearing existing holdings...');
    
    await supabase
      .from('stock_holdings')
      .delete()
      .eq('portfolio_id', portfolioId);

    await supabase
      .from('option_holdings')
      .delete()
      .eq('portfolio_id', portfolioId);

    // 3. Create stock holdings
    console.log('Creating stock holdings...');
    const stockHoldings = [
      { portfolio_id: portfolioId, symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 30, cost_price: 222.31, current_price: 225.02, beta: 1.33 },
      { portfolio_id: portfolioId, symbol: 'CRWD', name: 'CrowdStrike Holdings', quantity: 10, cost_price: 487.11, current_price: 478.45, beta: 1.16 },
      { portfolio_id: portfolioId, symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, cost_price: 143.05, current_price: 142.10, beta: 2.64 },
      { portfolio_id: portfolioId, symbol: 'SHOP', name: 'Shopify Inc', quantity: 32, cost_price: 115.16, current_price: 112.11, beta: 2.63 },
      { portfolio_id: portfolioId, symbol: 'TSLA', name: 'Tesla Inc', quantity: 40, cost_price: 309.87, current_price: 313.51, beta: 2.46 }
    ];

    const { data: createdStocks, error: stockError } = await supabase
      .from('stock_holdings')
      .insert(stockHoldings)
      .select();

    if (stockError) {
      console.error('Error creating stocks:', stockError);
    } else {
      console.log(`Created ${createdStocks.length} stock holdings`);
    }

    // 4. Create option holdings
    console.log('Creating option holdings...');
    const optionHoldings = [
      {
        portfolio_id: portfolioId,
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
        portfolio_id: portfolioId,
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
        portfolio_id: portfolioId,
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
        portfolio_id: portfolioId,
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

    const { data: createdOptions, error: optionError } = await supabase
      .from('option_holdings')
      .insert(optionHoldings)
      .select();

    if (optionError) {
      console.error('Error creating options:', optionError);
    } else {
      console.log(`Created ${createdOptions.length} option holdings`);
    }

    // 5. Upsert risk settings
    console.log('Creating/updating risk settings...');
    const { error: riskError } = await supabase
      .from('risk_settings')
      .upsert({
        user_id: userId,
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
      console.error('Error with risk settings:', riskError);
    } else {
      console.log('Risk settings created/updated successfully');
    }

    // 6. Verify data
    console.log('\n=== Verification ===');
    
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('Portfolio:', portfolio);

    const { data: stocks } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);
    console.log(`Stock holdings: ${stocks?.length || 0} records`);

    const { data: options } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);
    console.log(`Option holdings: ${options?.length || 0} records`);

    const { data: riskSettings } = await supabase
      .from('risk_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('Risk settings:', riskSettings ? 'Created' : 'Not found');

    console.log('\n✅ Data restoration complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the restoration
restoreUserData().catch(console.error);