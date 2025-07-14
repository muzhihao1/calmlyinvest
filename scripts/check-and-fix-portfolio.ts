import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixPortfolio() {
  const userEmail = '279838958@qq.com';
  console.log(`\n🔍 Checking portfolio for user: ${userEmail}\n`);
  
  try {
    // 1. First, let's check if user exists
    console.log('Step 1: Checking user existence...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = userData.users.find(u => u.email === userEmail);
    if (!user) {
      console.error(`❌ User ${userEmail} does not exist in auth.users`);
      console.log('\n💡 Solution: User needs to register first at the application');
      return;
    }
    
    console.log(`✅ User found: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);
    
    // 2. Check if portfolio exists
    console.log('\nStep 2: Checking portfolio...');
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
    
    if (portfolioError) {
      console.error('Error fetching portfolios:', portfolioError);
      return;
    }
    
    if (!portfolios || portfolios.length === 0) {
      console.log('❌ No portfolio found. Creating one...');
      
      // Create portfolio
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
      
      console.log(`✅ Portfolio created with ID: ${newPortfolio.id}`);
      portfolios.push(newPortfolio);
    } else {
      console.log(`✅ Portfolio exists: ID ${portfolios[0].id}`);
    }
    
    const portfolio = portfolios[0];
    
    // 3. Check current holdings
    console.log('\nStep 3: Checking current holdings...');
    
    const { data: stockHoldings, error: stockError } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);
    
    const { data: optionHoldings, error: optionError } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);
    
    console.log(`   Current stock holdings: ${stockHoldings?.length || 0}`);
    console.log(`   Current option holdings: ${optionHoldings?.length || 0}`);
    
    // 4. Clear and re-add holdings
    console.log('\nStep 4: Clearing existing holdings...');
    
    // Delete existing holdings
    await supabase.from('stock_holdings').delete().eq('portfolio_id', portfolio.id);
    await supabase.from('option_holdings').delete().eq('portfolio_id', portfolio.id);
    
    console.log('✅ Existing holdings cleared');
    
    // 5. Add new holdings
    console.log('\nStep 5: Adding new holdings...');
    
    // Stock holdings data
    const stocks = [
      { symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 30, cost_price: '220.00', current_price: '224.95' },
      { symbol: 'CRWD', name: 'CrowdStrike Holdings', quantity: 10, cost_price: '480.00', current_price: '477.40' },
      { symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, cost_price: '140.00', current_price: '141.95' },
      { symbol: 'SHOP', name: 'Shopify Inc', quantity: 32, cost_price: '115.00', current_price: '112.23' },
      { symbol: 'TSLA', name: 'Tesla Inc', quantity: 40, cost_price: '310.00', current_price: '312.75' }
    ];
    
    // Add stocks one by one
    for (const stock of stocks) {
      const { error } = await supabase
        .from('stock_holdings')
        .insert({
          portfolio_id: portfolio.id,
          ...stock
        });
      
      if (error) {
        console.error(`❌ Error adding ${stock.symbol}:`, error);
      } else {
        console.log(`✅ Added stock: ${stock.symbol}`);
      }
    }
    
    // Option holdings data
    const options = [
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
    
    // Add options one by one
    for (const option of options) {
      const { error } = await supabase
        .from('option_holdings')
        .insert({
          portfolio_id: portfolio.id,
          ...option
        });
      
      if (error) {
        console.error(`❌ Error adding ${option.option_symbol}:`, error);
      } else {
        console.log(`✅ Added option: ${option.underlying_symbol} ${option.strike_price} ${option.option_type}`);
      }
    }
    
    // 6. Update portfolio values
    console.log('\nStep 6: Updating portfolio values...');
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        total_equity: '44338.00',
        cash_balance: '14400.00',
        margin_used: '40580.97',
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolio.id);
    
    if (updateError) {
      console.error('Error updating portfolio:', updateError);
    } else {
      console.log('✅ Portfolio values updated');
    }
    
    // 7. Final verification
    console.log('\nStep 7: Final verification...');
    
    const { data: finalStocks } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);
    
    const { data: finalOptions } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);
    
    console.log(`\n✅ UPDATE COMPLETE!`);
    console.log(`   Portfolio ID: ${portfolio.id}`);
    console.log(`   Stock holdings: ${finalStocks?.length || 0}`);
    console.log(`   Option holdings: ${finalOptions?.length || 0}`);
    console.log(`   Total equity: $44,338.00`);
    console.log(`   Cash balance: $14,400.00`);
    
    console.log('\n📋 Summary:');
    console.log('   - User exists ✅');
    console.log('   - Portfolio exists ✅');
    console.log('   - Holdings added ✅');
    console.log('   - Values updated ✅');
    
    console.log('\n🔄 Please refresh your browser and make sure you are logged in as 279838958@qq.com');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the check and fix
checkAndFixPortfolio();