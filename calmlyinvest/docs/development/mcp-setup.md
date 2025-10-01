# 🔌 Supabase MCP 安装配置指南

## 📋 概述

本指南将帮助您在 Cursor 中安装和配置 Supabase MCP 服务器，让您可以直接在 AI 对话中操作 Supabase 数据库。

## 🔑 您的配置信息

- **项目 URL**: `https://hsfthqchyupkbmazcuis.supabase.co`
- **项目 Ref**: `hsfthqchyupkbmazcuis`
- **访问令牌**: `sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3`

## 📝 安装步骤

### 第1步：打开 Cursor 设置

1. 在 Cursor 中按 `Cmd + ,` (macOS) 或 `Ctrl + ,` (Windows/Linux)
2. 或者点击菜单栏中的 `Cursor → Settings`

### 第2步：导航到 MCP 设置

1. 在设置界面左侧找到并点击 `MCP`
2. 您会看到 "Add the following configuration:" 的界面

### 第3步：添加配置

将以下配置复制并粘贴到配置区域：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=hsfthqchyupkbmazcuis"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3"
      }
    }
  }
}
```

### 第4步：保存配置

1. 点击 "Save the configuration file" 按钮
2. 配置文件将被保存到您的系统中

### 第5步：验证连接

1. 保存配置后，Cursor 会自动尝试连接 MCP 服务器
2. 在 `Settings → MCP` 页面中，您应该看到绿色的活跃状态指示器
3. 显示 "Successfully connected" 表示连接成功

## 🎯 功能特点

### 启用的功能
✅ **只读访问** - 安全的数据查询模式  
✅ **表结构查询** - 查看所有表和字段信息  
✅ **数据查询** - 执行 SELECT 查询  
✅ **索引信息** - 查看数据库索引状态  
✅ **关系查询** - 理解表之间的关系  

### 安全限制
🔒 **只读模式** - 无法执行 INSERT/UPDATE/DELETE 操作  
🔒 **行级安全** - 遵循 Supabase RLS 策略  
🔒 **权限控制** - 仅访问令牌允许的资源  

## 🧪 测试连接

安装完成后，您可以在 Cursor 的 AI 对话中测试：

### 基础查询测试
```
请查询 portfolios 表的结构
```

### 数据查询测试
```
查询用户 279838958@qq.com 的持仓信息
```

### 表关系测试
```
显示所有表之间的关系
```

## 🔧 故障排除

### 连接失败
如果看到红色状态或连接失败：

1. **检查网络连接**
   - 确保能正常访问 `https://hsfthqchyupkbmazcuis.supabase.co`

2. **验证令牌**
   - 确认访问令牌 `sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3` 是否有效
   - 检查令牌是否有足够权限

3. **重新安装包**
   ```bash
   npm cache clean --force
   npx -y @supabase/mcp-server-supabase@latest --version
   ```

4. **重启 Cursor**
   - 完全关闭 Cursor
   - 重新打开应用

### 权限问题
如果遇到权限错误：

1. **检查 RLS 策略**
   - 确保数据库表的 RLS 策略正确设置

2. **验证项目权限**
   - 在 Supabase 控制台检查 API 设置
   - 确认项目 ID 正确

## 📊 使用示例

### 查询持仓数据
```
请帮我查询当前所有的股票持仓，包括数量和当前价格
```

### 分析风险指标
```
查询最新的风险指标数据，并分析当前的风险状况
```

### 检查数据完整性
```
验证用户 279838958@qq.com 的数据是否完整
```

## 🔄 更新 MCP 服务器

要更新到最新版本：

1. 在 Cursor 设置中暂时禁用 MCP 配置
2. 清除缓存：
   ```bash
   npm cache clean --force
   ```
3. 重新启用配置，系统会自动下载最新版本

## 🎉 完成！

现在您已经成功配置了 Supabase MCP 服务器！您可以：

- ✅ 在 AI 对话中直接查询数据库
- ✅ 分析持仓和风险数据  
- ✅ 验证数据完整性
- ✅ 获取实时的数据库信息

有任何问题随时询问！ 🚀 