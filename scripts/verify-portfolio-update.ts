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

async function verifyPortfolio() {
  const userEmail = '279838958@qq.com';
  
  try {
    // Find user
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error(`User ${userEmail} not found`);
      return;
    }
    
    // Get portfolio
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
    
    if (!portfolios || portfolios.length === 0) {
      console.error('No portfolio found');
      return;
    }
    
    const portfolio = portfolios[0];
    console.log('\n📊 Portfolio Information:');
    console.log('------------------------');
    console.log(`Name: ${portfolio.name}`);
    console.log(`Total Equity: $${parseFloat(portfolio.total_equity || '0').toFixed(2)}`);
    console.log(`Cash Balance: $${parseFloat(portfolio.cash_balance || '0').toFixed(2)}`);
    console.log(`Margin Used: $${parseFloat(portfolio.margin_used || '0').toFixed(2)}`);
    
    // Get stock holdings
    const { data: stocks } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);
    
    console.log('\n📈 Stock Holdings:');
    console.log('------------------------');
    if (stocks && stocks.length > 0) {
      stocks.forEach(stock => {
        const value = stock.quantity * parseFloat(stock.current_price || stock.cost_price);
        console.log(`${stock.symbol}: ${stock.quantity} shares @ $${parseFloat(stock.current_price || '0').toFixed(2)} = $${value.toFixed(2)}`);
      });
      const totalStockValue = stocks.reduce((sum, stock) => 
        sum + (stock.quantity * parseFloat(stock.current_price || stock.cost_price)), 0
      );
      console.log(`Total Stock Value: $${totalStockValue.toFixed(2)}`);
    }
    
    // Get option holdings
    const { data: options } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);
    
    console.log('\n📊 Option Holdings:');
    console.log('------------------------');
    if (options && options.length > 0) {
      options.forEach(option => {
        const value = option.contracts * 100 * parseFloat(option.current_price || '0');
        console.log(`${option.underlying_symbol} ${option.strike_price} ${option.option_type} (${option.expiration_date}): ${option.direction} ${option.contracts} @ $${parseFloat(option.current_price || '0').toFixed(2)} = $${value.toFixed(2)}`);
      });
    }
    
    console.log('\n✅ Portfolio verification completed!');
    
  } catch (error) {
    console.error('Error verifying portfolio:', error);
  }
}

verifyPortfolio();