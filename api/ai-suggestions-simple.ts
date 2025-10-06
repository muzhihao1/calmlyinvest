import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error('Missing environment variables');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const portfolioId = req.query.portfolioId as string;
  const userId = req.query.userId as string;

  if (!portfolioId || !userId) {
    res.status(400).json({ error: "portfolioId and userId are required" });
    return;
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch portfolio data
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", portfolioId)
      .eq("user_id", userId)
      .single();

    if (portfolioError || !portfolio) {
      res.status(404).json({ error: "Portfolio not found" });
      return;
    }

    // Fetch stock holdings
    const { data: stockHoldings, error: stockError } = await supabase
      .from("stock_holdings")
      .select("*")
      .eq("portfolio_id", portfolioId);

    if (stockError) {
      console.error("Error fetching stocks:", stockError);
      res.status(500).json({ error: "Failed to fetch stock holdings" });
      return;
    }

    // Fetch option holdings
    const { data: optionHoldings, error: optionError } = await supabase
      .from("option_holdings")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .eq("status", "ACTIVE");

    if (optionError) {
      console.error("Error fetching options:", optionError);
      res.status(500).json({ error: "Failed to fetch option holdings" });
      return;
    }

    // Calculate key metrics
    const totalEquity = parseFloat(portfolio.total_equity || "0");
    const cashBalance = parseFloat(portfolio.cash_balance || "0");
    const marginUsed = parseFloat(portfolio.margin_used || "0");

    const stockValue = (stockHoldings || []).reduce((sum: number, stock: any) => {
      return sum + (stock.quantity * parseFloat(stock.current_price || "0"));
    }, 0);

    const optionValue = (optionHoldings || []).reduce((sum: number, option: any) => {
      const value = option.contracts * parseFloat(option.current_price || "0") * 100;
      return sum + (option.direction === "SELL" ? -value : value);
    }, 0);

    // Calculate concentration
    const stockConcentrations = (stockHoldings || []).map((stock: any) => {
      const value = stock.quantity * parseFloat(stock.current_price || "0");
      const concentration = stockValue > 0 ? (value / stockValue) * 100 : 0;
      return {
        symbol: stock.symbol,
        name: stock.name,
        value,
        concentration: concentration.toFixed(1)
      };
    }).sort((a: any, b: any) => parseFloat(b.concentration) - parseFloat(a.concentration));

    // Build AI prompt
    const prompt = `你是一位专业的投资顾问，请基于以下投资组合数据，给出实际的、可执行的调仓建议。

## 投资组合概况
- 净清算价值：$${totalEquity.toFixed(2)}
- 现金余额：$${cashBalance.toFixed(2)} (${((cashBalance / totalEquity) * 100).toFixed(1)}%)
- 股票市值：$${stockValue.toFixed(2)} (${((stockValue / totalEquity) * 100).toFixed(1)}%)
- 期权净值：$${optionValue.toFixed(2)} (${((optionValue / totalEquity) * 100).toFixed(1)}%)
- 已用保证金：$${marginUsed.toFixed(2)}

## 持仓明细
### 股票持仓（前5大）
${stockConcentrations.slice(0, 5).map((stock: any) =>
  `- ${stock.symbol} ${stock.name}: $${stock.value.toFixed(2)} (${stock.concentration}%)`
).join('\n')}

### 期权持仓
${(optionHoldings || []).map((option: any) => {
  const daysToExpiry = Math.ceil((new Date(option.expiration_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return `- ${option.option_symbol}: ${option.direction} ${option.option_type}, 行权价$${option.strike_price}, ${daysToExpiry}天到期, Delta=${option.delta_value}`;
}).join('\n') || '无期权持仓'}

## 风险指标
- 最大持仓集中度：${stockConcentrations[0]?.concentration || 0}% (${stockConcentrations[0]?.symbol || 'N/A'})
- 流动性比率：${(((totalEquity - marginUsed) / totalEquity) * 100).toFixed(1)}%

## 任务要求
请作为投资顾问，提供3-5条具体的调仓建议，每条建议必须包含：
1. **建议类型**：立即行动/期权管理/组合优化
2. **优先级**：高/中/低
3. **建议标题**：简短明确（20字以内）
4. **详细说明**：为什么需要这样操作，预期效果
5. **具体行动**：明确的操作步骤（如"卖出TSLA 100股"、"滚动NVDA PUT至下月"）

请以JSON格式返回，格式如下：
{
  "suggestions": [
    {
      "type": "IMMEDIATE|OPTION_MANAGEMENT|PORTFOLIO_OPTIMIZATION",
      "priority": "HIGH|MEDIUM|LOW",
      "title": "建议标题",
      "description": "详细说明",
      "action": "具体行动步骤"
    }
  ],
  "summary": "整体组合评价（2-3句话）"
}

注意：
- 单一持仓不应超过20%
- 建议维持30%以上现金缓冲
- 期权临近到期（<30天）需要及时处理
- 考虑市场环境和风险管理原则`;

    // Call OpenAI API
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use more cost-effective model
      messages: [
        {
          role: "system",
          content: "你是一位专业的投资顾问，擅长股票和期权投资策略，精通风险管理和资产配置。请提供专业、实际、可执行的投资建议。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    // Parse AI response
    const parsedResponse = JSON.parse(aiResponse);

    res.status(200).json(parsedResponse);

  } catch (error: any) {
    console.error("Error generating AI suggestions:", error);
    res.status(500).json({
      error: "Failed to generate AI suggestions",
      message: error.message
    });
  }
}
