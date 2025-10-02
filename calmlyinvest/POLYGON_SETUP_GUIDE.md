# Polygon.io API 设置指南

> ⚡ **秒级注册，立即使用 | 无需审核 | 永久免费**

## 🎯 为什么选择 Polygon.io？

- ✅ **秒级注册**：填写邮箱密码即可，无需审核等待
- ✅ **永久免费**：15分钟延迟数据，无限API调用
- ✅ **完整Greeks**：Delta, Gamma, Theta, Vega
- ✅ **高质量数据**：聚合17家美国期权交易所数据
- ✅ **4年历史数据**：免费访问历史期权数据
- ✅ **官方TypeScript支持**：原生Node.js集成

---

## 📋 注册步骤（1分钟搞定）

### 第1步：访问注册页面
```
https://polygon.io/
```

### 第2步：点击 "Sign Up" 注册
<img src="https://polygon.io/images/signup.png" width="400" alt="Polygon.io Sign Up" />

### 第3步：填写注册信息
- **Email**：您的邮箱地址
- **Password**：设置密码（至少8位）
- **Company Name**：可选，填写项目名称或个人名称

### 第4步：验证邮箱
- 检查邮箱收件箱
- 点击验证链接
- **立即完成！无需等待审核** ✅

### 第5步：获取API Key
1. 登录后，进入 Dashboard
2. 点击左侧 **"API Keys"**
3. 复制您的 **Default API Key**

```
示例 API Key：
YOUR_POLYGON_API_KEY_HERE_1234567890abcdef
```

**重要**：Polygon.io立即提供API Key，无需等待！

---

## ⚙️ 配置环境变量

### 编辑 `.env` 文件

找到项目根目录下的 `.env` 文件，添加：

```bash
# Polygon.io API Configuration
POLYGON_API_KEY=粘贴您的API Key到这里
```

**示例**：
```bash
# Polygon.io API Configuration
POLYGON_API_KEY=YOUR_POLYGON_API_KEY_HERE_1234567890abcdef
```

### 保存文件

按 `Ctrl+S` (Windows/Linux) 或 `Cmd+S` (Mac) 保存。

---

## 🚀 重启服务器

配置完成后，重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动：
npm run dev
```

---

## ✅ 验证配置

### 1. 检查日志

启动后，查看控制台输出，应该看到：

```
📡 Fetching option data from Polygon.io: O:QQQ250718P00440000
💰 Price from last trade: $2.07
✅ Successfully fetched data for QQQ 250718P440:
   Price: $2.07
   Delta: -0.403
   Gamma: 0.015
   Theta: -0.012
   Vega: 0.089
```

### 2. 测试期权数据刷新

1. 登录应用
2. 进入仪表板
3. 点击 **"刷新数据"** 按钮
4. 查看期权价格和Delta是否更新

### 3. 预期结果

✅ 期权价格准确显示
✅ Delta值准确显示
✅ 数据每次刷新都会更新
✅ 无错误提示

---

## 🐛 常见问题

### 问题1：401 Unauthorized

**错误信息**：
```
❌ Polygon.io authentication failed. Check your POLYGON_API_KEY.
```

**解决方法**：
1. 检查 `.env` 文件中的 `POLYGON_API_KEY` 是否正确
2. 确认API Key没有多余的空格或引号
3. 重新复制API Key
4. 重启服务器

### 问题2：404 Not Found

**错误信息**：
```
❌ Option not found: QQQ 250718P440
```

**可能原因**：
- 期权合约不存在或已过期
- 期权代码格式错误
- 标的符号不正确

**解决方法**：
1. 检查期权代码格式：`SYMBOL YYMMDDX999` (例如：`QQQ 250718P440`)
2. 确认期权未过期
3. 验证标的代码（QQQ, AAPL等）

### 问题3：429 Too Many Requests

**错误信息**：
```
❌ Polygon.io rate limit exceeded
```

**原因**：免费tier有每分钟请求限制

**解决方法**：
- 等待1分钟后重试
- 减少刷新频率
- 考虑升级到付费plan（$99/月，无限制）

### 问题4：期权数据为空

**错误信息**：
```
⚠️ No Greeks data available for QQQ 250718P440
```

**可能原因**：
- 期权合约交易量太小
- 市场休市时间
- 期权刚上市，暂无Greeks数据

**解决方法**：
- 选择交易量较大的期权合约
- 在市场交易时间测试
- 等待几分钟后重试

---

## 📊 免费 vs 付费方案

| 特性 | 免费方案 (Free) | 付费方案 (Starter $99/月) |
|------|----------------|--------------------------|
| **数据延迟** | 15分钟 | 实时 |
| **API调用** | 无限制* | 无限制 |
| **历史数据** | 4年 | 无限制 |
| **Greeks** | ✅ 完整 | ✅ 完整 |
| **技术支持** | 社区 | 邮件支持 |
| **WebSocket** | ❌ | ✅ |

\* 免费方案有每分钟请求限制（通常5次/分钟），对于大多数应用足够

### 何时需要升级？

- ✅ 需要实时数据（0延迟）
- ✅ 高频交易应用
- ✅ 需要WebSocket推送
- ✅ 需要超过4年的历史数据

**对于持仓管理应用，免费方案完全够用！**

---

## 🔗 有用的链接

- **注册地址**：https://polygon.io/
- **官方文档**：https://polygon.io/docs/options
- **API参考**：https://polygon.io/docs/options/get_v3_snapshot_options__underlyingasset___optioncontract
- **定价页面**：https://polygon.io/pricing
- **支持中心**：https://polygon.io/contact

---

## 🎉 完成！

恭喜！您已成功配置Polygon.io API。

现在您的应用可以：
- ✅ 获取准确的期权价格
- ✅ 实时更新Greeks（Delta, Gamma, Theta, Vega）
- ✅ 追踪期权持仓风险
- ✅ 做出更明智的交易决策

---

## 📝 技术细节

### API端点使用

```typescript
// 获取期权快照（价格 + Greeks）
GET https://api.polygon.io/v3/snapshot/options/{optionContract}?apiKey=YOUR_API_KEY

// 示例响应：
{
  "status": "OK",
  "results": {
    "ticker": "O:QQQ250718P00440000",
    "last_trade": {
      "price": 2.07
    },
    "greeks": {
      "delta": -0.403,
      "gamma": 0.015,
      "theta": -0.012,
      "vega": 0.089
    },
    "implied_volatility": 0.245,
    "open_interest": 1523
  }
}
```

### 期权代码转换

```typescript
// 内部格式 → Polygon格式
"QQQ 250718P440" → "O:QQQ250718P00440000"

格式说明：
- O: 期权前缀
- QQQ: 标的代码
- 250718: 到期日 (YYMMDD)
- P: 期权类型 (P=Put, C=Call)
- 00440000: 执行价 (8位，乘以1000)
```

### 错误处理

代码已实现完整的错误处理：
1. API认证失败 → 提示检查API Key
2. 期权不存在 → 返回详细错误信息
3. 速率限制 → 自动等待重试
4. 网络错误 → 降级到Yahoo Finance备用方案

---

## 💬 需要帮助？

如果遇到问题：
1. 查看上方"常见问题"部分
2. 检查控制台日志输出
3. 访问Polygon.io文档
4. 联系技术支持

祝您投资顺利！📈
