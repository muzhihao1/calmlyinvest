import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { calculateGreeksForOption } from '../server/services/greeks-calculator';
import { getMarketDataProvider } from '../server/market-data';
import { MarketDataProvider } from '../server/marketdata-provider';

/**
 * Extract token from Authorization header
 * Inline implementation to avoid import issues in Vercel serverless
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    console.log('[Token Parser] No Authorization header provided');
    return null;
  }

  const normalized = authHeader.trim();

  if (!normalized.startsWith('Bearer ')) {
    console.error(`[Token Parser] Header doesn't start with "Bearer "`);
    return null;
  }

  const token = normalized.substring(7);

  if (!token || token.length === 0) {
    console.error('[Token Parser] Token is empty after extraction');
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error(`[Token Parser] Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return null;
  }

  if (parts.some(part => part.length === 0)) {
    console.error('[Token Parser] JWT contains empty parts');
    return null;
  }

  return token;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const portfolioId = req.query.portfolioId as string;

  if (!portfolioId) {
    return res.status(400).json({ error: 'Portfolio ID is required' });
  }

  try {
    const authHeader = req.headers.authorization;
    const isGuestMode = req.headers['x-guest-user'] === 'true';

    // Handle guest mode
    if (isGuestMode || !authHeader) {
      return res.status(200).json({
        portfolioId: portfolioId,
        leverageRatio: '0.00',
        portfolioBeta: '0.00',
        maxConcentration: '0.00',
        marginUsage: '0.00',
        cashRatio: '100.00',
        riskLevel: 'GREEN', // Frontend expects GREEN/YELLOW/RED
        riskLevelText: 'low',
        lastCalculated: new Date().toISOString()
      });
    }

    const token = extractToken(authHeader);

    if (!token) {
      console.error('[portfolio-risk-simple] Token extraction failed');
      return res.status(401).json({ error: 'Invalid or malformed authorization token' });
    }

    // Verify user authentication
    const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

    // Fetch portfolio details
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      console.error('Portfolio error:', portfolioError);
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Verify portfolio belongs to user
    if (portfolio.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch stock holdings
    const { data: stocks, error: stocksError } = await supabaseAdmin
      .from('stock_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (stocksError) {
      console.error('Stocks error:', stocksError);
      return res.status(500).json({ error: 'Failed to fetch stocks' });
    }

    // Fetch option holdings (only ACTIVE ones, exclude ROLLED and CLOSED)
    const { data: options, error: optionsError } = await supabaseAdmin
      .from('option_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('status', 'ACTIVE');

    if (optionsError) {
      console.error('Options error:', optionsError);
      return res.status(500).json({ error: 'Failed to fetch options' });
    }

    // Calculate and update Greeks for option holdings
    // Priority: Market Data API (real data) > Black-Scholes (calculated fallback)
    if (options && options.length > 0) {
      console.log(`📊 Fetching Greeks for ${options.length} option(s)...`);

      try {
        // Check if Market Data API is configured
        const marketDataToken = process.env.MARKETDATA_API_TOKEN;
        const useMarketDataAPI = !!marketDataToken;

        if (useMarketDataAPI) {
          console.log('✅ Using Market Data API for real-time Greeks');
        } else {
          console.log('⚠️ Market Data API not configured, using Black-Scholes calculation');
        }

        const marketDataAPI = useMarketDataAPI ? new MarketDataProvider() : null;
        const yahooProvider = getMarketDataProvider();

        // Fetch Greeks for each option
        const greeksUpdates = await Promise.all(
          options.map(async (option: any) => {
            try {
              let greeks = null;
              let impliedVolatility = null;
              let price = null;
              let dataSource = '';

              // Method 1: Try Market Data API first (if configured)
              if (marketDataAPI) {
                try {
                  console.log(`📡 [Market Data API] Fetching ${option.option_symbol}...`);

                  const marketQuote = await marketDataAPI.getOptionQuote(option.option_symbol);

                  greeks = {
                    delta: marketQuote.delta,
                    gamma: marketQuote.gamma,
                    theta: marketQuote.theta,
                    vega: marketQuote.vega,
                    price: marketQuote.price
                  };
                  impliedVolatility = marketQuote.impliedVolatility || null;
                  price = marketQuote.price;
                  dataSource = 'Market Data API (real-time)';

                  console.log(`✅ [Market Data API] ${option.option_symbol}: Delta=${greeks.delta.toFixed(4)}, Price=$${price.toFixed(2)}`);
                } catch (apiError: any) {
                  console.warn(`⚠️ [Market Data API] Failed for ${option.option_symbol}: ${apiError.message}`);
                  // Fall through to Black-Scholes calculation
                }
              }

              // Method 2: Fallback to Black-Scholes if Market Data API failed or not configured
              if (!greeks) {
                try {
                  console.log(`🧮 [Black-Scholes] Calculating ${option.option_symbol}...`);

                  // Get underlying stock price
                  const underlyingPrice = await yahooProvider.getStockPrice(option.underlying_symbol);

                  // Get implied volatility from Yahoo Finance option chain
                  const iv = await yahooProvider.getOptionImpliedVolatility(option.option_symbol);

                  if (!iv) {
                    console.warn(`⚠️ No IV available for ${option.option_symbol}, using default 0.30`);
                  }

                  // Calculate Greeks using Black-Scholes model
                  const bsGreeks = await calculateGreeksForOption({
                    underlyingPrice: underlyingPrice,
                    strikePrice: parseFloat(option.strike_price),
                    expiryDate: new Date(option.expiration_date),
                    impliedVolatility: iv || 0.30, // Default to 30% IV if not available
                    optionType: option.option_type.toLowerCase() as 'call' | 'put',
                    riskFreeRate: 0.05 // 5% annual rate
                  });

                  greeks = bsGreeks;
                  impliedVolatility = iv;
                  price = bsGreeks.price;
                  dataSource = 'Black-Scholes (calculated)';

                  console.log(`✅ [Black-Scholes] ${option.option_symbol}: Delta=${greeks.delta.toFixed(4)}, Calculated Price=$${price.toFixed(2)}`);
                } catch (bsError: any) {
                  console.error(`❌ [Black-Scholes] Failed for ${option.option_symbol}: ${bsError.message}`);
                  // Both methods failed
                }
              }

              if (greeks) {
                return {
                  id: option.id,
                  greeks: greeks,
                  impliedVolatility: impliedVolatility,
                  price: price,
                  dataSource: dataSource
                };
              } else {
                return {
                  id: option.id,
                  greeks: null,
                  impliedVolatility: null,
                  price: null,
                  dataSource: 'Failed'
                };
              }
            } catch (error) {
              console.error(`❌ Failed to fetch Greeks for ${option.option_symbol}:`, error);
              return {
                id: option.id,
                greeks: null,
                impliedVolatility: null,
                price: null,
                dataSource: 'Error'
              };
            }
          })
        );

        // Update database with fetched/calculated Greeks
        const updatePromises = greeksUpdates
          .filter(update => update.greeks !== null)
          .map(update =>
            supabaseAdmin
              .from('option_holdings')
              .update({
                delta_value: update.greeks!.delta.toString(),
                gamma_value: update.greeks!.gamma.toString(),
                theta_value: update.greeks!.theta.toString(),
                vega_value: update.greeks!.vega.toString(),
                implied_volatility: update.impliedVolatility?.toString(),
                current_price: update.price?.toString(), // Update price if available
                greeks_updated_at: new Date().toISOString()
              })
              .eq('id', update.id)
          );

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);

          // Count data sources
          const marketDataCount = greeksUpdates.filter(u => u.dataSource?.includes('Market Data')).length;
          const blackScholesCount = greeksUpdates.filter(u => u.dataSource?.includes('Black-Scholes')).length;
          const failedCount = greeksUpdates.filter(u => !u.greeks).length;

          console.log(`✅ Updated Greeks for ${updatePromises.length} option(s) in database`);
          console.log(`   📊 Data sources: Market Data API=${marketDataCount}, Black-Scholes=${blackScholesCount}, Failed=${failedCount}`);
        }

        // Attach fetched/calculated Greeks to options for use in calculations below
        options.forEach((option: any) => {
          const update = greeksUpdates.find(u => u.id === option.id);
          if (update && update.greeks) {
            option.delta_value = update.greeks.delta;
            option.gamma_value = update.greeks.gamma;
            option.theta_value = update.greeks.theta;
            option.vega_value = update.greeks.vega;
            option.implied_volatility = update.impliedVolatility;
            if (update.price) {
              option.current_price = update.price.toString();
            }
          }
        });

      } catch (error) {
        console.error('❌ Error fetching Greeks:', error);
        // Continue with risk calculation even if Greeks fetching fails
      }
    }

    // Calculate risk metrics based on professional risk management principles
    const cashBalance = parseFloat(portfolio.cash_balance || '0');
    const marginUsed = parseFloat(portfolio.margin_used || '0');

    console.log(`📊 Portfolio Base Values (from DB):`, {
      portfolioId,
      userId: user.id,
      cashBalance: cashBalance,
      marginUsed: marginUsed,
      totalEquity: portfolio.total_equity
    });

    // Calculate stock metrics
    let totalStockValue = 0;
    let weightedBeta = 0;
    let maxStockValue = 0;
    let maxStockSymbol = '';
    let totalStockUnrealizedPnL = 0;

    (stocks || []).forEach((stock: any) => {
      const quantity = parseFloat(stock.quantity || '0');
      const currentPrice = parseFloat(stock.current_price || '0');
      const costPrice = parseFloat(stock.cost_price || '0');
      const beta = parseFloat(stock.beta || '1.0');

      const stockValue = quantity * currentPrice;
      totalStockValue += stockValue;
      weightedBeta += stockValue * beta;

      // Calculate unrealized P&L for stocks
      totalStockUnrealizedPnL += (currentPrice - costPrice) * quantity;

      if (stockValue > maxStockValue) {
        maxStockValue = stockValue;
        maxStockSymbol = stock.symbol;
      }
    });

    // Calculate option potential max loss (期权潜在最大亏损)
    let optionMaxLoss = 0;
    let totalOptionValue = 0;
    let totalOptionUnrealizedPnL = 0;
    let hasHighRiskOptions = false;
    const highRiskStrategies: string[] = [];

    // Portfolio-level Greeks aggregation
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;

    (options || []).forEach((option: any) => {
      const contracts = parseFloat(option.contracts || '0');
      const strikePrice = parseFloat(option.strike_price || '0');
      const currentPrice = parseFloat(option.current_price || '0');
      const costPrice = parseFloat(option.cost_price || '0');
      const optionType = option.option_type; // 'PUT' or 'CALL'
      const direction = option.direction; // 'BUY' or 'SELL'

      // Current market value - handle direction correctly
      const optionMarketValue = currentPrice * contracts * 100;

      if (direction === 'BUY') {
        // Long option: positive market value (asset)
        totalOptionValue += optionMarketValue;
        // Unrealized P&L: profit when price goes up
        const pnl = (currentPrice - costPrice) * contracts * 100;
        totalOptionUnrealizedPnL += pnl;
        console.log(`[Option P&L] ${option.option_symbol} BUY: (${currentPrice} - ${costPrice}) × ${contracts} × 100 = $${pnl.toFixed(2)}`);
      } else if (direction === 'SELL') {
        // Short option: negative market value (liability)
        totalOptionValue -= optionMarketValue;
        // Unrealized P&L: profit when price goes down
        const pnl = (costPrice - currentPrice) * contracts * 100;
        totalOptionUnrealizedPnL += pnl;
        console.log(`[Option P&L] ${option.option_symbol} SELL: (${costPrice} - ${currentPrice}) × ${contracts} × 100 = $${pnl.toFixed(2)}`);
      }

      // Aggregate portfolio-level Greeks (if available)
      if (option.delta_value !== undefined && option.delta_value !== null) {
        const delta = parseFloat(option.delta_value || '0');
        const gamma = parseFloat(option.gamma_value || '0');
        const theta = parseFloat(option.theta_value || '0');
        const vega = parseFloat(option.vega_value || '0');

        // Multiply by position size (contracts × 100 shares per contract)
        // For SELL positions, Greeks are negative
        const multiplier = contracts * 100 * (direction === 'SELL' ? -1 : 1);

        totalDelta += delta * multiplier;
        totalGamma += gamma * multiplier;
        totalTheta += theta * multiplier;
        totalVega += vega * multiplier;
      }

      // Calculate potential max loss based on strategy
      if (direction === 'SELL') {
        // 单腿卖期权 - 高风险策略
        hasHighRiskOptions = true;

        if (optionType === 'PUT') {
          // Sell Put: 最大亏损 = 行权价 * 合约数 * 100
          // 最坏情况：标的归零，需以行权价买入无价值股票
          const maxLoss = strikePrice * contracts * 100;
          optionMaxLoss += maxLoss;
          console.log(`[Max Loss] Sell ${option.option_symbol} PUT: ${strikePrice} × ${contracts} × 100 = $${maxLoss.toFixed(2)}`);
          highRiskStrategies.push(`Sell ${option.underlying_symbol} Put (Max Loss: $${maxLoss.toFixed(0)})`);
        } else if (optionType === 'CALL') {
          // Sell Naked Call: 理论无限亏损，保守估算使用3倍行权价
          // 如果有标的价格，使用max(3×行权价, 2×当前标的价)
          const maxLoss = strikePrice * contracts * 100 * 3;
          optionMaxLoss += maxLoss;
          console.log(`[Max Loss] Sell ${option.option_symbol} CALL: ${strikePrice} × ${contracts} × 100 × 3 = $${maxLoss.toFixed(2)}`);
          highRiskStrategies.push(`Sell ${option.underlying_symbol} Naked Call (Max Loss: ~$${maxLoss.toFixed(0)})`);
        }
      } else if (direction === 'BUY') {
        // Buy Put/Call: 最大亏损 = 已付权利金
        const maxLoss = costPrice * contracts * 100;
        optionMaxLoss += maxLoss;
        console.log(`[Max Loss] Buy ${option.option_symbol}: ${costPrice} × ${contracts} × 100 = $${maxLoss.toFixed(2)}`);
      }
    });

    // Calculate Net Liquidation Value (净清算价值)
    // Net Liquidation = Cash + Stock Market Value + Option Market Value
    const totalEquity = cashBalance + totalStockValue + totalOptionValue;

    console.log('💰 Net Liquidation Calculation:', {
      cash: cashBalance,
      stockValue: totalStockValue,
      optionValue: totalOptionValue,
      totalEquity: totalEquity,
      stockCount: (stocks || []).length,
      optionCount: (options || []).length
    });

    // 杠杆率 = (正股价值 + 期权潜在最大亏损) / 总股本
    // 风险管理原则：
    // - 普通投资者：< 1.0倍（不使用杠杆）
    // - 深度期权投资者：< 1.5倍（有对冲保护）
    // - 使用期权最大损失而非市值，更保守的风险评估
    const totalRisk = totalStockValue + optionMaxLoss;
    const leverageRatio = totalEquity > 0 ? totalRisk / totalEquity : 0;

    // 同时计算市值杠杆率（参考指标）
    const totalMarketValue = Math.abs(totalStockValue) + Math.abs(totalOptionValue);
    const marketLeverageRatio = totalEquity > 0 ? totalMarketValue / totalEquity : 0;

    console.log('📊 Leverage Ratio Calculation:', {
      stockValue: totalStockValue,
      optionMaxLoss: optionMaxLoss,
      totalRisk: totalRisk,
      totalEquity: totalEquity,
      leverageRatio: leverageRatio.toFixed(2),
      marketLeverageRatio: marketLeverageRatio.toFixed(2),
      formula: '(stockValue + optionMaxLoss) / totalEquity',
      warning: leverageRatio > 1.5 ? '⚠️ 杠杆率超过1.5倍，高风险!' : leverageRatio > 1.0 ? '⚠️ 已使用杠杆' : '✅ 安全范围',
      note: '使用期权最大损失计算，更保守的风险管理'
    });

    const portfolioBeta = totalStockValue > 0 ? weightedBeta / totalStockValue : 0;

    // 最大单一持仓集中度
    const maxConcentration = totalStockValue > 0 ? (maxStockValue / totalStockValue) * 100 : 0;

    // Calculate maintenance margin requirements
    // 计算维持保证金要求（Maintenance Margin Requirement）
    let maintenanceMargin = 0;

    // Stock maintenance: 25% of market value (US Reg T requirement)
    maintenanceMargin += totalStockValue * 0.25;

    // Option maintenance: varies by strategy
    (options || []).forEach((option: any) => {
      const contracts = parseFloat(option.contracts || '0');
      const strikePrice = parseFloat(option.strike_price || '0');
      const currentPrice = parseFloat(option.current_price || '0');
      const underlyingPrice = parseFloat(option.current_price || strikePrice); // Approximate
      const optionType = option.option_type;
      const direction = option.direction;

      if (direction === 'SELL') {
        if (optionType === 'PUT') {
          // Short put maintenance: max(20% * strike, (strike - OTM) * 100) per contract
          const requirement1 = strikePrice * 0.20 * contracts * 100;
          const otmAmount = Math.max(0, strikePrice - underlyingPrice);
          const requirement2 = (strikePrice - otmAmount) * contracts * 100;
          maintenanceMargin += Math.max(requirement1, requirement2);
        } else if (optionType === 'CALL') {
          // Short call maintenance: max(20% * underlying, (underlying + ITM) * 100) per contract
          const requirement1 = underlyingPrice * 0.20 * contracts * 100;
          const itmAmount = Math.max(0, underlyingPrice - strikePrice);
          const requirement2 = (underlyingPrice + itmAmount) * contracts * 100;
          maintenanceMargin += Math.max(requirement1, requirement2);
        }
      }
      // Long options: no maintenance requirement (fully paid)
    });

    // 保证金使用率: 使用维持保证金要求（占用率）
    // 注：这表示持仓占用的保证金空间，而非实际借款
    const marginUsageRatio = totalEquity > 0 ? (maintenanceMargin / totalEquity) * 100 : 0;

    console.log(`💰 Margin Usage Calculation:`, {
      maintenanceMargin,
      totalEquity,
      calculation: `(${maintenanceMargin} / ${totalEquity}) * 100`,
      marginUsageRatio: marginUsageRatio.toFixed(2) + '%',
      note: '✅ Auto-calculated from maintenance margin (not from DB margin_used field)',
      legacyMarginUsedFromDB: marginUsed
    });

    // 剩余保证金（Excess Liquidity）= 净清算价值 - 维持保证金要求
    const excessLiquidity = totalEquity - maintenanceMargin;
    const excessLiquidityRatio = totalEquity > 0 ? (excessLiquidity / totalEquity) * 100 : 0;

    // 现金比率
    const cashRatio = totalEquity > 0 ? (cashBalance / totalEquity) * 100 : 0;

    // Determine risk level based on professional principles
    let riskLevel = 'low';
    let riskLevelFrontend = 'GREEN'; // Frontend expects GREEN/YELLOW/RED
    const riskFactors: string[] = [];

    // 高风险条件
    if (leverageRatio >= 1.5) {
      riskLevel = 'high';
      riskLevelFrontend = 'RED';
      riskFactors.push('杠杆率≥1.5倍');
    }
    if (maxConcentration > 20) {
      riskLevel = 'high';
      riskLevelFrontend = 'RED';
      riskFactors.push(`单一持仓(${maxStockSymbol})超过20%`);
    }
    if (excessLiquidityRatio < 30) {
      riskLevel = 'high';
      riskLevelFrontend = 'RED';
      riskFactors.push('剩余保证金低于30%');
    }
    if (hasHighRiskOptions) {
      riskLevel = 'high';
      riskLevelFrontend = 'RED';
      riskFactors.push('使用高风险期权策略');
    }

    // 中风险条件（如果不是高风险）
    if (riskLevel !== 'high') {
      if (leverageRatio >= 1.0) {
        riskLevel = 'medium';
        riskLevelFrontend = 'YELLOW';
        riskFactors.push('杠杆率≥1.0倍');
      }
      if (maxConcentration > 10) {
        if (riskLevel !== 'medium') {
          riskLevel = 'medium';
          riskLevelFrontend = 'YELLOW';
        }
        riskFactors.push(`单一持仓(${maxStockSymbol})超过10%`);
      }
    }

    // Calculate total unrealized P&L
    const totalUnrealizedPnL = totalStockUnrealizedPnL + totalOptionUnrealizedPnL;

    const riskMetrics = {
      portfolioId: portfolioId,

      // Core risk metrics based on professional principles
      leverageRatio: leverageRatio.toFixed(2), // 风险敞口杠杆率：(股票价值 + 期权最大损失) / 总股本
      marketLeverageRatio: marketLeverageRatio.toFixed(2), // 市值杠杆率（参考）：总市值 / 总股本
      portfolioBeta: portfolioBeta.toFixed(2),
      maxConcentration: maxConcentration.toFixed(2),
      maxConcentrationSymbol: maxStockSymbol,

      // Margin metrics
      marginUsage: marginUsageRatio.toFixed(2),
      marginUsageRatio: marginUsageRatio.toFixed(2), // Alias
      excessLiquidity: excessLiquidity.toFixed(2),
      excessLiquidityRatio: excessLiquidityRatio.toFixed(2),

      // Cash metrics
      cashRatio: cashRatio.toFixed(2),
      remainingLiquidity: excessLiquidityRatio.toFixed(2), // 剩余保证金比率 (更准确)

      // Market values
      totalMarketValue: (totalStockValue + totalOptionValue).toFixed(2),
      totalStockValue: totalStockValue.toFixed(2),
      stockValue: totalStockValue.toFixed(2), // Alias
      totalOptionValue: totalOptionValue.toFixed(2),
      optionMaxLoss: optionMaxLoss.toFixed(2), // 期权潜在最大亏损
      totalRisk: totalRisk.toFixed(2), // 总风险敞口

      // Unrealized P&L (NEW)
      totalUnrealizedPnL: totalUnrealizedPnL.toFixed(2),
      stockUnrealizedPnL: totalStockUnrealizedPnL.toFixed(2),
      optionUnrealizedPnL: totalOptionUnrealizedPnL.toFixed(2),

      // Portfolio Greeks (from Market Data API or Black-Scholes fallback)
      totalDelta: totalDelta.toFixed(2),
      totalGamma: totalGamma.toFixed(4),
      totalTheta: totalTheta.toFixed(2),
      totalVega: totalVega.toFixed(2),
      greeksDataSource: process.env.MARKETDATA_API_TOKEN ? 'Market Data API (real-time)' : 'Black-Scholes (calculated)',

      // Portfolio details
      totalEquity: totalEquity.toFixed(2),
      cashBalance: cashBalance.toFixed(2),
      marginUsed: marginUsed.toFixed(2),
      maintenanceMargin: maintenanceMargin.toFixed(2),

      // Risk assessment
      riskLevel: riskLevelFrontend, // GREEN/YELLOW/RED for frontend
      riskLevelText: riskLevel, // low/medium/high for backend
      riskFactors: riskFactors,
      hasHighRiskOptions: hasHighRiskOptions,
      highRiskStrategies: highRiskStrategies,

      // Recommendations
      recommendations: {
        leverageOk: leverageRatio < 1.0,
        concentrationOk: maxConcentration <= 10,
        liquidityOk: excessLiquidityRatio >= 30,
        optionsOk: !hasHighRiskOptions
      },

      lastCalculated: new Date().toISOString()
    };

    res.status(200).json(riskMetrics);
  } catch (error) {
    console.error('Error in GET /portfolio-risk-simple:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}