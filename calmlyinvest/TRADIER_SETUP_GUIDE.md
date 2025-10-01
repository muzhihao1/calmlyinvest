# Tradier API 设置指南

## 📋 概述

Tradier API提供专业级的期权市场数据，包括实时价格和Greeks（Delta, Gamma, Theta, Vega）。

**免费Sandbox环境**:
- ✅ 15分钟延迟数据
- ✅ 完整的期权价格和Greeks
- ✅ 无限API调用
- ✅ 永久免费

**Production环境**（可选升级）:
- ✅ 实时数据
- 💰 $10/月起

---

## 🚀 快速开始（5分钟设置）

### 步骤1: 注册Tradier开发者账号

1. 访问: **https://developer.tradier.com/user/sign_up**

2. 填写注册信息:
   - Email地址
   - 密码
   - 勾选同意条款

3. 点击 **"Sign up"**

4. **检查邮箱** - 点击验证链接激活账号

### 步骤2: 创建Sandbox账号

注册成功后会自动登录，系统会提示创建Sandbox账号：

1. 点击 **"Create Sandbox Account"**
2. 系统会自动创建一个测试账号
3. 记住您的 **Sandbox Account Number**（类似: `12345678`）

### 步骤3: 获取API Token

1. 登录后，点击左侧菜单 **"API Access"**

2. 在 **"Sandbox Access Token"** 部分：
   - 您会看到一个 **Access Token**（类似: `abc123xyz456...`）
   - 这就是您的 **TRADIER_API_KEY**！

3. **复制这个Token** 📋

### 步骤4: 配置环境变量

打开项目的 `.env` 文件，找到Tradier配置部分：

```bash
# Tradier API Configuration
TRADIER_API_KEY=粘贴您的Token到这里
TRADIER_SANDBOX=true
```

**示例**:
```bash
TRADIER_API_KEY=abc123xyz456def789ghi012jkl345mno678pqr901stu234vwx567
TRADIER_SANDBOX=true
```

### 步骤5: 重启开发服务器

```bash
cd calmlyinvest
npm run dev
```

### 步骤6: 测试期权数据更新

1. 访问 http://localhost:5000
2. 登录应用
3. 进入仪表板
4. 点击 **"刷新数据"** 按钮
5. 查看期权表格 - 价格和Delta应该会更新！

---

## 🔍 验证API是否工作

### 方法1: 查看服务器日志

在终端中，您应该看到类似的日志：

```
📊 Tradier Provider initialized: SANDBOX (15-min delay)
📡 Fetching option price for QQQ250718P00440000...
✅ Got price for QQQ 250718P440: $2.07
📊 Fetching Greeks for QQQ250718P00440000...
✅ Got Greeks for QQQ 250718P440: delta=-0.403, gamma=0.012...
```

### 方法2: 检查期权数据

期权表格中应该显示：
- ✅ 准确的当前价格（而不是估算值）
- ✅ 更新的Delta值
- ✅ 绿色/红色的涨跌显示

### 如果出现错误

**错误: `⚠️ Tradier API not configured`**
- 解决: 检查 `.env` 文件中的 `TRADIER_API_KEY` 是否已填写

**错误: `Tradier API authentication failed`**
- 解决: API Token可能不正确，重新从Tradier网站复制

**错误: `Cannot convert option symbol`**
- 解决: 期权代码格式可能不正确，应该是: `QQQ 250718P440`

---

## 📊 API使用情况监控

### 查看API调用次数

1. 登录 https://developer.tradier.com
2. 点击 **"Dashboard"**
3. 查看 **"API Usage"** 图表

**Sandbox环境没有速率限制**，您可以随意测试！

---

## 💰 升级到实时数据（可选）

### 何时需要升级？

- ✅ 如果15分钟延迟对您来说可以接受 → **保持Sandbox（免费）**
- ⬆️ 如果需要实时数据进行日内交易 → **升级到Production**

### 升级步骤

1. 访问 **https://brokerage.tradier.com/signup**
2. 开立Tradier经纪账户（需要入金）
3. 获取Production API Token
4. 更新 `.env` 配置:
   ```bash
   TRADIER_API_KEY=your_production_token
   TRADIER_SANDBOX=false  # 改为false
   ```

**费用**:
- Market Data订阅: $10/月
- 或者: 账户余额 > $500可免费获取实时数据

---

## 🔧 API配置选项

### 完整的环境变量配置

```bash
# Tradier API配置
TRADIER_API_KEY=your_api_key_here        # 必填
TRADIER_SANDBOX=true                      # true=延迟数据, false=实时数据
```

### Vercel部署配置

如果您在Vercel上部署，需要在Vercel Dashboard设置环境变量：

1. 进入 **Vercel项目 → Settings → Environment Variables**
2. 添加:
   - Name: `TRADIER_API_KEY`
   - Value: 您的API Token
   - Environment: 选择 `Production`, `Preview`, `Development`
3. 添加:
   - Name: `TRADIER_SANDBOX`
   - Value: `true`
   - Environment: 同上
4. 点击 **"Save"**
5. **重新部署**应用

---

## 📖 API文档

### Tradier官方文档
- API参考: https://documentation.tradier.com/brokerage-api
- Option Quotes: https://documentation.tradier.com/brokerage-api/markets/get-quotes
- Greeks计算: https://documentation.tradier.com/brokerage-api/markets/get-option-greeks

### 我们使用的API端点

**获取期权报价**:
```
GET https://sandbox.tradier.com/v1/markets/quotes
  ?symbols=QQQ250718P00440000
  &greeks=true
```

**返回数据示例**:
```json
{
  "quotes": {
    "quote": {
      "symbol": "QQQ250718P00440000",
      "last": 2.07,
      "bid": 2.05,
      "ask": 2.09,
      "greeks": {
        "delta": -0.403,
        "gamma": 0.012,
        "theta": -0.045,
        "vega": 0.089
      }
    }
  }
}
```

---

## ❓ 常见问题

### Q: Sandbox和Production有什么区别？

| 特性 | Sandbox | Production |
|------|---------|------------|
| 数据延迟 | 15分钟 | 实时 |
| 费用 | 免费 | $10/月 |
| API限制 | 无限制 | 120 calls/分钟 |
| 适用场景 | 开发测试 | 生产环境 |

### Q: 如何查看我的API Token？

登录 https://developer.tradier.com → 点击 **"API Access"** → 复制Sandbox Access Token

### Q: 我可以同时使用多个账号吗？

可以。但通常一个Sandbox账号就够用了。

### Q: 期权代码格式是什么？

系统内部格式: `QQQ 250718P440`
- `QQQ` = 标的代码
- `250718` = 到期日 (YYMMDD)
- `P` = 期权类型 (C=Call, P=Put)
- `440` = 执行价

系统会自动转换为Tradier格式: `QQQ250718P00440000`

### Q: API调用失败怎么办？

1. 检查API Token是否正确
2. 检查网络连接
3. 查看服务器日志中的错误信息
4. 如果持续失败，系统会回退到估算价格（但不更新Delta）

### Q: 15分钟延迟够用吗？

对于大多数个人投资者和长期持仓来说，15分钟延迟完全够用。只有日内交易者才需要实时数据。

---

## 📞 支持

### 遇到问题？

1. **查看日志**: 服务器终端会显示详细的错误信息
2. **检查配置**: 确认 `.env` 文件中的配置正确
3. **Tradier支持**: support@tradier.com
4. **项目Issues**: 在GitHub项目中提交Issue

---

## ✅ 设置完成检查清单

- [ ] 已注册Tradier开发者账号
- [ ] 已创建Sandbox账号
- [ ] 已获取API Access Token
- [ ] 已在 `.env` 中配置 `TRADIER_API_KEY`
- [ ] 已在 `.env` 中设置 `TRADIER_SANDBOX=true`
- [ ] 已重启开发服务器
- [ ] 测试"刷新数据"功能 - 期权价格正确更新
- [ ] 验证Delta值正确显示
- [ ] （可选）在Vercel配置环境变量
- [ ] （可选）升级到Production实时数据

---

**恭喜！🎉 您的Tradier API已成功配置！**

现在您的应用可以获取真实的期权市场价格和Greeks数据了。
