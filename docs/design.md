# 企业级预算管理系统 - 系统设计文档

## 目录

1. [系统架构](#1-系统架构)
2. [技术栈](#2-技术栈)
3. [数据库设计](#3-数据库设计)
4. [API设计](#4-api设计)
5. [认证授权设计](#5-认证授权设计)
6. [审批引擎设计](#6-审批引擎设计)
7. [通知系统设计](#7-通知系统设计)
8. [前端架构](#8-前端架构)

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Web浏览器  │  │   Web浏览器  │  │   Web浏览器  │             │
│  │  (React App)│  │  (React App)│  │  (React App)│             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │ HTTPS
┌──────────────────────────┼─────────────────────────────────────┐
│                         网关层                                   │
│                    ┌──────────┐                                 │
│                    │   Nginx  │  (反向代理、静态资源、负载均衡)    │
│                    └────┬─────┘                                 │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                         应用层                                   │
│              ┌──────────┴──────────┐                           │
│              │    NestJS Backend   │                           │
│              │  (RESTful API + WS) │                           │
│              └──────────┬──────────┘                           │
└─────────────────────────┼───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────┴─────┐  ┌──────┴──────┐  ┌─────┴──────┐
│   数据层       │  │   缓存层     │  │  消息队列   │
│  PostgreSQL   │  │    Redis    │  │   BullMQ   │
│   (主从复制)   │  │  (Session/  │  │  (异步任务) │
│               │  │   Cache)    │  │            │
└───────────────┘  └─────────────┘  └────────────┘
```

### 1.2 架构特点

- **前后端分离**：前端React SPA，后端NestJS RESTful API
- **模块化单体**：后端采用模块化设计，便于后续拆分微服务
- **无状态服务**：服务端不保存会话状态，支持水平扩展
- **事件驱动**：审批流程、通知等使用事件机制解耦

---

## 2. 技术栈

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| React | 18.3.1 | UI框架 |
| TypeScript | 5.4.2 | 类型安全 |
| Vite | 5.4.1 | 构建工具 |
| Ant Design | 6.3.4 | UI组件库 |
| React Router | 6.22.0 | 路由管理 |
| Zustand | 4.5.0 | 状态管理 |
| React Query | 5.95.2 | 服务端状态管理 |
| Axios | 1.13.6 | HTTP客户端 |
| Socket.IO Client | 4.8.3 | WebSocket通信 |
| ECharts | 6.0.0 | 图表库 |
| ExcelJS | 4.4.0 | Excel处理 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| NestJS | 10.x | 后端框架 |
| TypeScript | 5.1.3 | 类型安全 |
| Prisma | 5.x | ORM/数据库访问 |
| PostgreSQL | 16 | 主数据库 |
| Redis | 7 | 缓存/Session |
| Passport | 0.6.0 | 认证中间件 |
| JWT | 10.x | Token认证 |
| Socket.IO | 10.4.22 | WebSocket服务 |
| BullMQ | 4.x | 消息队列 |
| Nodemailer | 6.10.1 | 邮件服务 |
| MinIO | latest | 对象存储 |
| Winston | 3.8.0 | 日志框架 |

### 2.3 基础设施

| 技术 | 用途 |
|-----|------|
| Docker | 容器化部署 |
| Docker Compose | 本地/测试环境编排 |
| Nginx | 反向代理、静态资源服务 |
| GitHub Actions | CI/CD（可选） |

---

## 3. 数据库设计

### 3.1 ER图描述

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户与权限模块                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │   User   │◄──►│ UserRole │◄──►│   Role   │◄──►│RolePermis│◄──┐      │
│  └────┬─────┘    └──────────┘    └────┬─────┘    └──────────┘   │      │
│       │                               │                         │      │
│       ▼                               │                    ┌────┴────┐ │
│  ┌──────────┐                         │                    │Permissio│ │
│  │Departmen │◄────────────────────────┘                    └─────────┘ │
│  └────┬─────┘                                                          │
└───────┼─────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              预算管理模块                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐                  │
│  │  Budget  │◄──►│BudgetItem│    │BudgetAdjustmen   │                  │
│  └────┬─────┘    └──────────┘    └──────────────────┘                  │
│       │                                                                │
│       │ 1:N                                                            │
│       ▼                                                                │
│  ┌──────────────────┐                                                  │
│  │ PurchaseRequest  │                                                  │
│  └────────┬─────────┘                                                  │
│           │ 1:N                                                        │
│           ▼                                                            │
│  ┌──────────────────┐                                                  │
│  │  PurchaseItem    │                                                  │
│  └──────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │
┌───────┼─────────────────────────────────────────────────────────────────┐
│       │                        工作流模块                                │
│       │  ┌──────────────────┐    ┌──────────────────┐                  │
│       └──►│  ApprovalFlow    │◄──►│  ApprovalStep    │                  │
│           └──────────────────┘    └──────────────────┘                  │
│           ▲                                                            │
│           │                                                            │
│  ┌────────┴──────────┐                                                │
│  │  WorkflowTemplate │                                                │
│  └───────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          导入导出与三单匹配                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │PurchaseOrder │  │  Settlement  │  │ DataMapping  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          通知与审计模块                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Notification │  │   AuditLog   │  │ Attachment   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 核心数据模型

#### 3.2.1 User（用户）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| username | String | Unique | 用户名 |
| password | String | - | bcrypt哈希密码 |
| name | String | - | 真实姓名 |
| email | String | Unique, Nullable | 邮箱 |
| phone | String | Nullable | 电话 |
| avatar | String | Nullable | 头像URL |
| status | UserStatus | Default: ACTIVE | 状态 |
| departmentId | String | FK | 所属部门 |
| roles | UserRole[] | 关联 | 角色列表 |
| createdAt | DateTime | - | 创建时间 |
| updatedAt | DateTime | - | 更新时间 |
| lastLoginAt | DateTime | Nullable | 最后登录时间 |
| loginAttempts | Int | Default: 0 | 登录失败次数 |

**索引：** username, email, departmentId

#### 3.2.2 Role（角色）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| name | String | Unique | 角色编码 |
| displayName | String | - | 显示名称 |
| description | String | Nullable | 描述 |
| isSystem | Boolean | Default: false | 系统内置 |
| permissions | RolePermission[] | 关联 | 权限列表 |
| users | UserRole[] | 关联 | 用户列表 |

**索引：** name

#### 3.2.3 Permission（权限）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| module | String | - | 模块名 |
| action | String | - | 操作类型 |
| name | String | Unique | 权限编码 |
| roles | RolePermission[] | 关联 | 角色列表 |

**索引：** module, name

#### 3.2.4 Department（部门）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| name | String | - | 部门名称 |
| code | String | Unique | 部门编码 |
| level | Int | - | 层级（1/2/3） |
| parentId | String | FK, Nullable | 父部门ID |
| parent | Department | 自关联 | 父部门 |
| children | Department[] | 自关联 | 子部门 |
| managerId | String | Nullable | 负责人ID |
| budgetAdminId | String | Nullable | 预算管理员ID |
| users | User[] | 关联 | 用户列表 |
| budgets | Budget[] | 关联 | 预算列表 |
| sortOrder | Int | Default: 0 | 排序 |
| status | DeptStatus | Default: ACTIVE | 状态 |
| createdAt | DateTime | - | 创建时间 |
| updatedAt | DateTime | - | 更新时间 |

**索引：** code, parentId

#### 3.2.5 Budget（预算单）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| budgetNo | String | Unique | 预算编号（BG-2026-001） |
| name | String | - | 预算名称 |
| departmentId | String | FK | 所属部门 |
| department | Department | 关联 | 部门 |
| type | BudgetType | - | OPEX/CAPEX |
| year | Int | - | 预算年度 |
| version | Int | Default: 1 | 版本号 |
| parentId | String | Nullable | 调整前版本ID |
| totalAmount | Decimal | - | 预算总额 |
| usedAmount | Decimal | Default: 0 | 已使用金额 |
| frozenAmount | Decimal | Default: 0 | 冻结金额 |
| status | BudgetStatus | Default: DRAFT | 状态 |
| items | BudgetItem[] | 关联 | 预算明细 |
| approvals | ApprovalFlow[] | 关联 | 审批流程 |
| purchases | PurchaseRequest[] | 关联 | 采购申请 |
| adjustments | BudgetAdjustment[] | 关联 | 调整记录 |
| creatorId | String | - | 创建人ID |
| remark | String | Nullable | 备注 |
| createdAt | DateTime | - | 创建时间 |
| updatedAt | DateTime | - | 更新时间 |

**索引：** budgetNo, departmentId, year, status

#### 3.2.6 BudgetItem（预算明细）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| budgetId | String | FK | 预算单ID |
| budget | Budget | 关联 | 预算单 |
| name | String | - | 项目名称 |
| category | String | - | 费用类别 |
| specification | String | Nullable | 规格型号 |
| function | String | Nullable | 功能描述 |
| unitPrice | Decimal | - | 单价 |
| quantity | Int | - | 数量 |
| totalAmount | Decimal | - | 合计金额 |
| usedAmount | Decimal | Default: 0 | 已使用金额 |
| frozenAmount | Decimal | Default: 0 | 冻结金额 |
| monthlyPlan | Json | Nullable | 月度计划 |
| project | String | Nullable | 所属项目 |
| purpose | String | Nullable | 用途说明 |
| supplier | String | Nullable | 供应商 |
| deliveryDate | DateTime | Nullable | 交付日期 |
| sortOrder | Int | Default: 0 | 排序 |

**索引：** budgetId

#### 3.2.7 PurchaseRequest（采购申请）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| requestNo | String | Unique | 申请编号（PR-2026-001） |
| applicantId | String | - | 申请人ID |
| departmentId | String | - | 部门ID |
| budgetId | String | FK | 关联预算ID |
| budget | Budget | 关联 | 预算单 |
| budgetItemId | String | Nullable | 关联预算明细ID |
| items | PurchaseItem[] | 关联 | 采购明细 |
| totalAmount | Decimal | - | 总金额 |
| purpose | String | - | 用途说明 |
| urgencyLevel | UrgencyLevel | Default: NORMAL | 紧急程度 |
| status | PurchaseStatus | Default: DRAFT | 状态 |
| currentStep | Int | Default: 0 | 当前审批步骤 |
| approvals | ApprovalFlow[] | 关联 | 审批流程 |
| attachments | Attachment[] | 关联 | 附件 |
| createdAt | DateTime | - | 创建时间 |
| updatedAt | DateTime | - | 更新时间 |

**索引：** requestNo, budgetId, status

#### 3.2.8 ApprovalFlow（审批流程）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| templateId | String | Nullable | 模板ID |
| targetType | String | - | BUDGET/PURCHASE/ADJUSTMENT |
| budgetId | String | Nullable | FK |
| purchaseId | String | Nullable | FK |
| budget | Budget | 关联 | 预算单 |
| purchase | PurchaseRequest | 关联 | 采购申请 |
| steps | ApprovalStep[] | 关联 | 审批步骤 |
| currentStep | Int | Default: 1 | 当前步骤序号 |
| status | ApprovalStatus | Default: PENDING | 状态 |
| createdAt | DateTime | - | 创建时间 |
| completedAt | DateTime | Nullable | 完成时间 |

**索引：** budgetId, purchaseId, status

#### 3.2.9 ApprovalStep（审批步骤）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| flowId | String | FK | 流程ID |
| flow | ApprovalFlow | 关联 | 审批流程 |
| stepOrder | Int | - | 步骤序号 |
| stepName | String | - | 步骤名称 |
| approverId | String | Nullable | 审批人ID |
| approverRole | String | Nullable | 审批角色 |
| action | ApprovalAction | Nullable | APPROVE/REJECT/WITHDRAW |
| comment | String | Nullable | 审批意见 |
| operatedAt | DateTime | Nullable | 操作时间 |

**索引：** flowId, approverId

#### 3.2.10 Notification（通知）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| userId | String | - | 接收用户ID |
| type | NotificationType | - | 通知类型 |
| title | String | - | 标题 |
| content | String | - | 内容 |
| link | String | Nullable | 跳转链接 |
| isRead | Boolean | Default: false | 是否已读 |
| channels | String[] | - | 通知渠道 |
| createdAt | DateTime | - | 创建时间 |

**索引：** userId, isRead

#### 3.2.11 AuditLog（审计日志）

| 字段 | 类型 | 约束 | 说明 |
|-----|------|-----|------|
| id | String | PK, UUID | 主键 |
| userId | String | - | 操作用户ID |
| userName | String | - | 操作用户名 |
| action | String | - | 操作类型 |
| module | String | - | 模块 |
| targetType | String | Nullable | 对象类型 |
| targetId | String | Nullable | 对象ID |
| oldValue | Json | Nullable | 旧值 |
| newValue | Json | Nullable | 新值 |
| ip | String | Nullable | IP地址 |
| userAgent | String | Nullable | 用户代理 |
| createdAt | DateTime | - | 创建时间 |

**索引：** userId, module, createdAt

### 3.3 枚举类型

| 枚举名 | 值 |
|-------|---|
| UserStatus | ACTIVE, DISABLED, LOCKED |
| DeptStatus | ACTIVE, INACTIVE |
| BudgetType | OPEX, CAPEX |
| BudgetStatus | DRAFT, PENDING, APPROVED, REJECTED, ADJUSTED, CLOSED |
| AdjustStatus | PENDING, APPROVED, REJECTED |
| PurchaseStatus | DRAFT, PENDING, IN_APPROVAL, APPROVED, REJECTED, CANCELLED |
| UrgencyLevel | LOW, NORMAL, HIGH, URGENT |
| ApprovalStatus | PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED |
| ApprovalAction | APPROVE, REJECT, WITHDRAW |
| MatchStatus | FULL, PARTIAL, NONE |
| NotificationType | APPROVAL_PENDING, APPROVAL_RESULT, BUDGET_WARNING, BUDGET_OVERRUN, SYSTEM, REPORT_READY |

### 3.4 索引策略

| 表名 | 索引字段 | 索引类型 | 用途 |
|-----|---------|---------|------|
| User | username | Unique | 登录查询 |
| User | email | Unique | 邮箱查询 |
| User | departmentId | B-Tree | 部门用户查询 |
| Role | name | Unique | 角色查询 |
| Permission | module | B-Tree | 模块权限查询 |
| Department | code | Unique | 部门编码查询 |
| Department | parentId | B-Tree | 树形结构查询 |
| Budget | budgetNo | Unique | 编号查询 |
| Budget | departmentId | B-Tree | 部门预算查询 |
| Budget | year | B-Tree | 年度查询 |
| Budget | status | B-Tree | 状态筛选 |
| BudgetItem | budgetId | B-Tree | 预算明细查询 |
| PurchaseRequest | requestNo | Unique | 编号查询 |
| PurchaseRequest | budgetId | B-Tree | 预算关联查询 |
| PurchaseRequest | status | B-Tree | 状态筛选 |
| ApprovalFlow | budgetId | B-Tree | 预算审批查询 |
| ApprovalFlow | purchaseId | B-Tree | 采购审批查询 |
| ApprovalFlow | status | B-Tree | 状态筛选 |
| ApprovalStep | flowId | B-Tree | 流程步骤查询 |
| Notification | userId | B-Tree | 用户通知查询 |
| Notification | isRead | B-Tree | 未读筛选 |
| AuditLog | userId | B-Tree | 用户操作查询 |
| AuditLog | module | B-Tree | 模块查询 |
| AuditLog | createdAt | B-Tree | 时间范围查询 |

---

## 4. API设计

### 4.1 认证授权模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| POST | /auth/login | 用户登录 | 公开 |
| POST | /auth/register | 用户注册 | 公开 |
| POST | /auth/refresh | 刷新Token | 公开 |
| POST | /auth/password | 修改密码 | 已登录 |
| POST | /auth/logout | 用户登出 | 已登录 |

### 4.2 用户管理模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /users | 用户列表 | admin |
| GET | /users/:id | 用户详情 | admin |
| POST | /users | 创建用户 | admin |
| PUT | /users/:id | 更新用户 | admin |
| DELETE | /users/:id | 删除用户 | admin |
| POST | /users/:id/reset-password | 重置密码 | admin |

### 4.3 部门管理模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /departments | 部门列表 | 已登录 |
| GET | /departments/tree | 部门树 | 已登录 |
| GET | /departments/:id | 部门详情 | 已登录 |
| POST | /departments | 创建部门 | admin |
| PUT | /departments/:id | 更新部门 | admin |
| DELETE | /departments/:id | 删除部门 | admin |

### 4.4 预算管理模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /budgets | 预算列表 | 已登录 |
| GET | /budgets/:id | 预算详情 | 已登录 |
| POST | /budgets | 创建预算 | dept_head, budget_manager, admin |
| PUT | /budgets/:id | 更新预算 | 已登录 |
| DELETE | /budgets/:id | 删除预算 | 已登录 |
| POST | /budgets/:id/submit | 提交审批 | 已登录 |

### 4.5 采购管理模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /purchases | 采购申请列表 | 已登录 |
| GET | /purchases/:id | 采购申请详情 | 已登录 |
| POST | /purchases | 创建采购申请 | purchaser, dept_head, admin |
| PUT | /purchases/:id | 更新采购申请 | 已登录 |
| DELETE | /purchases/:id | 删除采购申请 | 已登录 |
| POST | /purchases/:id/submit | 提交审批 | 已登录 |

### 4.6 审批工作流模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /api/workflows | 流程模板列表 | 已登录 |
| POST | /api/workflows | 创建流程模板 | admin |
| GET | /api/approvals | 待审批列表 | 已登录 |
| GET | /api/approvals/my | 我发起的审批 | 已登录 |
| GET | /api/approvals/:id | 审批详情 | 已登录 |
| POST | /api/approvals/:id/approve | 批准 | 已登录 |
| POST | /api/approvals/:id/reject | 拒绝 | 已登录 |
| POST | /api/approvals/:id/withdraw | 撤回 | 已登录 |

### 4.7 报表分析模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /analysis/dashboard | 仪表盘数据 | 已登录 |
| GET | /analysis/department-ranking | 部门排名 | 已登录 |
| GET | /analysis/monthly-trend | 月度趋势 | 已登录 |
| GET | /analysis/category-analysis | 类别分析 | 已登录 |
| GET | /analysis/budget-summary | 预算汇总 | 已登录 |
| GET | /analysis/budget-usage/:id | 预算使用追踪 | 已登录 |
| GET | /analysis/export/budgets | 导出预算报表 | finance, admin |

### 4.8 导入导出模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /budgets | 导出预算报表 | finance, admin |
| GET | /purchases | 导出采购报表 | finance, admin |
| POST | /import/purchase-orders | 导入采购订单 | finance, admin |
| POST | /import/settlements | 导入结算单 | finance, admin |
| GET | /import/templates/:type | 下载导入模板 | 已登录 |
| GET | /mappings | 三单匹配列表 | finance, admin |
| GET | /mappings/:id | 匹配详情 | finance, admin |
| POST | /mappings/auto-match | 自动匹配 | finance, admin |
| PUT | /mappings/:id | 手动关联 | finance, admin |

### 4.9 通知模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /api/notifications | 通知列表 | 已登录 |
| PUT | /api/notifications/:id/read | 标记已读 | 已登录 |
| PUT | /api/notifications/read-all | 全部已读 | 已登录 |
| GET | /api/notifications/unread-count | 未读数量 | 已登录 |

### 4.10 审计日志模块

| 方法 | 路径 | 功能 | 权限 |
|-----|------|-----|------|
| GET | /api/audit-logs | 日志查询 | admin |
| GET | /api/audit-logs/stats | 统计信息 | admin |
| GET | /api/audit-logs/export | 导出日志 | admin |

---

## 5. 认证授权设计

### 5.1 JWT认证流程

```
┌─────────┐                    ┌─────────────┐                    ┌─────────┐
│  Client │                    │   Server    │                    │  DB     │
└────┬────┘                    └──────┬──────┘                    └────┬────┘
     │                                │                                │
     │ POST /auth/login               │                                │
     │ {username, password}           │                                │
     │───────────────────────────────>│                                │
     │                                │                                │
     │                                │ 验证用户凭证                    │
     │                                │───────────────────────────────>│
     │                                │<───────────────────────────────│
     │                                │                                │
     │                                │ 生成JWT Token                  │
     │                                │ - Access Token (7天)           │
     │                                │ - Refresh Token (30天)         │
     │                                │                                │
     │ {token, refreshToken, user}    │                                │
     │<───────────────────────────────│                                │
     │                                │                                │
     │ 存储Token到localStorage        │                                │
     │                                │                                │
     │ ═══════════════════════════════════════════════════════════════│
     │                                │                                │
     │ 后续请求携带Authorization头    │                                │
     │ Authorization: Bearer <token>  │                                │
     │───────────────────────────────>│                                │
     │                                │                                │
     │                                │ 验证Token                      │
     │                                │ 解析用户信息                   │
     │                                │                                │
     │ 返回数据                       │                                │
     │<───────────────────────────────│                                │
```

### 5.2 JWT Token结构

**Payload示例：**
```json
{
  "username": "zhangsan",
  "sub": "user-uuid",
  "departmentId": "dept-uuid",
  "roles": ["dept_head", "purchaser"],
  "iat": 1712131200,
  "exp": 1712736000
}
```

### 5.3 RBAC权限模型

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │◄───►│   UserRole  │◄───►│    Role     │
│  (用户表)    │     │  (关联表)    │     │  (角色表)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ RolePermiss │◄───► Permission
                                        │  (关联表)    │     (权限表)
                                        └─────────────┘
```

### 5.4 数据隔离实现

```typescript
// CurrentUser装饰器
@Get()
async findAll(
  @CurrentUser() user: CurrentUserType,
  @Query() query: QueryDto
) {
  // 根据用户角色自动添加部门过滤
  const where: any = {};
  
  if (!user.roles.includes('admin') && !user.roles.includes('budget_manager')) {
    where.departmentId = user.departmentId;
  }
  
  // 合并其他查询条件
  if (query.year) where.year = query.year;
  if (query.status) where.status = query.status;
  
  return this.service.findAll({
    where,
    page: query.page,
    pageSize: query.pageSize
  });
}
```

---

## 6. 审批引擎设计

### 6.1 金额分级逻辑

```typescript
// workflow-engine.service.ts
private getApprovalChainByAmount(amount: number): ApprovalStepConfig[] {
  // 金额 < 5万: 部门负责人 -> 预算管理员 (2级)
  if (amount < 50000) {
    return [
      { name: '部门负责人审批', approverRole: 'dept_head' },
      { name: '预算管理员审批', approverRole: 'budget_manager' },
    ];
  }
  
  // 5万 <= 金额 < 50万: 部门负责人 -> 预算管理员 -> 总监 (3级)
  if (amount < 500000) {
    return [
      { name: '部门负责人审批', approverRole: 'dept_head' },
      { name: '预算管理员审批', approverRole: 'budget_manager' },
      { name: '总监审批', approverRole: 'director' },
    ];
  }
  
  // 金额 >= 50万: 部门负责人 -> 预算管理员 -> 总监 -> 总经理 (4级)
  return [
    { name: '部门负责人审批', approverRole: 'dept_head' },
    { name: '预算管理员审批', approverRole: 'budget_manager' },
    { name: '总监审批', approverRole: 'director' },
    { name: '总经理审批', approverRole: 'gm' },
  ];
}
```

### 6.2 流程推进机制

```
┌─────────────────────────────────────────────────────────────────┐
│                         审批流程状态机                           │
│                                                                  │
│   ┌─────────┐    提交    ┌─────────────┐                       │
│   │  DRAFT  │───────────>│   PENDING   │                       │
│   └─────────┘            └──────┬──────┘                       │
│        ▲                        │                               │
│        │ 撤回/拒绝              │ 开始审批                       │
│        │                        ▼                               │
│   ┌────┴────┐            ┌─────────────┐    下一步    ┌───────┐ │
│   │REJECTED │            │ IN_PROGRESS │─────────────>│APPROVE│ │
│   └─────────┘            └──────┬──────┘              └───┬───┘ │
│                                 │                         │     │
│                                 │ 完成                    │     │
│                                 ▼                         │     │
│                          ┌─────────────┐                  │     │
│                          │  COMPLETED  │<─────────────────┘     │
│                          └─────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 预算冻结/释放逻辑

| 操作 | 预算冻结金额 | 预算已使用金额 | 说明 |
|-----|-------------|---------------|------|
| 采购申请提交 | +申请金额 | - | 冻结预算 |
| 采购申请批准 | -申请金额 | +申请金额 | 冻结转已使用 |
| 采购申请拒绝 | -申请金额 | - | 释放冻结 |
| 采购申请撤回 | -申请金额 | - | 释放冻结 |

---

## 7. 通知系统设计

### 7.1 WebSocket架构

```
┌─────────────┐              ┌─────────────────────┐              ┌─────────────┐
│   Client    │              │   NestJS Server     │              │   Redis     │
│  (Browser)  │              │  (Socket.IO Gateway)│              │  (Pub/Sub)  │
└──────┬──────┘              └──────────┬──────────┘              └──────┬──────┘
       │                                │                                │
       │ 1. 连接建立                     │                                │
       │───────────────────────────────>│                                │
       │                                │                                │
       │ 2. 身份验证 (JWT)               │                                │
       │───────────────────────────────>│                                │
       │                                │                                │
       │ 3. 加入用户专属房间              │                                │
       │                                │                                │
       │ 4. 订阅通知频道                 │                                │
       │                                │───────────────────────────────>│
       │                                │                                │
       │                                │ 5. 发布通知                     │
       │                                │<───────────────────────────────│
       │                                │                                │
       │ 6. 推送通知                     │                                │
       │<───────────────────────────────│                                │
       │                                │                                │
```

### 7.2 通知触发规则

| 触发场景 | 通知类型 | 接收人 | 渠道 |
|---------|---------|-------|------|
| 预算提交审批 | APPROVAL_PENDING | 审批人 | 站内+邮件+WebSocket |
| 采购申请提交 | APPROVAL_PENDING | 审批人 | 站内+邮件+WebSocket |
| 审批通过 | APPROVAL_RESULT | 申请人 | 站内+WebSocket |
| 审批拒绝 | APPROVAL_RESULT | 申请人 | 站内+WebSocket |
| 预算使用率>80% | BUDGET_WARNING | 预算管理员+部门负责人 | 站内+邮件 |
| 预算超支 | BUDGET_OVERRUN | 预算管理员+部门负责人 | 站内+邮件+WebSocket |
| 报表生成完成 | REPORT_READY | 请求人 | 站内 |

---

## 8. 前端架构

### 8.1 目录结构

```
src/
├── api/                    # API层
│   ├── modules/            # 按模块组织的API
│   │   ├── auth.api.ts
│   │   ├── budget.api.ts
│   │   ├── purchase.api.ts
│   │   └── ...
│   ├── types/              # API类型定义
│   └── client.ts           # Axios实例配置
├── components/             # 组件
│   ├── guard/              # 路由守卫
│   ├── ui/                 # UI组件
│   └── Layout.tsx          # 布局组件
├── hooks/                  # 自定义Hooks
│   ├── useAuth.ts
│   ├── useBudget.ts
│   ├── usePurchase.ts
│   └── ...
├── pages/                  # 页面组件
│   ├── Dashboard.tsx
│   ├── BudgetList.tsx
│   ├── BudgetCreate.tsx
│   └── ...
├── router/                 # 路由配置
│   ├── index.ts
│   └── routes.tsx
├── store/                  # 状态管理
│   ├── authStore.ts
│   └── notificationStore.ts
├── styles/                 # 样式
│   └── variables.css
├── types/                  # 全局类型
│   └── index.ts
└── utils/                  # 工具函数
    ├── api.ts
    ├── format.ts
    └── permission.ts
```

### 8.2 路由设计

| 路径 | 组件 | 需要认证 | 权限要求 |
|-----|------|---------|---------|
| /login | Login | 否 | - |
| / | Dashboard | 是 | 已登录 |
| /budgets | BudgetList | 是 | 已登录 |
| /budgets/create | BudgetCreate | 是 | dept_head, budget_manager, admin |
| /budgets/create-advanced | BudgetCreateAdvanced | 是 | dept_head, budget_manager, admin |
| /budgets/:id | BudgetDetail | 是 | 已登录 |
| /budgets/:id/adjust | BudgetAdjust | 是 | dept_head, budget_manager |
| /budgets/summary | BudgetSummary | 是 | 已登录 |
| /budgets/usage | BudgetUsageTracker | 是 | 已登录 |
| /purchases | PurchaseRequestList | 是 | 已登录 |
| /purchases/create | PurchaseRequestCreate | 是 | purchaser, dept_head, admin |
| /purchases/:id | PurchaseRequestDetail | 是 | 已登录 |
| /purchases/import | PurchaseImport | 是 | finance, admin |
| /settlements/import | SettlementImport | 是 | finance, admin |
| /approvals | Approval | 是 | 已登录 |
| /analysis | Analysis | 是 | 已登录 |
| /mapping | Mapping | 是 | finance, admin |
| /departments | DepartmentList | 是 | 已登录 |
| /settings | Settings | 是 | admin |
| /audit-logs | AuditLog | 是 | admin |
| /users | UserManagement | 是 | admin |
| /roles | RoleManagement | 是 | admin |

### 8.3 状态管理

#### 8.3.1 AuthStore

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordDto) => Promise<void>;
}
```

#### 8.3.2 NotificationStore

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}
```

### 8.4 API层设计

```typescript
// 统一API响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页响应格式
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

**文档版本：** v1.0  
**编写日期：** 2026-04-03  
**编写人：** AI Assistant
