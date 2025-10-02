# Market Data API 设置指南

> ⚡ **1分钟注册，无需信用卡 | 30天免费试用 | 实时Greeks**

## 🎯 为什么选择 Market Data API？

- ✅ **无需信用卡**：30天免费试用，无需提供支付信息
- ✅ **实时数据**：真实市场价格和Greeks
- ✅ **完整Greeks**：Delta, Gamma, Theta, Vega, Rho
- ✅ **高质量数据**：专业级市场数据
- ✅ **隐含波动率**：每个期权的IV
- ✅ **简单集成**：REST API，即时可用

---

## 📋 注册步骤（1分钟搞定）

### 第1步：访问注册页面
```
https://www.marketdata.app/
```

### 第2步：点击 "Start Free Trial"

### 第3步：填写注册信息
- **Email**：您的邮箱地址
- **Password**：设置密码
- **无需信用卡** ✅

### 第4步：验证邮箱
- 检查邮箱收件箱
- 点击验证链接
- **立即完成！**

### 第5步：获取API Token
1. 登录后，进入 Dashboard
2. 点击 **"API"** 或 **"Tokens"**
3. 复制您的 **API Token**

```
示例 Token：
your_marketdata_api_token_here_1234567890abcdef
```

---

## ⚙️ 配置环境变量

### 编辑 `.env` 文件

找到项目根目录下的 `.env` 文件，添加：

```bash
# Market Data API Configuration
MARKETDATA_API_TOKEN=粘贴您的Token到这里
```

**示例**：
```bash
# Market Data API Configuration
MARKETDATA_API_TOKEN=your_marketdata_api_token_here_1234567890abcdef
```

### 保存文件

按 `Ctrl+S` (Windows/Linux) 或 `Cmd+S` (Mac) 保存。

---

## 🧪 测试配置

运行测试脚本验证API连接：

```bash
npx tsx test-marketdata.ts
```

**预期输出**：
```
🧪 Testing Market Data API Integration...

✅ API Token found: RnB5a21laExK...saz0

📋 Test Cases:

🔍 Testing: AAPL Call Option (Jan 16, 2026, Strike $250)
   ✅ SUCCESS!

   📊 Option Data:
      Price:       $17.65
      Delta:       0.6160
      Gamma:       0.0110
      Theta:       -0.0770
      Vega:        0.5290
      IV:          24.70%

🎉 Market Data API is working!
```

---

## 🚀 启动应用

配置完成后，启动开发服务器：

```bash
npm run dev
```

---

## ✅ 验证功能

### 1. 添加期权持仓

1. 登录应用
2. 进入仪表板
3. 点击 **"添加持仓"**
4. 选择 **"期权"**
5. 输入期权信息：
   - 标的：如 `AAPL`
   - 到期日：如 `2026-01-16`
   - 类型：Call 或 Put
   - 执行价：如 `250`
   - 数量和成本

### 2. 刷新数据

1. 点击 **"刷新数据"** 按钮
2. 等待几秒

### 3. 查看结果

✅ 期权价格自动更新
✅ Delta值实时显示
✅ 数据准确反映市场情况

---

## 🐛 常见问题

### 问题1：401 Unauthorized

**错误信息**：
```
❌ Market Data API authentication failed. Check your MARKETDATA_API_TOKEN.
```

**解决方法**：
1. 检查 `.env` 文件中的 `MARKETDATA_API_TOKEN` 是否正确
2. 确认Token没有多余的空格或引号
3. 重新复制Token从Market Data dashboard
4. 重启服务器

### 问题2：400 Bad Request - Option not found

**错误信息**：
```
❌ Option not found: QQQ 250117P440
No option was found for this strike and expiration.
```

**可能原因**：
- **期权已过期**：使用的日期已经过去
- **执行价不存在**：该执行价没有交易
- **日期格式错误**：期权到期日格式不对

**解决方法**：

1. **使用未来的到期日**：
   ```
   ❌ 错误：QQQ 250117P440  (2025年1月已过期)
   ✅ 正确：QQQ 260116P520  (2026年1月16日)
   ```

2. **使用标准到期日**（每月第三个星期五）：
   - 2025年12月：251219
   - 2026年1月：260116
   - 2026年2月：260220

