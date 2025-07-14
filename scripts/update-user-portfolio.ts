import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserPortfolio() {
  const userEmail = '279838958@qq.com';
  
  try {
    // 1. Find user by email
    console.log(`Finding user with email: ${userEmail}`);
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    const user = userData.users.find(u => u.email === userEmail);
    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      return;
    }
    
    console.log(`Found user: ${user.id}`);
    
    // 2. Get user's portfolio
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
    
    if (portfolioError) {
      console.error('Error fetching portfolios:', portfolioError);
      return;
    }
    
    let portfolio = portfolios?.[0];
    
    // If no portfolio exists, create one
    if (!portfolio) {
      console.log('Creating new portfolio for user');
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: '主账户',
          total_equity: '44338.00',
          cash_balance: '14400.00',
          margin_used: '40580.97'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating portfolio:', createError);
        return;
      }
      
      portfolio = newPortfolio;
    } else {
      // Update existing portfolio values
      console.log('Updating existing portfolio');
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          total_equity: '44338.00',
          cash_balance: '14400.00',
          margin_used: '40580.97'
        })
        .eq('id', portfolio.id);
      
      if (updateError) {
        console.error('Error updating portfolio:', updateError);
        return;
      }
    }
    
    console.log(`Portfolio ID: ${portfolio.id}`);
    
    // 3. Clear existing holdings
    console.log('Clearing existing holdings...');
    
    // Delete existing stock holdings
    const { error: deleteStockError } = await supabase
      .from('stock_holdings')
      .delete()
      .eq('portfolio_id', portfolio.id);
    
    if (deleteStockError) {
      console.error('Error deleting stock holdings:', deleteStockError);
      return;
    }
    
    // Delete existing option holdings
    const { error: deleteOptionError } = await supabase
      .from('option_holdings')
      .delete()
      .eq('portfolio_id', portfolio.id);
    
    if (deleteOptionError) {
      console.error('Error deleting option holdings:', deleteOptionError);
      return;
    }
    
    // 4. Add new stock holdings
    console.log('Adding new stock holdings...');
    
    const stockHoldings = [
      { symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 30, cost_price: '220.00', current_price: '224.95' },
      { symbol: 'CRWD', name: 'CrowdStrike Holdings', quantity: 10, cost_price: '480.00', current_price: '477.40' },
      { symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, cost_price: '140.00', current_price: '141.95' },
      { symbol: 'SHOP', name: 'Shopify Inc', quantity: 32, cost_price: '115.00', current_price: '112.23' },
      { symbol: 'TSLA', name: 'Tesla Inc', quantity: 40, cost_price: '310.00', current_price: '312.75' }
    ];
    
    for (const holding of stockHoldings) {
      const { error } = await supabase
        .from('stock_holdings')
        .insert({
          portfolio_id: portfolio.id,
          ...holding
        });
      
      if (error) {
        console.error(`Error adding stock holding ${holding.symbol}:`, error);
      } else {
        console.log(`Added stock holding: ${holding.symbol}`);
      }
    }
    
    // 5. Add new option holdings
    console.log('Adding new option holdings...');
    
    const optionHoldings = [
      {
        option_symbol: 'MSFT250718P00500000',
        underlying_symbol: 'MSFT',
        option_type: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strike_price: '500.00',
        expiration_date: '2025-07-18',
        cost_price: '3.30',
        current_price: '2.52',
        delta_value: '-0.349'
      },
      {
        option_symbol: 'NVDA250822P00165000',
        underlying_symbol: 'NVDA',
        option_type: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strike_price: '165.00',
        expiration_date: '2025-08-22',
        cost_price: '8.00',
        current_price: '7.55',
        delta_value: '-0.465'
      },
      {
        option_symbol: 'NVDA250919P00170000',
        underlying_symbol: 'NVDA',
        option_type: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strike_price: '170.00',
        expiration_date: '2025-09-19',
        cost_price: '14.00',
        current_price: '13.62',
        delta_value: '-0.522'
      },
      {
        option_symbol: 'QQQ250725P00555000',
        underlying_symbol: 'QQQ',
        option_type: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strike_price: '555.00',
        expiration_date: '2025-07-25',
        cost_price: '7.00',
        current_price: '6.60',
        delta_value: '-0.495'
      }
    ];
    
    for (const holding of optionHoldings) {
      const { error } = await supabase
        .from('option_holdings')
        .insert({
          portfolio_id: portfolio.id,
          ...holding
        });
      
      if (error) {
        console.error(`Error adding option holding ${holding.option_symbol}:`, error);
      } else {
        console.log(`Added option holding: ${holding.option_symbol}`);
      }
    }
    
    console.log('Portfolio update completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update
updateUserPortfolio();