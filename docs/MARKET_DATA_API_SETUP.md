# Market Data API 配置指南

## 📋 概述

CalmlyInvest 支持使用 **Market Data API** 获取真实的期权数据，包括：
- ✅ 实时期权价格（Bid, Ask, Last, Mid）
- ✅ 真实的 Greeks（Delta, Gamma, Theta, Vega, Rho）
- ✅ 隐含波动率 (Implied Volatility)
- ✅ 开盘兴趣 (Open Interest)
- ✅ 交易量 (Volume)

如果没有配置 Market Data API，系统会自动使用 **Black-Scholes 模型**作为备用方案。

---

## 🆚 数据来源对比

| 特性 | Market Data API | Black-Scholes 备用 |
|------|----------------|-------------------|
| **Greeks 来源** | 真实市场数据 | 数学公式计算 |
| **精度** | 100% 准确 | 1-2% 误差 |
| **价格数据** | 实时市场价格 | 理论价格 |
| **成本** | $99/月（有免费试用） | $0 (完全免费) |
| **配置难度** | 需要 API token | 无需配置 |
| **适用场景** | 专业投资者、高频交易 | 个人投资者、组合分析 |

---

## 🔑 获取 API Token

### 1️⃣ 注册 Market Data 账户

访问：https://www.marketdata.app/

1. 点击 "Sign Up" 注册账户
2. **免费试用**：30天完整功能试用，无需信用卡
3. 验证邮箱后登录

### 2️⃣ 获取 API Token

1. 登录后进入 Dashboard
2. 点击 "API Keys" 或 "Settings"
3. 找到您的 API Token（格式：`md_xxxxxxxxxxxxxxxxxxxxx`）
4. 复制 Token 备用

### 3️⃣ 查看套餐和定价

免费试用结束后，可选择付费套餐：

| 套餐 | 价格 | API 调用限制 | 适用场景 |
|------|------|------------|---------|
| **Starter** | $99/月 | 100,000 calls/月 | 个人投资者 |
| **Professional** | $299/月 | 500,000 calls/月 | 专业交易者 |
| **Enterprise** | 定制 | 无限制 | 机构投资者 |

详细定价：https://www.marketdata.app/pricing/

---

## ⚙️ 配置 API Token

### 本地开发环境

1. **编辑 `.env` 文件**：
   ```bash
   # 在项目根目录创建或编辑 .env 文件
   cd /Users/liasiloam/Vibecoding/1MyProducts/CamlyInvest
   nano .env
   ```

2. **添加 Market Data API Token**：
   ```env
   # Market Data API Configuration
   MARKETDATA_API_TOKEN=md_xxxxxxxxxxxxxxxxxxxxx
   ```

3. **保存并重启服务器**：
   ```bash
   npm run dev
   ```

### Vercel 生产环境

1. **登录 Vercel Dashboard**：
   访问：https://vercel.com/dashboard

2. **进入项目设置**：
   - 选择 CalmlyInvest 项目
   - 点击 "Settings" → "Environment Variables"

3. **添加环境变量**：
   - **Name**: `MARKETDATA_API_TOKEN`
   - **Value**: `md_xxxxxxxxxxxxxxxxxxxxx`（您的 API Token）
   - **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

4. **重新部署**：
   ```bash
   git push origin main
   # Vercel 会自动重新部署并应用新的环境变量
   ```

---

## ✅ 验证配置

### 检查环境变量

```bash
# 本地检查
echo $MARKETDATA_API_TOKEN

# 或在代码中检查
node -e "console.log(process.env.MARKETDATA_API_TOKEN)"
```

### 测试 API 连接

运行测试脚本：

```bash
npm run test:market-data
```

或手动测试：

```bash
node scripts/test-market-data-api.ts
```

### 查看 API 响应

调用组合风险 API 并查看日志：

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://calmlyinvest.vercel.app/api/portfolio-risk-simple?portfolioId=xxx"
```

**成功日志示例**：
```
✅ Using Market Data API for real-time Greeks
📡 [Market Data API] Fetching QQQ 250718P440...
✅ [Market Data API] QQQ 250718P440: Delta=-0.4521, Price=$12.35
✅ Updated Greeks for 3 option(s) in database
   📊 Data sources: Market Data API=3, Black-Scholes=0, Failed=0
```

**备用方案日志示例**（未配置 Token）：
```
⚠️ Market Data API not configured, using Black-Scholes calculation
🧮 [Black-Scholes] Calculating QQQ 250718P440...
✅ [Black-Scholes] QQQ 250718P440: Delta=-0.4498, Calculated Price=$12.40
✅ Updated Greeks for 3 option(s) in database
   📊 Data sources: Market Data API=0, Black-Scholes=3, Failed=0
```

---

## 🔄 降级策略（Graceful Degradation）

系统具有智能降级机制：

### 自动降级流程

```
┌─────────────────────────────────────┐
│   检查 MARKETDATA_API_TOKEN         │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Token 存在？  │
        └──────┬───────┘
               │
       ┌───────┴────────┐
       │                │
      是               否
       │                │
       ▼                ▼
┌──────────────┐  ┌────────────────┐
│ 调用 Market  │  │ 使用 Black-    │
│ Data API     │  │ Scholes 计算   │
└──────┬───────┘  └────────────────┘
       │
       ▼
┌──────────────┐
│ API 成功？   │
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
  是       否
   │        │
   ▼        ▼
 使用    降级到
 真实    Black-
 数据    Scholes
