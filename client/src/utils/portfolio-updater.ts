// Portfolio updater utility for user 279838958@qq.com
import { supabase } from '@/lib/supabase';

export interface PortfolioUpdateData {
  totalEquity: number;
  cashBalance: number;
  marginUsed: number;
  stockHoldings: Array<{
    symbol: string;
    name: string;
    quantity: number;
    costPrice: number;
    currentPrice: number;
  }>;
  optionHoldings: Array<{
    optionSymbol: string;
    underlyingSymbol: string;
    optionType: 'CALL' | 'PUT';
    direction: 'BUY' | 'SELL';
    contracts: number;
    strikePrice: number;
    expirationDate: string;
    costPrice: number;
    currentPrice: number;
    deltaValue: number;
  }>;
}

export async function updatePortfolio279838958() {
  const updateData: PortfolioUpdateData = {
    totalEquity: 44338.00,
    cashBalance: 14400.00,
    marginUsed: 40580.97,
    stockHoldings: [
      { symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 30, costPrice: 220.00, currentPrice: 224.95 },
      { symbol: 'CRWD', name: 'CrowdStrike Holdings', quantity: 10, costPrice: 480.00, currentPrice: 477.40 },
      { symbol: 'PLTR', name: 'Palantir Technologies', quantity: 38, costPrice: 140.00, currentPrice: 141.95 },
      { symbol: 'SHOP', name: 'Shopify Inc', quantity: 32, costPrice: 115.00, currentPrice: 112.23 },
      { symbol: 'TSLA', name: 'Tesla Inc', quantity: 40, costPrice: 310.00, currentPrice: 312.75 }
    ],
    optionHoldings: [
      {
        optionSymbol: 'MSFT250718P00500000',
        underlyingSymbol: 'MSFT',
        optionType: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strikePrice: 500.00,
        expirationDate: '2025-07-18',
        costPrice: 3.30,
        currentPrice: 2.52,
        deltaValue: -0.349
      },
      {
        optionSymbol: 'NVDA250822P00165000',
        underlyingSymbol: 'NVDA',
        optionType: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strikePrice: 165.00,
        expirationDate: '2025-08-22',
        costPrice: 8.00,
        currentPrice: 7.55,
        deltaValue: -0.465
      },
      {
        optionSymbol: 'NVDA250919P00170000',
        underlyingSymbol: 'NVDA',
        optionType: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strikePrice: 170.00,
        expirationDate: '2025-09-19',
        costPrice: 14.00,
        currentPrice: 13.62,
        deltaValue: -0.522
      },
      {
        optionSymbol: 'QQQ250725P00555000',
        underlyingSymbol: 'QQQ',
        optionType: 'PUT',
        direction: 'SELL',
        contracts: 1,
        strikePrice: 555.00,
        expirationDate: '2025-07-25',
        costPrice: 7.00,
        currentPrice: 6.60,
        deltaValue: -0.495
      }
    ]
  };

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if this is the correct user
    if (user.email !== '279838958@qq.com') {
      throw new Error('This update is only for user 279838958@qq.com');
    }

    // Get or create portfolio
    let { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);

    if (portfolioError) throw portfolioError;

    let portfolioId: string;

    if (!portfolios || portfolios.length === 0) {
      // Create new portfolio
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: '主账户',
          total_equity: updateData.totalEquity,
          cash_balance: updateData.cashBalance,
          margin_used: updateData.marginUsed
        })
        .select()
        .single();

      if (createError) throw createError;
      portfolioId = newPortfolio.id;
    } else {
      // Update existing portfolio
      portfolioId = portfolios[0].id;
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          total_equity: updateData.totalEquity,
          cash_balance: updateData.cashBalance,
          margin_used: updateData.marginUsed
        })
        .eq('id', portfolioId);

      if (updateError) throw updateError;
    }

    // Clear existing holdings
    await supabase.from('stock_holdings').delete().eq('portfolio_id', portfolioId);
    await supabase.from('option_holdings').delete().eq('portfolio_id', portfolioId);

    // Add stock holdings
    for (const stock of updateData.stockHoldings) {
      const { error } = await supabase
        .from('stock_holdings')
        .insert({
          portfolio_id: portfolioId,
          symbol: stock.symbol,
          name: stock.name,
          quantity: stock.quantity,
          cost_price: stock.costPrice,
          current_price: stock.currentPrice
        });

      if (error) throw error;
    }

    // Add option holdings
    for (const option of updateData.optionHoldings) {
      const { error } = await supabase
        .from('option_holdings')
        .insert({
          portfolio_id: portfolioId,
          option_symbol: option.optionSymbol,
          underlying_symbol: option.underlyingSymbol,
          option_type: option.optionType,
          direction: option.direction,
          contracts: option.contracts,
          strike_price: option.strikePrice,
          expiration_date: option.expirationDate,
          cost_price: option.costPrice,
          current_price: option.currentPrice,
          delta_value: option.deltaValue
        });

      if (error) throw error;
    }

    return { success: true, message: 'Portfolio updated successfully!' };
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Make function available globally for console use
if (typeof window !== 'undefined') {
  (window as any).updatePortfolio279838958 = updatePortfolio279838958;
}