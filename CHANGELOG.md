# 预算管理系统 Changelog

所有重要的版本变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

### 新增

#### 年度预算编制模块增强

**新增字段** (src/types/index.ts):
- `paymentEntity` - 付款主体
- `group` - 组别
- `accountCode` - 会计科目
- `monthlyQuantities` - 1-12月每月采购数量
- `monthlyAmounts` - 1-12月每月采购金额

**增强功能** (src/pages/BudgetCreateAdvanced.tsx):
- 新增付款主体、组别、会计科目输入列
- 新增1-12月月度金额列（自动计算）
- 自动计算总价和月度金额
- 优化表格布局，添加清晰注释

**新增文档**:
- `docs/BUDGET_CREATION_GUIDE.md` - 年度预算编制使用指南

**单元测试** (src/pages/__tests__/BudgetCreateAdvanced.test.ts):
- 16个测试用例全部通过
- 覆盖计算逻辑、验证逻辑、汇总分析、边界条件

### 修改

### 修复

## [1.0.1] - 2026-03-27

### 修复

#### 前端白屏问题修复

**问题根因**:
- 路由链接与路由配置不匹配
- App.tsx 缺少部分路由挂载
- API 响应格式处理不一致

**修复文件**:

| 文件 | 修复内容 |
|------|----------|
| `src/App.tsx` | 添加 `/users`、`/roles`、`/audit-logs` 路由挂载 |
| `src/components/Layout.tsx` | 修正路由路径：`/budget/summary` → `/budgets/summary`、`/budget-usage` → `/budgets/usage` |

#### API 响应格式统一

所有页面统一使用以下响应解包方式：
```typescript
const responseData = response?.data?.data || response?.data || {}
```

**修复文件**:
- `src/pages/BudgetList.tsx`
- `src/pages/BudgetDetail.tsx`
- `src/pages/BudgetCreateAdvanced.tsx`
- `src/pages/BudgetSummary.tsx`
- `src/pages/Mapping.tsx`
- `src/pages/Approval.tsx`
- `src/pages/PurchaseRequestList.tsx`
- `src/pages/PurchaseRequestDetail.tsx`
- `src/pages/PurchaseRequestCreate.tsx`
- `src/pages/UserManagement.tsx`
- `src/pages/RoleManagement.tsx`
- `src/pages/AuditLog.tsx`
- `src/pages/Settings.tsx`

#### 后端缺失 API 优雅处理

当后端 API 不存在时，前端显示空数据而不是报错：

| 页面 | API 路由 | 状态 |
|------|----------|------|
| 角色管理 | `/api/roles` | ✅ 已处理 |
| 审计日志 | `/api/audit-logs` | ✅ 已处理 |
| 系统设置 | `/api/system/config` | ✅ 已处理 |

**修复文件**:
- `src/pages/RoleManagement.tsx`
- `src/pages/AuditLog.tsx`
- `src/pages/Settings.tsx`

### 已知问题

以下 API 路由后端尚未实现，需要后续开发：
- [ ] `/api/roles` - 角色列表
- [ ] `/api/permissions` - 权限列表
- [ ] `/api/system/config` - 系统配置
- [ ] `/api/audit-logs` - 审计日志

---

## [1.0.0] - 2026-03-27

### 新增

- 初始版本发布
- 完整的预算管理系统前端架构
- NestJS 后端项目初始化
- Prisma 数据库 Schema 设计
