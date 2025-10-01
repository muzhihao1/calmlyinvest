# API测试步骤

## 问题根源

Vercel无法识别API handler，因为使用了wrapper模式：
```typescript
export default allowCors(handler);  // ❌ Vercel不支持
```

应该使用标准格式：
```typescript
export default async function handler(req, res) { }  // ✅ 正确
```

## 修复内容

Commit: `90f690f`
- 重写API使用Vercel标准格式
- 添加详细日志标记 `[stock-quote-simple]`
- 匹配其他工作正常的API结构

## 测试步骤（等待2-3分钟部署后）

### 步骤1：测试API端点

在浏览器Console（F12）执行：

```javascript
// 测试API是否可访问
fetch('https://calmlyinvest.vercel.app/api/stock-quote-simple?symbol=TSLA')
  .then(res => {
    console.log('HTTP状态:', res.status);
    if (res.status === 404) {
      console.log('❌ 仍然404，等待Vercel部署...');
      return null;
    }
    return res.json();
  })
  .then(data => {
    if (!data) return;

    console.log('✅ API响应:', data);
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('股票代码:', data.symbol);
    console.log('公司名称:', data.name);
    console.log('当前价格: $' + data.price);
    console.log('Beta值:', data.beta);
    console.log('━━━━━━━━━━━━━━━━━━━━');

    // 验证是真实数据还是模拟数据
    if (data.price > 200 && data.price < 300 && data.beta > 2.0) {
      console.log('🎉 成功！获取到TSLA真实数据！');
    } else {
      console.log('⚠️ 数据可能不准确');
    }
  })
  .catch(err => console.error('❌ 错误:', err));
```

**预期结果**：
```
HTTP状态: 200
✅ API响应: {symbol: "TSLA", name: "Tesla, Inc.", price: 242.84, beta: 2.34, ...}
━━━━━━━━━━━━━━━━━━━━
股票代码: TSLA
公司名称: Tesla, Inc.
当前价格: $242.84
Beta值: 2.34
━━━━━━━━━━━━━━━━━━━━
🎉 成功！获取到TSLA真实数据！
```

### 步骤2：清除旧数据

```javascript
// 删除所有访客模式的旧股票数据
localStorage.removeItem('guest_stocks');
console.log('✅ 已清除旧数据，刷新页面...');
location.reload();
```

### 步骤3：添加TSLA

1. 点击"添加持仓" → "股票"
2. 填写：
   - 股票代码：`TSLA`
   - 数量：`1`
   - 成本价：`280`
3. 提交

### 步骤4：检查Console日志

应该看到：
```
Fetching quote for TSLA...
Quote received for TSLA: {symbol: "TSLA", name: "Tesla, Inc.", price: 242.84, beta: 2.34, ...}
Final data with API quote: {currentPrice: "242.84", beta: "2.34", name: "Tesla, Inc.", ...}
```

**不应该看到**：
- ❌ `API returned status 404`
- ❌ `Failed to fetch stock quote, using fallback values`

### 步骤5：验证表格数据

在持仓表格中检查TSLA：
- ✅ 当前价应该是真实市价（$240-250范围）
- ✅ Beta应该是2.3+（不是1.00）
- ✅ 名称应该是"Tesla, Inc."（不是"TSLA"）

## 如果还是404

等待5分钟后，在Vercel dashboard检查：
1. 访问 https://vercel.com/your-project/deployments
2. 确认最新commit `90f690f` 已部署
3. 检查部署日志是否有错误
4. 如需要，手动触发重新部署

## 如果API返回500

查看Vercel函数日志：
1. 进入Vercel dashboard → Functions
2. 找到 `stock-quote-simple` 函数
3. 查看运行日志
4. 检查是否有 `yahoo-finance2` 依赖错误

## 预期的成功标志

✅ HTTP 200状态
✅ 真实TSLA价格（约$240-250）
✅ 真实Beta值（约2.3）
✅ 公司全称 "Tesla, Inc."
✅ Console无错误日志
✅ 表格正确显示数据

## 技术细节

**Vercel Serverless Functions要求**：
- 必须使用 `export default async function handler()`
- 不能使用HOC wrapper模式
- CORS headers需要在handler内部设置
- 依赖必须在package.json中声明

**本次修复**：
1. 改用标准export格式
2. 内联CORS设置
3. 添加详细日志前缀
4. 根目录已有package.json包含yahoo-finance2

Commit: `90f690f`
