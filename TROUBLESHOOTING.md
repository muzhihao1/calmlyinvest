# 🔧 故障排除指南 - 持仓数据不显示问题

## 问题描述
用户 279838958@qq.com 登录后看不到持仓数据，即使数据已经成功添加到数据库。

## 可能的原因

### 1. ❌ 登录状态问题
- **症状**: 数据存在但前端不显示
- **原因**: 可能登录的不是正确的账号，或者session已过期
- **解决方案**:
  ```javascript
  // 在浏览器控制台检查当前登录用户
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.email);
  ```

### 2. ❌ RLS (Row Level Security) 策略问题
- **症状**: 数据在数据库中存在，但查询返回空
- **原因**: Supabase的RLS策略可能阻止了数据访问
- **解决方案**: 在Supabase控制台检查RLS策略，确保用户可以访问自己的数据

### 3. ❌ 前端缓存问题
- **症状**: 旧数据仍然显示
- **原因**: React Query缓存了旧的查询结果
- **解决方案**:
  ```javascript
  // 强制刷新所有查询
  queryClient.invalidateQueries();
  // 或者完全清除缓存
  queryClient.clear();
  ```

### 4. ❌ API连接问题
- **症状**: 网络请求失败
- **原因**: API endpoint错误或网络问题
- **解决方案**: 检查浏览器控制台的网络请求

## 立即解决方案

### 方法1: 直接在Supabase SQL编辑器运行
1. 登录 [Supabase Dashboard](https://app.supabase.com/project/hsfthqchyupkbmazcuis)
2. 进入 SQL Editor
3. 运行 `scripts/direct-sql-update.sql` 中的代码
4. 刷新应用页面

### 方法2: 检查并修复登录状态
1. 完全退出登录
2. 清除浏览器缓存和cookies
3. 重新登录账号 279838958@qq.com
4. 刷新页面

### 方法3: 浏览器控制台调试
```javascript
// 1. 检查当前用户
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// 2. 直接查询portfolios表
const { data, error } = await supabase
  .from('portfolios')
  .select('*')
  .eq('user_id', user.id);
console.log('Portfolios:', data, 'Error:', error);

// 3. 如果有数据但不显示，强制刷新
window.location.reload(true);
```

## 数据验证清单

✅ **已确认的信息:**
- 用户账号存在: 8e82d664-5ef9-47c1-a540-9af664860a7c
- Portfolio ID: 2
- 股票持仓: 5只 (AMZN, CRWD, PLTR, SHOP, TSLA)
- 期权持仓: 4个 (MSFT, NVDA x2, QQQ)
- 总资产: $44,338.00

## 最终解决方案

如果以上方法都不行，请：

1. **发送以下信息**:
   - 浏览器控制台的错误信息截图
   - 网络请求的截图 (F12 -> Network标签)
   - 当前登录邮箱的截图

2. **临时解决方案**:
   - 使用demo账号查看功能: demo/demo123
   - 或创建新账号测试

## 技术支持联系

如果问题持续存在，这可能是系统问题，需要检查：
- Supabase RLS策略配置
- 前端API调用逻辑
- 用户认证流程