# 访客模式测试步骤

## 问题诊断

您遇到的两个问题：
1. ✅ **删除失败（500错误）** - 已修复
2. ⚠️ **TSLA显示模拟数据（$100, beta 1.00）** - 需要等待Vercel重新部署

## 测试前准备：清除旧数据

在浏览器控制台（F12 → Console）执行以下代码来清除访客模式的旧数据：

```javascript
// 清除所有访客模式数据
localStorage.removeItem('guest_stocks');
localStorage.removeItem('guest_options');
localStorage.removeItem('guest_portfolio_settings');

console.log('✅ 访客模式数据已清除');

// 刷新页面
location.reload();
```

## 测试步骤

### 第1步：验证初始状态

访客登录后，检查：
- ✅ 现金余额应该是 **$0**（不是 $5000）
- ✅ 股票持仓为空
- ✅ 总权益为 **$0**

### 第2步：添加现金

1. 点击现金余额旁边的编辑按钮
2. 输入金额（例如：10000）
3. 保存
4. 确认现金余额更新为 $10,000

### 第3步：测试添加TSLA

1. 点击"添加持仓"按钮
2. 选择"股票"
3. 填写信息：
   - 股票代码：TSLA
   - 数量：1
   - 成本价：280
4. 提交

**预期结果**：
- ✅ 当前价格应该是**真实的TSLA市价**（不是 $100）
- ✅ Beta值应该是**真实的Beta**（不是 1.00）
- ✅ 股票名称应该是 "Tesla, Inc."（不是 "TSLA Corp."）

**如果还是显示模拟数据**：
说明Vercel还未重新部署最新代码。请等待几分钟后刷新页面再试。

### 第4步：测试删除功能

1. 点击TSLA行的删除按钮（垃圾桶图标）
2. 确认删除

**预期结果**：
- ✅ 应该显示"删除成功"提示
- ✅ TSLA从表格中消失
- ✅ **不应该**出现500错误或"删除失败"提示

### 第5步：测试编辑功能

1. 重新添加TSLA（或其他股票）
2. 点击编辑按钮（铅笔图标）
3. 修改数量
4. 保存

**预期结果**：
- ✅ 更新成功
- ✅ 市值和盈亏重新计算

## 验证API是否已部署

在浏览器控制台执行：

```javascript
// 测试stock-quote-simple API
fetch('https://calmlyinvest.vercel.app/api/stock-quote-simple?symbol=TSLA')
  .then(res => res.json())
  .then(data => {
    console.log('TSLA Quote API Response:', data);

    if (data.price === 100 && data.beta === 1.0) {
      console.log('⚠️ 还在使用模拟数据，等待Vercel重新部署...');
    } else {
      console.log('✅ API已更新！价格:', data.price, 'Beta:', data.beta);
    }
  })
  .catch(err => console.error('❌ API调用失败:', err));
```

## 如果问题持续

如果等待10分钟后API还是返回模拟数据：

1. 检查Vercel部署状态：https://vercel.com/your-project/deployments
2. 确认最新commit `917f297` 已部署
3. 手动触发重新部署（在Vercel dashboard → Deployments → Redeploy）

## 成功标志

所有测试通过后，您应该看到：
- ✅ 初始现金 $0
- ✅ TSLA显示真实价格（约$300-400）
- ✅ Beta显示真实值（约1.3-1.5）
- ✅ 删除功能正常工作
- ✅ 无500或401错误

## 技术细节

**已修复的问题**：

1. **stock-quote-simple.ts**:
   - 从硬编码mock data改为调用真实Yahoo Finance API
   - 所有股票都会获取实时价格和Beta

2. **holdings-table.tsx**:
   - 添加访客模式检测
   - 访客模式直接操作localStorage，不调用API
   - 避免认证错误

3. **dashboard.tsx**:
   - 初始现金从$5000改为$0
   - 传递isGuest参数给HoldingsTable

Commit: `db049c6`
