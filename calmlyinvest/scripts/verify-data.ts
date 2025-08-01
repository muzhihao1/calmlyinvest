
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function verifyData() {
  console.log('--- 数据库状态验证脚本 ---');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('错误：未找到 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量。');
    console.error('请确保您的 .env 文件在项目根目录中，并且包含了这些值。');
    process.exit(1);
  }

  console.log('Supabase URL 已加载。正在连接数据库...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. 检查 'portfolios' 表
    console.log("\n1. 正在查询 'portfolios' 表...");
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('*')
      .limit(1);

    if (portfoliosError) {
      console.error("查询 'portfolios' 表时出错:", portfoliosError.message);
      return;
    }

    if (!portfolios || portfolios.length === 0) {
      console.log("结果: 在 'portfolios' 表中未找到任何数据。这是问题的根源。");
      return;
    }

    const portfolio = portfolios[0];
    console.log(`成功: 至少找到了一个 portfolio:`);
    console.table([portfolio]);

    // 2. 使用找到的 portfolio_id 检查 'stock_holdings' 表
    const portfolioId = portfolio.id;
    console.log(`\n2. 使用 portfolio_id=${portfolioId} 查询 'stock_holdings' 表...`);
    const { data: stockHoldings, error: stockHoldingsError } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (stockHoldingsError) {
      console.error("查询 'stock_holdings' 表时出错:", stockHoldingsError.message);
      return;
    }

    if (!stockHoldings || stockHoldings.length === 0) {
      console.log(`结果: 在 'stock_holdings' 表中未找到 portfolio_id=${portfolioId} 的持仓数据。`);
    } else {
      console.log(`成功: 找到了 ${stockHoldings.length} 条股票持仓记录:`);
      console.table(stockHoldings);
    }

    // 3. 使用找到的 portfolio_id 检查 'option_holdings' 表
    console.log(`\n3. 使用 portfolio_id=${portfolioId} 查询 'option_holdings' 表...`);
    const { data: optionHoldings, error: optionHoldingsError } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (optionHoldingsError) {
      console.error("查询 'option_holdings' 表时出错:", optionHoldingsError.message);
      return;
    }

    if (!optionHoldings || optionHoldings.length === 0) {
      console.log(`结果: 在 'option_holdings' 表中未找到 portfolio_id=${portfolioId} 的持仓数据。`);
    } else {
      console.log(`成功: 找到了 ${optionHoldings.length} 条期权持仓记录:`);
      console.table(optionHoldings);
    }

    console.log('\n--- 验证完成 ---');
    if (stockHoldings?.length === 0 && optionHoldings?.length === 0) {
        console.log("结论：数据库连接成功，且找到了 portfolio，但该 portfolio 下没有任何持仓(股票或期权)。前端没有显示数据是正常的。")
    } else {
        console.log("结论：数据库连接成功，且数据存在。问题可能出在应用服务运行时的环境或用户身份验证上。")
    }

  } catch (err) {
    if (err instanceof Error) {
        console.error('\n发生意外错误:', err.message);
    } else {
        console.error('\n发生意外错误:', err);
    }
  }
}

verifyData(); 