3. **选择合理的执行价**：
   - 查看当前股价
   - 选择接近当前价的执行价
   - 避免极端价格（过高或过低）

4. **期权代码格式**：
   ```
   格式：SYMBOL YYMMDDXSTRIKE
   - SYMBOL: 标的代码（如 AAPL, QQQ）
   - YYMMDD: 到期日6位数字（如 260116）
   - X: C=Call, P=Put
   - STRIKE: 执行价（如 250, 440）

   示例：
   - AAPL 260116C250 = AAPL Call, 2026年1月16日, $250
   - QQQ 260220P520 = QQQ Put, 2026年2月20日, $520
   ```

### 问题3：429 Too Many Requests

**错误信息**：
```
❌ Market Data API rate limit exceeded
```

**解决方法**：
- 30天试用有速率限制
- 等待几秒后重试
- 减少刷新频率
- 考虑升级到付费计划（无限制）

### 问题4：试用期结束

**30天后**：
- 免费试用结束
- 需要订阅付费计划
- 查看定价：https://www.marketdata.app/pricing/

---

## 📊 免费试用 vs 付费方案

| 特性 | 免费试用 (30天) | 付费方案 |
|------|----------------|---------|
| **数据延迟** | 实时 | 实时 |
| **API调用** | 有限制 | 无限制（取决于plan） |
| **Greeks** | ✅ 完整 | ✅ 完整 |
| **历史数据** | ✅ | ✅ |
| **技术支持** | 邮件 | 优先支持 |
| **费用** | 免费30天 | 根据plan |

### 何时需要升级？

- ✅ 30天试用结束后
- ✅ 需要更高API调用限制
- ✅ 需要历史回测数据
- ✅ 需要WebSocket实时推送

**对于持仓管理应用，30天试用足够评估是否适合！**

---

## 🔗 有用的链接

- **注册地址**：https://www.marketdata.app/
- **官方文档**：https://www.marketdata.app/docs/api/
- **期权API文档**：https://www.marketdata.app/docs/api/options
- **定价页面**：https://www.marketdata.app/pricing/
- **支持中心**：https://www.marketdata.app/contact

---

## 🎉 完成！

恭喜！您已成功配置Market Data API。

现在您的应用可以：
- ✅ 获取实时期权价格
- ✅ 实时更新Greeks（Delta, Gamma, Theta, Vega）
- ✅ 追踪期权持仓风险
- ✅ 做出更明智的交易决策

---

## 📝 技术细节

### API端点

```typescript
// 获取期权报价（价格 + Greeks）
GET https://api.marketdata.app/v1/options/quotes/{optionSymbol}/

// 认证
Headers: {
  "Authorization": "Bearer YOUR_TOKEN",
  "Accept": "application/json"
}
```

### 响应示例

```json
{
  "s": "ok",
  "optionSymbol": ["AAPL260116C00250000"],
  "underlying": ["AAPL"],
  "bid": [17.5],
  "ask": [17.8],
  "mid": [17.65],
  "last": [17.9],
  "delta": [0.616],
  "gamma": [0.011],
  "theta": [-0.077],
  "vega": [0.529],
  "iv": [0.247],
  "openInterest": [46989],
  "volume": [628]
}
```

### 期权代码转换

```typescript
// 内部格式 → Market Data格式
"AAPL 260116C250" → "AAPL260116C00250000"

格式说明：
- AAPL: 标的代码
- 260116: 到期日 (YYMMDD - 2026年1月16日)
- C: 期权类型 (C=Call, P=Put)
- 00250000: 执行价 (8位，乘以1000)
  250 → 00250000
  250.5 → 00250500
```

### 错误处理

代码已实现完整的错误处理：
1. API认证失败 → 提示检查Token
2. 期权不存在 → 返回详细错误信息
3. 速率限制 → 自动提示等待
4. 网络错误 → 降级到Yahoo Finance备用方案

---

## 💬 需要帮助？

如果遇到问题：
1. 查看上方"常见问题"部分
2. 检查控制台日志输出
3. 运行测试脚本：`npx tsx test-marketdata.ts`
4. 访问Market Data文档
5. 联系技术支持

**30天免费试用，无风险，立即体验！** 🚀

祝您投资顺利！📈
