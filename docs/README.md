# 项目文档 / Project Documentation

本目录包含CamlyInvest项目的所有技术文档和指南。

## 目录结构 / Directory Structure

### 📊 analysis/
数据分析和问题诊断报告
- `DATA_MISMATCH_ANALYSIS.md` - IB数据对比分析

### 📖 guides/
操作指南和部署文档  
- `DEPLOYMENT_FIX_GUIDE.md` - Vercel部署500错误修复指南
- `VERCEL_ENV_SETUP.md` - Vercel环境变量配置指南

### 📦 archived/
已归档的历史文档（参考用）
- `FINAL_SUMMARY.md` - 项目整理总结 (2025-10-01)
- `FIX_SUMMARY.md` - 早期修复总结
- `deployment_fix_guide_404.md` - API 404问题修复指南（已过时）

### 🗂️ archived-root-docs/
从根目录迁移的历史文档

## 活跃文档 / Active Documents

### 根目录文档
- `/CLAUDE.md` - AI助手项目指导文档（核心）
- `/README.zh-CN.md` - 中文版README

## 文档维护原则 / Maintenance Guidelines

1. **新建文档**: 根据类型放入对应目录
   - 分析报告 → `analysis/`
   - 操作指南 → `guides/`
   - 临时调试 → 调试完成后归档或删除

2. **归档文档**: 当文档过时但有参考价值时，移至 `archived/`

3. **删除文档**: 完全过时且无参考价值的临时文档可以删除

4. **核心文档**: `/CLAUDE.md` 始终保持在根目录，供AI助手直接访问
