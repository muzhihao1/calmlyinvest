# 系统当前状态

## 更新日期：2025-07-15

### ✅ 已完成的工作

1. **移除所有硬编码账号**
   - 删除了系统中所有 279838958@qq.com 相关的代码
   - 系统现在是完全通用的，没有任何特定用户信息

2. **修复注册功能**
   - 创建了 `fix-registration-complete.sql` 脚本
   - 新用户注册后会自动创建默认投资组合（100万初始资金）
   - 自动设置默认风险参数

3. **优化访客模式**
   - 访客模式下使用 "demo-portfolio-1" 作为默认组合ID
   - 访客可以添加、编辑、删除股票和期权持仓（数据保存在内存中）
   - 退出登录后自动进入访客模式

4. **改进认证流程**
   - 无会话时自动使用访客模式
   - 支持 Supabase 邮箱验证流程

### 📋 当前功能状态

#### 访客模式（无需登录）
- ✅ 查看示例投资组合
- ✅ 添加股票持仓
- ✅ 添加期权持仓
- ✅ 编辑/删除持仓
- ✅ 风险计算和分析
- ✅ 数据导入/导出
- ⚠️ 数据仅保存在浏览器内存中，刷新页面会丢失

#### 注册用户模式
- ✅ 邮箱注册（需要邮箱验证）
- ✅ 自动创建初始投资组合
- ✅ 数据永久保存在数据库
- ✅ 支持多设备同步
- ✅ 完整的增删改查功能

### 🔧 技术细节

1. **访客模式实现**
   - 使用 `guest-user` 作为用户ID
   - 使用 `demo-portfolio-1` 作为组合ID
   - 数据存储在 `server/storage-guest.ts` 的内存数组中

2. **认证机制**
   - Supabase Auth 处理用户认证
   - 访客模式使用 "Bearer guest-mode" 作为授权头
   - 后端自动识别并路由到相应的存储层

3. **数据隔离**
   - 使用 Supabase RLS（行级安全）确保用户数据隔离
   - 每个用户只能访问自己的数据

### 🚀 使用指南

1. **快速体验（访客模式）**
   - 直接访问 https://calmlyinvest.vercel.app
   - 点击"使用演示账号登录"
   - 所有功能都可以使用，但数据不会永久保存

2. **正式使用（注册账号）**
   - 点击"注册"创建新账号
   - 查看邮箱并验证
   - 登录后数据会永久保存

### ⚠️ 注意事项

- Supabase Pro 版本已配置，注册限制为每小时 10 次
- 邮箱验证是必需的（保持 Supabase 默认设置）
- 访客模式的数据在页面刷新后会重置为初始示例数据

### 📝 待优化项

1. 考虑添加 OAuth 登录（Google、GitHub）减轻邮箱注册压力
2. 可以考虑将访客模式数据保存到 localStorage
3. 添加数据迁移功能（从访客模式迁移到注册用户）