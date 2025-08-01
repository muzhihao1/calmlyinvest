# Vercel API 路由问题分析

## 问题总结
API 端点持续返回 405 Method Not Allowed 错误，表明 Vercel 没有正确识别和路由 serverless functions。

## 问题根因
1. **项目结构问题**: 
   - 项目位于 `calmlyinvest` 子目录中
   - Vercel 默认从仓库根目录查找 API functions
   - 需要配置 Vercel 使用正确的项目根目录

2. **配置冲突**:
   - 存在多个 vercel.json 文件可能导致冲突
   - Functions 路径配置需要考虑子目录结构

## 已尝试的解决方案
1. ✅ 添加 API rewrites 规则
2. ✅ 配置 functions 声明
3. ✅ 在仓库根目录创建 vercel.json 指向子目录
4. ⏳ 等待部署生效

## 下一步行动
1. **验证 Vercel 项目设置**:
   - 确认 Root Directory 设置为 `calmlyinvest`
   - 检查 Build & Development Settings

2. **简化配置**:
   - 考虑将项目移到仓库根目录
   - 或在 Vercel 仪表板中设置正确的根目录

3. **临时解决方案**:
   - 可以先在本地测试功能
   - 使用 `npm run dev` 进行开发

## 技术建议
最佳实践是将项目文件直接放在仓库根目录，避免子目录带来的路由复杂性。