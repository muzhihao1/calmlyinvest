// 修复279838958@qq.com用户的portfolio问题
export async function fixPortfolioFor279838958() {
  try {
    // 1. 从window获取Supabase客户端
    const supabase = (window as any).supabase;
    if (!supabase) {
      throw new Error('Supabase client not found');
    }

    // 2. 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    if (!user || user.email !== '279838958@qq.com') {
      throw new Error('Not logged in as 279838958@qq.com');
    }

    // 3. 检查现有portfolios
    const { data: portfolios, error: fetchError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
      
    console.log('Existing portfolios:', portfolios);
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    // 4. 如果没有portfolio，创建一个
    if (!portfolios || portfolios.length === 0) {
      console.log('Creating new portfolio...');
      
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: '主账户',
          total_equity: 44338.00,
          cash_balance: 14400.00,
          margin_used: 40580.97
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Create error:', createError);
        throw createError;
      }
      
      console.log('Created portfolio:', newPortfolio);
      
      // 5. 添加股票持仓
      const stockData = [
        { portfolio_id: newPortfolio.id, symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 30, cost_price: 220.00, current_price: 224.95 },
        { portfolio_id: newPortfolio.id, symbol: 'CRWD', name: 'CrowdStrike Holdings', quantity: 10, cost_price: 480.00, current_price: 477.40 },
        { portfolio_id: newPortfolio.id, symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, cost_price: 140.00, current_price: 141.95 },
        { portfolio_id: newPortfolio.id, symbol: 'SHOP', name: 'Shopify Inc', quantity: 32, cost_price: 115.00, current_price: 112.23 },
        { portfolio_id: newPortfolio.id, symbol: 'TSLA', name: 'Tesla Inc', quantity: 40, cost_price: 310.00, current_price: 312.75 }
      ];
      
      const { error: stockError } = await supabase
        .from('stock_holdings')
        .insert(stockData);
        
      if (stockError) {
        console.error('Stock error:', stockError);
      } else {
        console.log('Added stock holdings');
      }
      
      // 6. 添加期权持仓
      const optionData = [
        { 
          portfolio_id: newPortfolio.id, 
          option_symbol: 'MSFT250718P00500000', 
          underlying_symbol: 'MSFT', 
          option_type: 'PUT', 
          direction: 'SELL', 
          contracts: 1, 
          strike_price: 500.00, 
          expiration_date: '2025-07-18', 
          cost_price: 3.30, 
          current_price: 2.52, 
          delta_value: -0.349 
        },
        { 
          portfolio_id: newPortfolio.id, 
          option_symbol: 'NVDA250822P00165000', 
          underlying_symbol: 'NVDA', 
          option_type: 'PUT', 
          direction: 'SELL', 
          contracts: 1, 
          strike_price: 165.00, 
          expiration_date: '2025-08-22', 
          cost_price: 8.00, 
          current_price: 7.55, 
          delta_value: -0.465 
        },
        { 
          portfolio_id: newPortfolio.id, 
          option_symbol: 'NVDA250919P00170000', 
          underlying_symbol: 'NVDA', 
          option_type: 'PUT', 
          direction: 'SELL', 
          contracts: 1, 
          strike_price: 170.00, 
          expiration_date: '2025-09-19', 
          cost_price: 14.00, 
          current_price: 13.62, 
          delta_value: -0.522 
        },
        { 
          portfolio_id: newPortfolio.id, 
          option_symbol: 'QQQ250725P00555000', 
          underlying_symbol: 'QQQ', 
          option_type: 'PUT', 
          direction: 'SELL', 
          contracts: 1, 
          strike_price: 555.00, 
          expiration_date: '2025-07-25', 
          cost_price: 7.00, 
          current_price: 6.60, 
          delta_value: -0.495 
        }
      ];
      
      const { error: optionError } = await supabase
        .from('option_holdings')
        .insert(optionData);
        
      if (optionError) {
        console.error('Option error:', optionError);
      } else {
        console.log('Added option holdings');
      }
      
      // 7. 刷新页面
      window.location.reload();
      
    } else {
      console.log('Portfolio already exists:', portfolios[0]);
      
      // 检查持仓
      const portfolioId = portfolios[0].id;
      
      const { data: stocks } = await supabase
        .from('stock_holdings')
        .select('*')
        .eq('portfolio_id', portfolioId);
        
      const { data: options } = await supabase
        .from('option_holdings')
        .select('*')
        .eq('portfolio_id', portfolioId);
        
      console.log('Stock holdings:', stocks);
      console.log('Option holdings:', options);
      
      // 如果没有持仓，可以选择添加
      if ((!stocks || stocks.length === 0) && (!options || options.length === 0)) {
        console.log('No holdings found. You may want to add them.');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Fix portfolio error:', error);
    return false;
  }
}

// 导出到window对象以便在控制台使用
if (typeof window !== 'undefined') {
  (window as any).fixPortfolioFor279838958 = fixPortfolioFor279838958;
}