```

### 降级场景

1. **未配置 Token**
   - 直接使用 Black-Scholes 计算
   - 无错误提示（静默降级）

2. **API 调用失败**
   - Token 无效（401错误）
   - 期权不存在（404错误）
   - 速率限制（429错误）
   - 网络超时
   - 自动降级到 Black-Scholes

3. **部分成功**
   - 某些期权使用 Market Data API
   - 某些期权降级到 Black-Scholes
   - 混合数据源（日志中会显示）

---

## 📊 API 响应示例

### 组合风险 API 响应

```json
{
  "portfolioId": "xxx",
  "leverageRatio": "1.25",

  // Portfolio Greeks
  "totalDelta": "650.00",
  "totalGamma": "12.5000",
  "totalTheta": "-245.50",
  "totalVega": "1250.00",
  "greeksDataSource": "Market Data API (real-time)",

  // 其他风险指标
  "portfolioBeta": "1.15",
  "maxConcentration": "18.50",
  "riskLevel": "YELLOW",
  ...
}
```

### 单个期权数据（数据库）

```sql
SELECT
  option_symbol,
  current_price,
  delta_value,
  gamma_value,
  theta_value,
  vega_value,
  implied_volatility,
  greeks_updated_at
FROM option_holdings
WHERE status = 'ACTIVE';
```

**结果示例**：
```
option_symbol      | current_price | delta_value | gamma_value | theta_value | vega_value | implied_volatility | greeks_updated_at
-------------------|---------------|-------------|-------------|-------------|------------|--------------------|-------------------
QQQ 250718P440     | 12.35         | -0.4521     | 0.0123      | -8.45       | 12.30      | 0.2845             | 2025-10-25 14:30:00
AAPL 250117C185    | 5.80          | 0.6823      | 0.0142      | -12.45      | 85.30      | 0.2801             | 2025-10-25 14:30:00
```

---

## 🚨 故障排查

### 问题 1: "MARKETDATA_API_TOKEN not configured"

**原因**: 环境变量未设置

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认变量名拼写正确（区分大小写）
3. 重启开发服务器：`npm run dev`
4. Vercel 环境：确认在 Dashboard 中添加了环境变量

### 问题 2: "Invalid Market Data API token" (401错误)

**原因**: Token 无效或过期

**解决方案**:
1. 检查 Token 是否正确复制（没有多余空格）
2. 登录 Market Data Dashboard 确认 Token 有效
3. 如果免费试用期结束，需要订阅付费套餐
4. 重新生成新的 Token

### 问题 3: "Rate limit exceeded" (429错误)

**原因**: API 调用次数超过限额

**解决方案**:
1. 检查当月使用量：Market Data Dashboard
2. 升级到更高套餐
3. 优化调用频率（考虑缓存 Greeks 数据）
4. 临时降级到 Black-Scholes（系统会自动处理）

### 问题 4: 期权数据返回 404

**原因**: 期权代码格式错误或期权不存在

**解决方案**:
1. 确认期权代码格式正确：`SYMBOL YYMMDDC/PSTRIKE`
   - 示例：`QQQ 250718P440`
2. 检查期权是否已过期
3. 确认行权价格正确（Market Data 使用8位格式）
4. 查看日志中的转换后的代码：`QQQ250718P00440000`

### 问题 5: Black-Scholes 也失败了

**原因**: Yahoo Finance 也无法获取数据

**解决方案**:
1. 检查网络连接
2. 确认标的股票代码正确
3. Yahoo Finance 可能临时不可用，稍后重试
4. 手动设置 IV（未来功能）

---

## 💡 最佳实践

### 1. 成本优化

```typescript
// ✅ 推荐：只在用户主动刷新时调用
GET /api/portfolio-risk-simple?portfolioId=xxx

// ❌ 避免：高频轮询
setInterval(() => {
  fetchPortfolioRisk();
}, 1000); // 每秒调用一次！
```

**建议**：
- 缓存 Greeks 数据 5-15 分钟
- 只在用户打开页面或点击"刷新"时调用
- 使用 WebSocket 或 SSE 获取实时更新（而不是轮询）

### 2. 混合使用

对于不需要高精度的场景，可以考虑：

```typescript
// 重要期权：使用 Market Data API
const criticalOptions = ['QQQ 250718P440'];

// 其他期权：使用 Black-Scholes
const nonCriticalOptions = ['AAPL 260117C200'];
```

### 3. 监控使用量

定期检查 Market Data Dashboard：
- 当月使用量
- 剩余配额
- 费用预估

设置告警：
- 使用量达到 80% 时发送通知
- 考虑升级套餐或优化调用

---

## 📚 相关文档

- **Market Data API 官方文档**: https://www.marketdata.app/docs/api/options
- **Black-Scholes 实现文档**: `docs/BLACK_SCHOLES_GREEKS_IMPLEMENTATION.md`
- **IB API 集成分析**: `docs/guides/IB_API_INTEGRATION_ANALYSIS.md`

---

## 📞 技术支持

### Market Data API 支持

- 官方文档: https://www.marketdata.app/docs
- 邮箱支持: support@marketdata.app
- Discord 社区: https://discord.gg/marketdata

### CalmlyInvest 支持

- GitHub Issues: https://github.com/muzhihao1/calmlyinvest/issues
- 项目文档: `/docs` 目录

---

**更新日期**: 2025-10-25
**版本**: 1.0
**状态**: ✅ 已实现并测试
