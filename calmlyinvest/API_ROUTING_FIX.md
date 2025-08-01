# API 路由修复报告

## 问题描述
- **症状**: POST 请求到 `/api/portfolio/[id]/stocks` 返回 405 Method Not Allowed
- **原因**: vercel.json 配置的 catch-all 规则拦截了所有请求，包括 API 路由
- **影响**: 无法添加股票、期权等数据操作功能失效

## 根本原因分析
之前的配置：
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
这个配置会将所有请求（包括 /api/* 路径）都重写到 index.html，导致 API serverless 函数无法被正确调用。

## 解决方案
更新 vercel.json 配置，添加 API 路由的显式处理：
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 工作原理
1. **API 路由优先**: `/api/:path*` 规则首先匹配所有 /api 开头的请求
2. **保持原路径**: 将 API 请求保持原样，让 Vercel 的 serverless 函数处理
3. **SPA 回退**: 其他所有请求都重写到 index.html，支持前端路由

## 部署状态
- ✅ 配置已更新并提交
- 🔄 Vercel 正在重新部署
- ⏱️ 预计 2-3 分钟后生效

## 验证步骤
部署完成后：
1. 访问 https://calmlyinvest.vercel.app
2. 使用访客模式或登录
3. 尝试添加股票持仓
4. 确认 POST 请求成功（应返回 200/201 而非 405）

## 技术要点
- Vercel 的 rewrites 规则按顺序匹配
- 第一个匹配的规则会被应用
- API 路由必须在 catch-all 规则之前定义
- `:path*` 语法匹配路径的剩余部分