# Update Portfolio Financial Data

## 财务数据 (From Robinhood - 2025-10-01)

根据您的Robinhood账户截图，提取的财务数据如下：

| 字段 | 英文名称 | 数值 (USD) |
|------|---------|-----------|
| 清算价值 | Net Liquidation Value | **58,885.17** |
| 现金余额 | Cash | **14,137.43** |
| 维持保证金 | Maintenance Margin | **43,760.93** |
| 买入力 | Buying Power | 65,751.25 |
| 市场价值 | Market Value | 44,770.32 |

## 方法一：使用 Supabase SQL Editor (推荐)

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧菜单的 "SQL Editor"
4. 创建新查询并粘贴以下SQL：

```sql
UPDATE portfolios
SET
  total_equity = 58885.17,
  cash_balance = 14137.43,
  margin_used = 43760.93,
  updated_at = NOW()
WHERE id = '186ecd89-e268-43c4-b3d5-3441a2082cf5';
```

5. 点击 "Run" 执行
6. 验证更新：

```sql
SELECT
  id,
  name,
  total_equity,
  cash_balance,
  margin_used,
  updated_at
FROM portfolios
WHERE id = '186ecd89-e268-43c4-b3d5-3441a2082cf5';
```

## 方法二：使用 API (需要认证)

如果您有有效的认证token，可以通过API更新：

```bash
curl -X PUT "https://calmlyinvest.vercel.app/api/portfolio-details-simple?portfolioId=186ecd89-e268-43c4-b3d5-3441a2082cf5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "totalEquity": "58885.17",
    "cashBalance": "14137.43",
    "marginUsed": "43760.93"
  }'
```

## 更新说明

### 已完成的工作

1. ✅ 修改了 `api/portfolio-details-simple.ts`
   - 现在从数据库读取真实的portfolio数据
   - 支持GET方法获取portfolio详情
   - 支持PUT方法更新portfolio财务数据
   - 实现了完整的认证和权限验证

2. ✅ 数据库表结构确认
   - `portfolios` 表有以下字段：
     - `total_equity` (NUMERIC) - 总权益/清算价值
     - `cash_balance` (NUMERIC) - 现金余额
     - `margin_used` (NUMERIC) - 已用保证金

3. ✅ 批量导入持仓数据完成
   - 13只股票已导入
   - 4个期权已导入

### 数据映射

| Robinhood字段 | 数据库字段 | 数值 |
|--------------|----------|------|
| Net Liquidation Value | total_equity | 58,885.17 |
| Cash | cash_balance | 14,137.43 |
| Maintenance Margin | margin_used | 43,760.93 |

### 验证步骤

更新完成后，访问 https://calmlyinvest.vercel.app 并刷新页面：

1. 检查 Portfolio 总览显示的数值
2. 确认清算价值 = **58,885.17 USD**
3. 确认现金余额 = **14,137.43 USD**
4. 确认保证金使用 = **43,760.93 USD**

## 技术细节

### API端点更新

`portfolio-details-simple.ts` 现在支持：

- **GET** `/api/portfolio-details-simple?portfolioId={id}`
  - 从数据库获取portfolio详情
  - 需要认证
  - 验证用户权限

- **PUT** `/api/portfolio-details-simple?portfolioId={id}`
  - 更新portfolio财务数据
  - 需要认证
  - 验证用户权限
  - 支持更新: name, totalEquity, cashBalance, marginUsed

### 认证流程

1. 使用 anon key + JWT token 验证用户身份
2. 使用 service role key 创建 admin client
3. 验证 portfolio 归属
4. 执行数据库操作
5. 返回 camelCase 格式数据给前端

## 下一步

更新完财务数据后，应用将：
- 自动计算杠杆率
- 更新风险指标
- 显示准确的资产配置
- 提供基于真实数据的风险建议
