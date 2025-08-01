import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// User 279838958@qq.com data migration
const USER_UUID = '8e82d664-5ef9-47c1-a540-9af664860a7c';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUserData() {
  console.log(`Starting data migration for user ${USER_UUID}`);
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  console.log(`Service key present: ${!!supabaseServiceKey}`);

  try {
    // 1. Create portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: USER_UUID,
        name: '我的投资组合',
        total_equity: '1000000',
        cash_balance: '300000',
        margin_used: '700000'
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('Error creating portfolio:', portfolioError);
      throw portfolioError;
    }

    console.log('Portfolio created:', portfolio.id);

    // 2. Create stock holdings
    const stockHoldings = [
      { symbol: 'AAPL', name: 'Apple Inc.', quantity: 100, cost_price: '150.00', current_price: '175.00', beta: '1.2' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 50, cost_price: '2500.00', current_price: '2800.00', beta: '1.1' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 80, cost_price: '300.00', current_price: '350.00', beta: '0.9' },
      { symbol: 'TSLA', name: 'Tesla Inc.', quantity: 30, cost_price: '700.00', current_price: '850.00', beta: '1.8' }
    ];

    const { error: stockError } = await supabase
      .from('stock_holdings')
      .insert(
        stockHoldings.map(stock => ({
          portfolio_id: portfolio.id,
          ...stock
        }))
      );

    if (stockError) {
      console.error('Error creating stock holdings:', stockError);
      throw stockError;
    }

    console.log('Stock holdings created');

    // 3. Create option holdings
    const optionHoldings = [
      {
        option_symbol: 'SPY240315C00450000',
        underlying_symbol: 'SPY',
        option_type: 'CALL',
        direction: 'BUY',
        contracts: 10,
        strike_price: '450.00',
        expiration_date: '2024-03-15',
        cost_price: '5.50',
        current_price: '8.25',
        delta_value: '0.65'
      },
      {
        option_symbol: 'SPY240315P00420000',
        underlying_symbol: 'SPY',
        option_type: 'PUT',
        direction: 'SELL',
        contracts: 5,
        strike_price: '420.00',
        expiration_date: '2024-03-15',
        cost_price: '3.75',
        current_price: '2.10',
        delta_value: '-0.25'
      }
    ];

    const { error: optionError } = await supabase
      .from('option_holdings')
      .insert(
        optionHoldings.map(option => ({
          portfolio_id: portfolio.id,
          ...option
        }))
      );

    if (optionError) {
      console.error('Error creating option holdings:', optionError);
      throw optionError;
    }

    console.log('Option holdings created');

    // 4. Create risk settings
    const { error: settingsError } = await supabase
      .from('risk_settings')
      .insert({
        user_id: USER_UUID,
        leverage_safe_threshold: '1.0',
        leverage_warning_threshold: '1.5',
        concentration_limit: '25.0',
        industry_concentration_limit: '60.0',
        min_cash_ratio: '30.0',
        leverage_alerts: true,
        expiration_alerts: true,
        volatility_alerts: false,
        data_update_frequency: 5
      });

    if (settingsError && settingsError.code !== '23505') { // Ignore unique constraint error
      console.error('Error creating risk settings:', settingsError);
      throw settingsError;
    }

    console.log('Risk settings created');

    // 5. Calculate initial risk metrics
    const totalMarketValue = 
      100 * 175 + // AAPL
      50 * 2800 + // GOOGL
      80 * 350 + // MSFT
      30 * 850 + // TSLA
      10 * 100 * 8.25 - // SPY Calls (10 contracts * 100 shares * price)
      5 * 100 * 2.10; // SPY Puts (negative because SELL)

    const netAssets = 1000000 - 700000; // equity - margin
    const leverageRatio = totalMarketValue / netAssets;

    const { error: metricsError } = await supabase
      .from('risk_metrics')
      .insert({
        portfolio_id: portfolio.id,
        leverage_ratio: leverageRatio.toFixed(4),
        portfolio_beta: '1.25',
        max_concentration: '0.28',
        margin_usage_ratio: '0.70',
        risk_level: leverageRatio > 1.5 ? 'RED' : leverageRatio > 1.0 ? 'YELLOW' : 'GREEN'
      });

    if (metricsError) {
      console.error('Error creating risk metrics:', metricsError);
      throw metricsError;
    }

    console.log('Risk metrics calculated and saved');
    console.log('\nMigration completed successfully!');
    console.log(`User ${USER_UUID} data has been migrated to Supabase`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserData();