# CamlyInvest vs IB 数据不一致分析

## IB实际数据 (2025-10-03 22:31)

| 指标 | IB显示值 | 说明 |
|------|---------|------|
| Net Liquidation Value | 60,460 | 账户净清算价值 |
| Unrealized P&L | 15,791 | 未实现盈亏 |
| Market Value | 48,844.63 | 持仓市值 |
| Securities Gross Position Value | 50,580.27 | 证券总持仓价值 |
| Cash | 11,676.10 | 现金余额 |
| Realized P&L | 0 | 已实现盈亏 |

## 计算验证

```
Cash + Market Value = 11,676.10 + 48,844.63 = 60,520.73
差异: 60,520.73 - 60,460 = 60.73 (可能是利息/费用)
```

## CamlyInvest计算逻辑分析

### 当前实现 (api/portfolio-risk-simple.ts)

```typescript
// 股票市值
totalStockValue = Σ(quantity × currentPrice)

// 期权市值
totalOptionValue = Σ(currentPrice × contracts × 100)

// 总市值
totalMarketValue = totalStockValue + totalOptionValue
```

### 🚨 发现的问题

#### 1. **期权方向处理不当**

**IB的处理方式：**
- BUY (Long): 期权市值为正
- SELL (Short): 期权市值为负（负债）

**CamlyInvest当前处理：**
```typescript
// ❌ 错误：所有期权都当作正值
totalOptionValue += currentPrice * contracts * 100;
```

**应该是：**
```typescript
// ✅ 正确：根据direction区分正负
if (direction === 'BUY') {
  totalOptionValue += currentPrice * contracts * 100;  // 资产
} else if (direction === 'SELL') {
  totalOptionValue -= currentPrice * contracts * 100;  // 负债
}
```

#### 2. **未实现盈亏计算缺失**

**IB计算公式：**
```
Unrealized P&L = Current Market Value - Cost Basis
```

**股票：**
```
Unrealized = (current_price - cost_price) × quantity
```

**期权：**
```
BUY:  Unrealized = (current_price - cost_price) × contracts × 100
SELL: Unrealized = (cost_price - current_price) × contracts × 100
```

**CamlyInvest问题：**
- ❌ 没有在API中计算未实现盈亏
- ❌ 前端没有显示未实现盈亏指标

#### 3. **Securities Gross Position Value vs Market Value**

**IB的区别：**
- **Market Value**: 净市值（多头-空头）
- **Securities Gross Position Value**: 总敞口（多头+空头绝对值）

**示例：**
```
持仓：
- Long AAPL: $30,000
- Short QQQ Put: $5,000 (market value = -$5,000)

Market Value = 30,000 - 5,000 = 25,000
SGPV = 30,000 + 5,000 = 35,000
```

## 修复方案

### 优先级1: 修复期权市值计算

**文件**: `api/portfolio-risk-simple.ts`

```typescript
// 当前代码 (line 149-158)
(options || []).forEach((option: any) => {
  const contracts = parseFloat(option.contracts || '0');
  const currentPrice = parseFloat(option.current_price || '0');
  const direction = option.direction; // 'BUY' or 'SELL'

  // ❌ 错误：没有考虑direction
  totalOptionValue += currentPrice * contracts * 100;
});

// 修复后
(options || []).forEach((option: any) => {
  const contracts = parseFloat(option.contracts || '0');
  const currentPrice = parseFloat(option.current_price || '0');
  const direction = option.direction;

  const optionMarketValue = currentPrice * contracts * 100;

  if (direction === 'BUY') {
    totalOptionValue += optionMarketValue;  // Long: 正值
  } else if (direction === 'SELL') {
    totalOptionValue -= optionMarketValue;  // Short: 负值
  }
});
```

### 优先级2: 添加未实现盈亏计算

**新增字段到API响应：**

```typescript
// 计算股票未实现盈亏
let totalStockUnrealizedPnL = 0;
(stocks || []).forEach((stock: any) => {
  const quantity = parseFloat(stock.quantity || '0');
  const currentPrice = parseFloat(stock.current_price || '0');
  const costPrice = parseFloat(stock.cost_price || '0');

  totalStockUnrealizedPnL += (currentPrice - costPrice) * quantity;
});

// 计算期权未实现盈亏
let totalOptionUnrealizedPnL = 0;
(options || []).forEach((option: any) => {
  const contracts = parseFloat(option.contracts || '0');
  const currentPrice = parseFloat(option.current_price || '0');
  const costPrice = parseFloat(option.cost_price || '0');
  const direction = option.direction;

  if (direction === 'BUY') {
    // Long: 价格上涨盈利
    totalOptionUnrealizedPnL += (currentPrice - costPrice) * contracts * 100;
  } else if (direction === 'SELL') {
    // Short: 价格下跌盈利
    totalOptionUnrealizedPnL += (costPrice - currentPrice) * contracts * 100;
  }
});

const totalUnrealizedPnL = totalStockUnrealizedPnL + totalOptionUnrealizedPnL;
```

### 优先级3: 在Dashboard显示

**添加显示卡片：**

```tsx
<div className="bg-gray-800 rounded-lg p-4">
  <div className="text-xs text-gray-400">未实现盈亏</div>
  <div className={`text-xl font-bold ${
    unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
  }`}>
    ${unrealizedPnL.toLocaleString()}
  </div>
  <div className="text-xs text-gray-400 mt-1">
    股票: ${stockUnrealizedPnL.toLocaleString()} |
    期权: ${optionUnrealizedPnL.toLocaleString()}
  </div>
</div>
```

## 测试验证

### 测试用例1: 期权市值计算

**输入数据：**
```
QQQ251003P600:
- direction: SELL
- contracts: 1
- current_price: 12.11
- cost_price: 8.96
```

**期望输出：**
```
Market Value Contribution: -$1,211 (负债)
Unrealized P&L: (8.96 - 12.11) × 1 × 100 = -$315 (亏损)
```

### 测试用例2: 完整账户对比

**运行诊断API：**
```bash
curl "https://www.calmlyinvest.com/api/portfolio-risk-simple?portfolioId=xxx"
```

**对比检查项：**
- [ ] totalMarketValue ≈ IB Market Value (48,844.63)
- [ ] totalUnrealizedPnL ≈ IB Unrealized P&L (15,791)
- [ ] cashBalance = IB Cash (11,676.10)
- [ ] NLV = Market Value + Cash ≈ 60,460

## 下一步行动

1. ✅ 诊断完成 - 找到根本原因
2. ⏳ 修复 `api/portfolio-risk-simple.ts` 期权计算
3. ⏳ 添加未实现盈亏计算
4. ⏳ 更新Dashboard UI显示
5. ⏳ 测试验证与IB数据对比

## 关于Rollover功能

由于当前数据一致性问题优先级更高，建议：
1. 先修复数据计算问题
2. 验证与IB数据匹配
3. 然后再实现Rollover功能

Rollover设计要点：
- 记录closed position的realized P&L
- 新position重新开始unrealized P&L计算
- 保留rollover chain关系
- 支持partial rollover

详细设计见后续文档。
