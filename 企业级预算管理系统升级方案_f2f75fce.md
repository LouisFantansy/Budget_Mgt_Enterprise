# 企业级预算管理平台 — 全面升级方案

## 一、现状诊断与升级目标

### 1.1 现状总结

当前系统是一个**纯前端 Demo 级应用**，基于 React 18 + TypeScript + Zustand + Vite 构建，包含 18 个页面，覆盖预算编制、采购申请、五级审批、差异分析等核心流程。**核心问题**：

- 无后端服务，所有数据为 Mock/内存存储，刷新即丢失
- 无真实认证授权，角色权限仅为前端模拟
- 无数据库，无法持久化任何业务数据
- 组件耦合度高，Mock 数据散落在各页面文件中
- 缺少企业级必备功能：审计日志、通知系统、工作流引擎、高级报表等

### 1.2 升级目标

打造**大型商业级企业预算管理平台**，满足以下标准：
- 支撑 500+ 并发用户、百万级数据量
- 完整的认证授权与 RBAC 权限体系
- 可配置的工作流审批引擎
- 企业级报表与数据分析
- 多租户 SaaS 架构能力
- 完善的审计合规体系
- 第三方系统集成能力（ERP/财务/HR/IM）

---

## 二、系统架构设计

### 2.1 整体架构（微服务 + 前后端分离）

```
                        ┌──────────────────────┐
                        │    CDN / Nginx       │
                        │  静态资源 + 反向代理   │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼─────────┐  ┌──────▼──────┐  ┌─────────▼─────────┐
    │   Web 前端 (SPA)   │  │ 移动端 (H5) │  │  开放 API 网关     │
    │  React 18 + TS     │  │ 响应式适配   │  │  API Gateway      │
    └─────────┬─────────┘  └──────┬──────┘  └─────────┬─────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │ HTTPS / WebSocket
                        ┌──────────▼───────────┐
                        │    API Gateway       │
                        │  (Kong / Nginx)      │
                        │  限流/鉴权/路由/日志   │
                        └──────────┬───────────┘
                                   │
         ┌─────────────┬───────────┼───────────┬─────────────┐
         │             │           │           │             │
   ┌─────▼─────┐ ┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌───▼────┐
   │ 用户服务   │ │ 预算服务   │ │采购服务  │ │审批服务  │ │报表服务 │
   │ Auth Svc  │ │Budget Svc │ │Purch Svc│ │Flow Svc │ │Rpt Svc │
   └─────┬─────┘ └─────┬─────┘ └──┬──────┘ └──┬──────┘ └───┬────┘
         │             │           │           │             │
         └─────────────┴───────────┼───────────┴─────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │ PostgreSQL │ │   Redis   │ │ MinIO/OSS │
              │  主数据库   │ │ 缓存/队列  │ │ 文件存储   │
              └───────────┘ └───────────┘ └───────────┘
```

**关键决策说明**：
- **初期采用模块化单体（Modular Monolith）**，按领域划分模块，模块间通过接口通信，未来可平滑拆分为微服务
- **API Gateway** 统一入口，处理认证、限流、日志
- **Redis** 用于会话缓存、分布式锁、消息队列
- **MinIO/OSS** 用于文件存储（Excel 导入导出、附件）

### 2.2 前端架构重构

#### 2.2.1 目标目录结构

```
src/
├── api/                        # API 层 — 所有后端通信集中管理
│   ├── client.ts               # Axios 实例（拦截器、Token 刷新、错误统一处理）
│   ├── modules/
│   │   ├── auth.api.ts         # 认证相关 API
│   │   ├── budget.api.ts       # 预算相关 API
│   │   ├── purchase.api.ts     # 采购相关 API
│   │   ├── approval.api.ts     # 审批相关 API
│   │   ├── department.api.ts   # 部门相关 API
│   │   ├── report.api.ts       # 报表相关 API
│   │   ├── notification.api.ts # 通知相关 API
│   │   └── system.api.ts       # 系统设置 API
│   └── types/                  # API 请求/响应类型定义
│       ├── auth.types.ts
│       ├── budget.types.ts
│       ├── purchase.types.ts
│       └── common.types.ts     # 分页、响应包装等通用类型
│
├── components/                 # 通用组件库
│   ├── layout/
│   │   ├── AppLayout.tsx       # 主布局（重构自 Layout.tsx）
│   │   ├── Sidebar.tsx         # 侧边栏（支持权限菜单过滤）
│   │   ├── Header.tsx          # 顶栏（通知中心、用户菜单）
│   │   └── Breadcrumb.tsx      # 面包屑导航
│   ├── ui/                     # 基础 UI 组件
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Table/              # 增强型表格（分页、排序、筛选、虚拟滚动）
│   │   │   ├── DataTable.tsx
│   │   │   ├── TablePagination.tsx
│   │   │   └── TableFilter.tsx
│   │   ├── Form/               # 表单组件库
│   │   │   ├── FormField.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormDatePicker.tsx
│   │   │   └── FormUpload.tsx
│   │   ├── Charts/             # 图表组件封装
│   │   ├── StatusTag.tsx       # 状态标签
│   │   ├── AmountDisplay.tsx   # 金额展示（千分位、货币符号）
│   │   └── EmptyState.tsx      # 空状态
│   ├── business/               # 业务通用组件
│   │   ├── ApprovalTimeline.tsx    # 审批流程时间轴
│   │   ├── BudgetProgressBar.tsx   # 预算进度条
│   │   ├── DepartmentTreeSelect.tsx # 部门树选择器
│   │   ├── BudgetItemSelector.tsx   # 预算条目选择器
│   │   └── NotificationBell.tsx     # 通知铃铛
│   └── guard/
│       ├── AuthGuard.tsx       # 认证守卫
│       └── PermissionGuard.tsx # 权限守卫
│
├── hooks/                      # 自定义 Hooks
│   ├── useAuth.ts              # 认证相关逻辑
│   ├── usePagination.ts        # 分页逻辑
│   ├── usePermission.ts        # 权限检查
│   ├── useNotification.ts      # 通知管理
│   ├── useAsync.ts             # 异步请求封装（loading/error/data）
│   ├── useDebounce.ts          # 防抖
│   └── useWebSocket.ts         # WebSocket 连接管理
│
├── store/                      # Zustand 状态管理
│   ├── authStore.ts            # 认证状态（重构：增加 Token 管理）
│   ├── appStore.ts             # 应用全局状态（主题、语言、侧边栏）
│   ├── notificationStore.ts    # 通知状态
│   └── permissionStore.ts      # 权限缓存
│
├── pages/                      # 页面组件（按功能域分组）
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx
│   ├── budget/
│   │   ├── BudgetList.tsx
│   │   ├── BudgetCreate.tsx
│   │   ├── BudgetCreateAdvanced.tsx
│   │   ├── BudgetDetail.tsx
│   │   ├── BudgetAdjust.tsx
│   │   ├── BudgetSummary.tsx
│   │   └── BudgetUsageTracker.tsx
│   ├── purchase/
│   │   ├── PurchaseRequestList.tsx
│   │   ├── PurchaseRequestCreate.tsx
│   │   ├── PurchaseRequestDetail.tsx
│   │   ├── PurchaseImport.tsx
│   │   └── SettlementImport.tsx
│   ├── approval/
│   │   └── Approval.tsx
│   ├── analysis/
│   │   ├── Analysis.tsx
│   │   └── Mapping.tsx
│   ├── system/                 # 新增：系统管理模块
│   │   ├── UserManagement.tsx
│   │   ├── RoleManagement.tsx
│   │   ├── PermissionConfig.tsx
│   │   ├── AuditLog.tsx
│   │   ├── WorkflowDesigner.tsx
│   │   ├── NotificationConfig.tsx
│   │   └── Settings.tsx
│   └── department/
│       └── DepartmentList.tsx
│
├── utils/                      # 工具函数
│   ├── format.ts               # 格式化（金额、日期、百分比）
│   ├── validation.ts           # 表单验证规则
│   ├── permission.ts           # 权限判断工具
│   ├── export.ts               # 导出工具（Excel、PDF）
│   └── constants.ts            # 全局常量
│
├── types/                      # 全局类型定义
│   ├── budget.ts
│   ├── purchase.ts
│   ├── user.ts
│   ├── approval.ts
│   ├── department.ts
│   └── common.ts
│
├── styles/                     # 样式体系
│   ├── variables.css           # CSS 变量（主题色、间距、字号）
│   ├── global.css              # 全局样式
│   └── mixins.css              # 复用样式片段
│
├── router/                     # 路由配置
│   ├── index.tsx               # 路由定义
│   ├── routes.ts               # 路由表（支持权限标记）
│   └── lazyLoad.tsx            # 懒加载包装器
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

#### 2.2.2 前端关键技术升级

| 领域 | 现状 | 升级方案 |
|------|------|---------|
| UI 组件库 | 原生 CSS 手写 | 引入 **Ant Design 5.x** 或 **Arco Design**，提供企业级组件 |
| 数据请求 | 无（Mock） | **TanStack Query (React Query)** — 缓存、自动刷新、乐观更新 |
| 表单管理 | 手写 useState | **React Hook Form + Zod** — 类型安全表单验证 |
| 国际化 | 无 | **react-i18next** — 中/英文切换 |
| 路由 | React Router 6 | 保留，增加**路由级代码分割**和**权限路由守卫** |
| 图表 | Recharts | 升级为 **ECharts 5** 或保留 Recharts + 增强封装 |
| 实时通信 | 无 | **WebSocket** — 实时通知、审批状态推送 |
| Excel 处理 | xlsx 库（客户端） | 保留客户端预览 + **服务端 ExcelJS** 生成专业报表 |

### 2.3 后端架构设计

#### 2.3.1 技术栈选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 运行时 | **Node.js 20 LTS** | 与前端统一 TS 生态，团队技能复用 |
| 框架 | **NestJS 10** | 企业级框架，模块化、依赖注入、装饰器模式，适合大型项目 |
| ORM | **Prisma** | 类型安全、自动迁移、直观的数据建模 |
| 数据库 | **PostgreSQL 16** | 企业级关系型数据库，支持 JSON、全文搜索 |
| 缓存 | **Redis 7** | 会话缓存、Token 黑名单、分布式锁 |
| 认证 | **JWT + Passport.js** | 成熟的认证方案，支持多策略 |
| 文件存储 | **MinIO** (私有化) / **阿里云 OSS** (SaaS) | 兼容 S3 协议 |
| 任务队列 | **BullMQ** (基于 Redis) | 异步任务：邮件发送、报表生成、数据导入 |
| API 文档 | **Swagger / OpenAPI 3.0** | NestJS 内置支持，自动生成 |
| 日志 | **Winston + ELK** | 结构化日志，生产级日志分析 |

#### 2.3.2 后端模块划分

```
server/
├── src/
│   ├── modules/
│   │   ├── auth/                   # 认证授权模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/         # Passport 策略
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   └── permissions.guard.ts
│   │   │   └── decorators/
│   │   │       ├── roles.decorator.ts
│   │   │       └── permissions.decorator.ts
│   │   │
│   │   ├── user/                   # 用户管理模块
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.module.ts
│   │   │   └── dto/
│   │   │
│   │   ├── department/             # 部门管理模块
│   │   │   ├── department.controller.ts
│   │   │   ├── department.service.ts
│   │   │   └── department.module.ts
│   │   │
│   │   ├── budget/                 # 预算管理模块
│   │   │   ├── budget.controller.ts
│   │   │   ├── budget.service.ts
│   │   │   ├── budget.module.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-budget.dto.ts
│   │   │   │   ├── update-budget.dto.ts
│   │   │   │   └── adjust-budget.dto.ts
│   │   │   └── budget-usage.service.ts  # 预算占用/释放逻辑
│   │   │
│   │   ├── purchase/               # 采购管理模块
│   │   │   ├── purchase.controller.ts
│   │   │   ├── purchase.service.ts
│   │   │   └── purchase.module.ts
│   │   │
│   │   ├── workflow/               # 工作流引擎模块
│   │   │   ├── workflow.controller.ts
│   │   │   ├── workflow.service.ts
│   │   │   ├── workflow-engine.ts      # 核心引擎
│   │   │   ├── workflow.module.ts
│   │   │   └── templates/              # 预置流程模板
│   │   │
│   │   ├── approval/               # 审批模块
│   │   │   ├── approval.controller.ts
│   │   │   ├── approval.service.ts
│   │   │   └── approval.module.ts
│   │   │
│   │   ├── notification/           # 通知模块
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.gateway.ts # WebSocket 网关
│   │   │   ├── channels/
│   │   │   │   ├── email.channel.ts
│   │   │   │   ├── sms.channel.ts
│   │   │   │   └── wechat.channel.ts
│   │   │   └── notification.module.ts
│   │   │
│   │   ├── report/                 # 报表模块
│   │   │   ├── report.controller.ts
│   │   │   ├── report.service.ts
│   │   │   ├── generators/
│   │   │   │   ├── excel.generator.ts
│   │   │   │   └── pdf.generator.ts
│   │   │   └── report.module.ts
│   │   │
│   │   ├── import-export/          # 数据导入导出模块
│   │   │   ├── import.controller.ts
│   │   │   ├── import.service.ts
│   │   │   ├── export.service.ts
│   │   │   ├── parsers/
│   │   │   │   ├── excel.parser.ts
│   │   │   │   └── csv.parser.ts
│   │   │   └── import-export.module.ts
│   │   │
│   │   ├── audit/                  # 审计日志模块
│   │   │   ├── audit.service.ts
│   │   │   ├── audit.interceptor.ts   # 全局拦截器自动记录
│   │   │   ├── audit.controller.ts
│   │   │   └── audit.module.ts
│   │   │
│   │   └── system/                 # 系统配置模块
│   │       ├── system.controller.ts
│   │       ├── system.service.ts
│   │       └── system.module.ts
│   │
│   ├── common/                     # 公共模块
│   │   ├── decorators/
│   │   ├── filters/                # 异常过滤器
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/           # 拦截器
│   │   │   ├── transform.interceptor.ts   # 响应格式统一
│   │   │   ├── logging.interceptor.ts     # 日志
│   │   │   └── timeout.interceptor.ts     # 超时
│   │   ├── pipes/                  # 管道
│   │   │   └── validation.pipe.ts
│   │   └── dto/                    # 公共 DTO
│   │       ├── pagination.dto.ts
│   │       └── response.dto.ts
│   │
│   ├── config/                     # 配置管理
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   │
│   ├── prisma/                     # Prisma 数据库
│   │   ├── schema.prisma           # 数据模型定义
│   │   ├── migrations/             # 数据库迁移
│   │   └── seed.ts                 # 种子数据
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/                           # 测试
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker-compose.yml              # 本地开发环境
├── Dockerfile
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 三、数据库设计

### 3.1 核心数据模型（Prisma Schema）

```prisma
// ==================== 用户与权限 ====================

model User {
  id            String    @id @default(uuid())
  username      String    @unique
  password      String    // bcrypt 哈希
  name          String
  email         String?   @unique
  phone         String?
  avatar        String?
  status        UserStatus @default(ACTIVE)
  departmentId  String
  department    Department @relation(fields: [departmentId], references: [id])
  roles         UserRole[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  loginAttempts Int       @default(0)
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique  // admin, budget_manager, dept_head, finance, purchaser, viewer
  displayName String
  description String?
  isSystem    Boolean      @default(false) // 系统内置角色不可删
  permissions RolePermission[]
  users       UserRole[]
}

model Permission {
  id       String  @id @default(uuid())
  module   String  // budget, purchase, approval, report, system
  action   String  // create, read, update, delete, approve, export
  name     String  @unique
  roles    RolePermission[]
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])
  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}

// ==================== 组织结构 ====================

model Department {
  id          String       @id @default(uuid())
  name        String
  code        String       @unique
  level       Int          // 1, 2, 3
  parentId    String?
  parent      Department?  @relation("DeptTree", fields: [parentId], references: [id])
  children    Department[] @relation("DeptTree")
  managerId   String?      // 部门负责人
  budgetAdminId String?    // 预算管理员
  users       User[]
  budgets     Budget[]
  sortOrder   Int          @default(0)
  status      DeptStatus   @default(ACTIVE)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

// ==================== 预算管理 ====================

model Budget {
  id            String       @id @default(uuid())
  budgetNo      String       @unique // 自动生成：BG-2026-001
  name          String
  departmentId  String
  department    Department   @relation(fields: [departmentId], references: [id])
  type          BudgetType   // OPEX, CAPEX
  year          Int
  version       Int          @default(1) // 版本号（调整后递增）
  parentId      String?      // 调整前版本ID
  totalAmount   Decimal      @db.Decimal(18, 2)
  usedAmount    Decimal      @default(0) @db.Decimal(18, 2)
  frozenAmount  Decimal      @default(0) @db.Decimal(18, 2) // 占用金额
  status        BudgetStatus @default(DRAFT)
  items         BudgetItem[]
  approvals     ApprovalFlow[]
  purchases     PurchaseRequest[]
  adjustments   BudgetAdjustment[]
  creatorId     String
  remark        String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model BudgetItem {
  id            String   @id @default(uuid())
  budgetId      String
  budget        Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  name          String   // 采购名称
  category      String   // 费用类别
  specification String?  // 规格型号
  function      String?  // 功能描述
  unitPrice     Decimal  @db.Decimal(18, 2)
  quantity      Int
  totalAmount   Decimal  @db.Decimal(18, 2)
  usedAmount    Decimal  @default(0) @db.Decimal(18, 2)
  frozenAmount  Decimal  @default(0) @db.Decimal(18, 2)
  monthlyPlan   Json?    // { "1": 100, "2": 200, ... "12": 150 }
  project       String?
  purpose       String?
  supplier      String?
  deliveryDate  DateTime?
  sortOrder     Int      @default(0)
}

model BudgetAdjustment {
  id            String   @id @default(uuid())
  budgetId      String
  budget        Budget   @relation(fields: [budgetId], references: [id])
  adjustNo      String   @unique // ADJ-2026-001
  originalAmount Decimal @db.Decimal(18, 2)
  adjustedAmount Decimal @db.Decimal(18, 2)
  reason        String
  items         Json     // 调整明细快照
  status        AdjustStatus @default(PENDING)
  creatorId     String
  createdAt     DateTime @default(now())
}

// ==================== 采购管理 ====================

model PurchaseRequest {
  id            String        @id @default(uuid())
  requestNo     String        @unique // PR-2026-001
  applicantId   String
  departmentId  String
  budgetId      String
  budget        Budget        @relation(fields: [budgetId], references: [id])
  budgetItemId  String?
  items         PurchaseItem[]
  totalAmount   Decimal       @db.Decimal(18, 2)
  purpose       String
  urgencyLevel  UrgencyLevel  @default(NORMAL)
  status        PurchaseStatus @default(DRAFT)
  currentStep   Int           @default(0)
  approvals     ApprovalFlow[]
  attachments   Attachment[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model PurchaseItem {
  id            String          @id @default(uuid())
  requestId     String
  request       PurchaseRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  name          String
  specification String?
  quantity      Int
  unitPrice     Decimal         @db.Decimal(18, 2)
  totalAmount   Decimal         @db.Decimal(18, 2)
  supplier      String?
  deliveryDate  DateTime?
  remark        String?
}

// ==================== 工作流与审批 ====================

model WorkflowTemplate {
  id          String   @id @default(uuid())
  name        String   // "预算审批流程"、"采购审批流程"
  type        String   // BUDGET_APPROVAL, PURCHASE_APPROVAL, ADJUSTMENT_APPROVAL
  steps       Json     // 步骤定义（角色、条件、并行/串行）
  conditions  Json?    // 触发条件（如金额>100万需总经理审批）
  isActive    Boolean  @default(true)
  version     Int      @default(1)
  createdAt   DateTime @default(now())
}

model ApprovalFlow {
  id            String    @id @default(uuid())
  templateId    String?
  targetType    String    // BUDGET, PURCHASE, ADJUSTMENT
  targetId      String    // 关联的预算/采购/调整ID
  budget        Budget?   @relation(fields: [targetId], references: [id])
  purchase      PurchaseRequest? @relation(fields: [targetId], references: [id])
  steps         ApprovalStep[]
  currentStep   Int       @default(1)
  status        ApprovalStatus @default(PENDING)
  createdAt     DateTime  @default(now())
  completedAt   DateTime?
}

model ApprovalStep {
  id          String       @id @default(uuid())
  flowId      String
  flow        ApprovalFlow @relation(fields: [flowId], references: [id])
  stepOrder   Int
  stepName    String       // "部门负责人审批"
  approverId  String?      // 具体审批人
  approverRole String?     // 或按角色匹配
  action      ApprovalAction? // APPROVE, REJECT, null(待处理)
  comment     String?
  operatedAt  DateTime?
}

// ==================== 数据导入（三单关联） ====================

model PurchaseOrder {
  id            String   @id @default(uuid())
  orderNo       String   @unique
  supplier      String
  amount        Decimal  @db.Decimal(18, 2)
  orderDate     DateTime
  status        String
  budgetNo      String?
  mappingId     String?
  importBatchId String
  createdAt     DateTime @default(now())
}

model Settlement {
  id            String   @id @default(uuid())
  settlementNo  String   @unique
  invoiceNo     String?
  amount        Decimal  @db.Decimal(18, 2)
  settleDate    DateTime
  supplier      String
  budgetNo      String?
  mappingId     String?
  importBatchId String
  createdAt     DateTime @default(now())
}

model DataMapping {
  id              String   @id @default(uuid())
  budgetNo        String?
  purchaseOrderNo String?
  settlementNo    String?
  matchStatus     MatchStatus // FULL, PARTIAL, NONE
  amountDiff      Decimal?  @db.Decimal(18, 2)
  verifiedAt      DateTime?
  verifiedBy      String?
  createdAt       DateTime @default(now())
}

// ==================== 通知系统 ====================

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      NotificationType // APPROVAL_PENDING, BUDGET_WARNING, SYSTEM
  title     String
  content   String
  link      String?  // 跳转链接
  isRead    Boolean  @default(false)
  channels  String[] // ["in_app", "email", "wechat"]
  createdAt DateTime @default(now())
}

// ==================== 审计日志 ====================

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  userName   String
  action     String   // CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, EXPORT
  module     String   // budget, purchase, approval, user, system
  targetType String?
  targetId   String?
  oldValue   Json?    // 修改前的值
  newValue   Json?    // 修改后的值
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([module])
  @@index([createdAt])
}

// ==================== 附件管理 ====================

model Attachment {
  id         String          @id @default(uuid())
  fileName   String
  fileSize   Int
  mimeType   String
  storagePath String
  uploaderId String
  targetType String?         // PURCHASE, BUDGET
  targetId   String?
  request    PurchaseRequest? @relation(fields: [targetId], references: [id])
  createdAt  DateTime        @default(now())
}

// ==================== 枚举类型 ====================

enum UserStatus    { ACTIVE, DISABLED, LOCKED }
enum DeptStatus    { ACTIVE, INACTIVE }
enum BudgetType    { OPEX, CAPEX }
enum BudgetStatus  { DRAFT, PENDING, APPROVED, REJECTED, ADJUSTED, CLOSED }
enum AdjustStatus  { PENDING, APPROVED, REJECTED }
enum PurchaseStatus { DRAFT, PENDING, IN_APPROVAL, APPROVED, REJECTED, CANCELLED }
enum UrgencyLevel  { LOW, NORMAL, HIGH, URGENT }
enum ApprovalStatus { PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED }
enum ApprovalAction { APPROVE, REJECT, WITHDRAW }
enum MatchStatus   { FULL, PARTIAL, NONE }
enum NotificationType { APPROVAL_PENDING, APPROVAL_RESULT, BUDGET_WARNING, BUDGET_OVERRUN, SYSTEM, REPORT_READY }
```

---

## 四、核心 API 设计

### 4.1 API 统一规范

```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number;        // 200=成功, 4xx=客户端错误, 5xx=服务端错误
  message: string;
  data: T;
  timestamp: string;
}

// 分页请求
interface PaginationQuery {
  page: number;        // 从1开始
  pageSize: number;    // 默认20，最大100
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 4.2 核心 API 端点

| 模块 | 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|------|
| **认证** | POST | /api/auth/login | 登录 | 公开 |
| | POST | /api/auth/logout | 登出 | 认证 |
| | POST | /api/auth/refresh | 刷新Token | 认证 |
| | PUT | /api/auth/password | 修改密码 | 认证 |
| **用户** | GET | /api/users | 用户列表 | admin |
| | POST | /api/users | 创建用户 | admin |
| | PUT | /api/users/:id | 编辑用户 | admin |
| | DELETE | /api/users/:id | 删除用户 | admin |
| | PUT | /api/users/:id/status | 启用/禁用 | admin |
| **角色** | GET | /api/roles | 角色列表 | admin |
| | POST | /api/roles | 创建角色 | admin |
| | PUT | /api/roles/:id/permissions | 配置权限 | admin |
| **部门** | GET | /api/departments | 部门树 | 认证 |
| | POST | /api/departments | 创建部门 | admin |
| | PUT | /api/departments/:id | 编辑部门 | admin |
| | DELETE | /api/departments/:id | 删除部门 | admin |
| **预算** | GET | /api/budgets | 预算列表（分页/筛选） | budget.read |
| | POST | /api/budgets | 创建预算 | budget.create |
| | GET | /api/budgets/:id | 预算详情 | budget.read |
| | PUT | /api/budgets/:id | 编辑预算 | budget.update |
| | DELETE | /api/budgets/:id | 删除预算 | budget.delete |
| | POST | /api/budgets/:id/submit | 提交审批 | budget.create |
| | POST | /api/budgets/:id/adjust | 提交调整 | budget.update |
| | GET | /api/budgets/summary | 汇总报表 | budget.read |
| | GET | /api/budgets/usage | 占用追踪 | budget.read |
| **采购** | GET | /api/purchases | 采购申请列表 | purchase.read |
| | POST | /api/purchases | 创建采购申请 | purchase.create |
| | GET | /api/purchases/:id | 采购申请详情 | purchase.read |
| | PUT | /api/purchases/:id | 编辑采购申请 | purchase.update |
| | DELETE | /api/purchases/:id | 删除采购申请 | purchase.delete |
| | POST | /api/purchases/:id/submit | 提交审批 | purchase.create |
| **审批** | GET | /api/approvals | 待审批列表 | approval.read |
| | GET | /api/approvals/my | 我的审批 | 认证 |
| | POST | /api/approvals/:id/approve | 批准 | approval.approve |
| | POST | /api/approvals/:id/reject | 拒绝 | approval.approve |
| | POST | /api/approvals/:id/withdraw | 撤回 | 认证 |
| **导入导出** | POST | /api/import/purchase-orders | 导入采购订单 | import.create |
| | POST | /api/import/settlements | 导入结算单 | import.create |
| | GET | /api/export/budgets | 导出预算报表 | export.read |
| | GET | /api/export/analysis | 导出分析报表 | export.read |
| **映射** | GET | /api/mappings | 三单关联列表 | mapping.read |
| | POST | /api/mappings/auto-match | 自动匹配 | mapping.create |
| | PUT | /api/mappings/:id | 手动关联 | mapping.update |
| **分析** | GET | /api/analysis/department | 部门差异分析 | analysis.read |
| | GET | /api/analysis/trend | 月度趋势分析 | analysis.read |
| | GET | /api/analysis/dashboard | 仪表盘数据 | 认证 |
| **通知** | GET | /api/notifications | 通知列表 | 认证 |
| | PUT | /api/notifications/:id/read | 标记已读 | 认证 |
| | PUT | /api/notifications/read-all | 全部已读 | 认证 |
| | WS | /ws/notifications | 实时推送 | 认证 |
| **审计** | GET | /api/audit-logs | 审计日志查询 | audit.read |
| | GET | /api/audit-logs/export | 导出审计日志 | audit.export |
| **工作流** | GET | /api/workflows | 流程模板列表 | workflow.read |
| | POST | /api/workflows | 创建流程模板 | workflow.create |
| | PUT | /api/workflows/:id | 编辑流程模板 | workflow.update |
| **系统** | GET | /api/system/config | 获取系统配置 | system.read |
| | PUT | /api/system/config | 更新系统配置 | system.update |

---

## 五、新增核心功能需求设计

### 5.1 RBAC 权限管理系统

**功能需求**：
- 用户管理：CRUD、批量导入、状态管理（启用/禁用/锁定）、密码重置
- 角色管理：内置角色 + 自定义角色，每个角色绑定一组权限
- 权限管理：按模块划分（预算/采购/审批/报表/系统），按操作划分（查看/创建/编辑/删除/审批/导出）
- 数据权限：部门级数据隔离（普通用户只看本部门，管理员看全部）
- 前端路由与按钮级权限控制

### 5.2 可配置工作流引擎

**功能需求**：
- 预置流程模板（预算审批、采购审批、调整审批）
- 可视化流程设计器（拖拽节点、连线）
- 条件分支：根据金额、部门等条件走不同审批路线（如金额 > 100万需总经理审批）
- 支持并行审批（会签）和串行审批
- 审批委托/转派
- 超时自动提醒、自动催办
- 审批意见和附件支持

### 5.3 通知中心

**功能需求**：
- 站内消息（顶栏铃铛图标 + 消息列表页）
- WebSocket 实时推送
- 邮件通知（可配置模板）
- 企业微信/钉钉集成（Webhook）
- 通知规则配置（哪些事件触发哪些渠道）
- 消息已读/未读管理

### 5.4 高级报表与数据分析

**功能需求**：
- 预算执行明细报表（支持导出 Excel/PDF）
- 部门对标分析（雷达图、热力图）
- 历史趋势分析与预测（基于历史数据的线性回归）
- 预算偏差根因分析
- 自定义报表查询（可配置维度和指标）
- 定时报表生成与邮件发送

### 5.5 完整导入导出体系

**功能需求**：
- Excel 模板下载
- 导入数据校验与错误提示（逐行标注错误原因）
- 大文件流式导入（支持 10MB+ 文件）
- 导入进度展示
- 专业 Excel 报表导出（带样式、合并单元格、图表）
- PDF 报表导出

### 5.6 审计合规系统

**功能需求**：
- 全操作审计日志（自动记录，无需业务代码侵入）
- 日志查询与筛选（按用户/模块/操作类型/时间）
- 数据变更对比（旧值 vs 新值）
- 审计报表导出
- 异常操作检测与告警

---

## 六、开发计划（分阶段任务分解）

### Task 1: 前端架构重构（预计 2-3 天）

**范围**：不改变现有功能，仅重构代码组织

- 1.1 安装新依赖：Ant Design 5、React Query、React Hook Form、Zod、react-i18next、axios
- 1.2 创建目录结构：api/、hooks/、utils/、types/、router/、styles/ 等
- 1.3 抽取全局类型定义到 `src/types/` 目录
- 1.4 抽取通用工具函数到 `src/utils/`（格式化、验证、常量）
- 1.5 重构 Layout 组件为 `layout/` 子目录（AppLayout + Sidebar + Header + Breadcrumb）
- 1.6 创建 API 客户端层 `src/api/client.ts`（Axios 实例、拦截器、Token 管理）
- 1.7 创建路由配置模块 `src/router/`（路由表、懒加载、权限守卫）
- 1.8 页面文件按功能域分组迁移到子目录

### Task 2: 后端项目初始化与基础设施（预计 2-3 天）

**范围**：搭建 NestJS 项目骨架

- 2.1 初始化 NestJS 项目（`server/` 目录）
- 2.2 配置 Prisma + PostgreSQL 连接
- 2.3 创建 Prisma Schema（全部数据模型，见第三节）
- 2.4 运行数据库迁移，创建表结构
- 2.5 编写种子数据脚本（初始用户、角色、权限、演示部门）
- 2.6 配置公共模块：异常过滤器、响应拦截器、验证管道、日志
- 2.7 配置 Swagger/OpenAPI 文档
- 2.8 配置 Docker Compose（PostgreSQL + Redis + MinIO）
- 2.9 配置环境变量管理（.env）

### Task 3: 认证授权模块（预计 2 天）

- 3.1 实现 JWT 认证（登录/登出/Token刷新）
- 3.2 实现 Passport Local + JWT 策略
- 3.3 实现 RBAC 守卫（角色守卫 + 权限守卫）
- 3.4 实现用户管理 CRUD API
- 3.5 实现角色管理 + 权限配置 API
- 3.6 前端：重构 Login 页面对接真实 API
- 3.7 前端：实现 AuthGuard 和 PermissionGuard 组件
- 3.8 前端：实现权限菜单过滤和按钮级权限

### Task 4: 部门管理模块（预计 1 天）

- 4.1 实现部门 CRUD API（树形结构）
- 4.2 前端：DepartmentList 对接 API，移除 Mock 数据

### Task 5: 预算管理模块（预计 3-4 天）

- 5.1 实现预算 CRUD API（含分页、筛选、排序）
- 5.2 实现预算明细项 CRUD
- 5.3 实现预算占用/释放/使用逻辑（事务保证一致性）
- 5.4 实现预算调整 API + 版本管理
- 5.5 实现预算汇总查询 API（多维度聚合）
- 5.6 前端：BudgetList / BudgetCreate / BudgetCreateAdvanced / BudgetDetail / BudgetAdjust / BudgetSummary / BudgetUsageTracker 全部对接 API

### Task 6: 采购申请模块（预计 2-3 天）

- 6.1 实现采购申请 CRUD API
- 6.2 实现采购申请提交 + 自动占用预算逻辑
- 6.3 前端：PurchaseRequestList / Create / Detail 对接 API

### Task 7: 工作流审批引擎（预计 3-4 天）

- 7.1 实现工作流模板管理 API
- 7.2 实现审批流程引擎核心逻辑（创建实例、推进步骤、条件分支）
- 7.3 实现审批操作 API（批准/拒绝/撤回/转派）
- 7.4 实现条件审批（如金额阈值触发不同审批链路）
- 7.5 前端：审批中心对接 API
- 7.6 前端：新增工作流设计器页面（系统管理模块）

### Task 8: 通知系统（预计 2 天）

- 8.1 实现通知服务 + WebSocket 网关
- 8.2 实现站内消息 CRUD API
- 8.3 实现邮件通知渠道（Nodemailer）
- 8.4 审批事件自动触发通知
- 8.5 前端：Header 通知铃铛 + 通知列表页
- 8.6 前端：WebSocket 实时接收

### Task 9: 导入导出模块（预计 2 天）

- 9.1 实现服务端 Excel 解析（采购订单、结算单）
- 9.2 实现导入数据校验 + 错误报告
- 9.3 实现 Excel 报表生成（ExcelJS，带样式）
- 9.4 实现三单自动匹配逻辑
- 9.5 前端：PurchaseImport / SettlementImport / Mapping 对接 API

### Task 10: 报表与分析模块（预计 2-3 天）

- 10.1 实现仪表盘数据聚合 API
- 10.2 实现部门差异分析 API
- 10.3 实现月度趋势分析 API
- 10.4 实现报表导出（Excel + PDF）
- 10.5 前端：Dashboard / Analysis 对接 API，增强图表

### Task 11: 审计日志系统（预计 1-2 天）

- 11.1 实现审计日志拦截器（全局自动记录）
- 11.2 实现审计日志查询 API（分页、筛选）
- 11.3 前端：新增审计日志查询页面

### Task 12: 系统管理增强（预计 1-2 天）

- 12.1 实现系统配置 API（公司名称、财年、预警阈值等）
- 12.2 前端：新增用户管理页面
- 12.3 前端：新增角色权限配置页面
- 12.4 前端：重构 Settings 页面对接 API

### Task 13: UI/UX 全面提升（预计 2 天）

- 13.1 Ant Design 组件替换（Table、Form、Modal、Message 等）
- 13.2 统一主题配色和设计规范
- 13.3 国际化支持（中/英文）
- 13.4 响应式优化（移动端适配）
- 13.5 加载状态和错误处理统一优化

### Task 14: 测试与质量保障（预计 2-3 天）

- 14.1 后端单元测试（核心 Service 层）
- 14.2 后端 API 集成测试
- 14.3 前端组件测试（关键业务组件）
- 14.4 E2E 测试（核心流程）

### Task 15: 部署与运维配置（预计 1 天）

- 15.1 完善 Docker Compose（全服务编排）
- 15.2 前端生产构建优化（代码分割、Gzip、缓存策略）
- 15.3 Nginx 配置（反向代理、SSL、静态资源缓存）
- 15.4 环境变量管理（开发/测试/生产）

---

## 七、任务依赖关系

```
Task 1 (前端重构) ─────┐
                       ├──> Task 3 (认证) ──> Task 4 (部门) ──┐
Task 2 (后端初始化) ───┘                                      │
                                                              ├──> Task 5 (预算) ──> Task 6 (采购)
                                                              │         │
                                                              │         └──> Task 7 (审批引擎)
                                                              │                    │
                                                              │         Task 8 (通知) <──┘
                                                              │
                                                              ├──> Task 9 (导入导出)
                                                              ├──> Task 10 (报表分析)
                                                              └──> Task 11 (审计日志)

Task 12 (系统管理) ←── 依赖 Task 3
Task 13 (UI提升)   ←── 可与其他 Task 并行
Task 14 (测试)     ←── 依赖所有功能 Task 完成
Task 15 (部署)     ←── 依赖 Task 14
```

**可并行执行的任务组**：
- Task 1 + Task 2（前后端初始化同时进行）
- Task 5 + Task 9 + Task 11（预算、导入导出、审计可并行）
- Task 8 + Task 10（通知和报表可并行）
- Task 13 可随时穿插进行

---

## 八、技术风险与应对策略

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| Mock 数据迁移遗漏 | 部分功能断裂 | 逐页面对照迁移，每个页面迁移后立即测试 |
| 预算占用并发冲突 | 数据不一致 | PostgreSQL 行锁 + 事务隔离级别 SERIALIZABLE |
| 大数据量性能 | 列表/报表卡顿 | 数据库索引优化 + 分页 + Redis 缓存热点数据 |
| 工作流引擎复杂度 | 开发周期超估 | 初期实现固定流程，第二期再做可视化设计器 |
| 前端重构影响现有功能 | 回归缺陷 | 重构采用渐进式：先搭骨架，再逐页面迁移 |

---

## 九、总结

本方案将当前前端 Demo 级应用升级为**完整的企业级预算管理平台**，核心升级点包括：

1. **后端建设**：NestJS + PostgreSQL + Redis，完整的服务端架构
2. **权限体系**：JWT 认证 + RBAC 权限，数据级/功能级/按钮级全覆盖
3. **工作流引擎**：可配置的多级审批流程，支持条件分支和并行审批
4. **通知系统**：WebSocket 实时推送 + 邮件 + 企业IM集成
5. **报表系统**：多维度分析、Excel/PDF 导出、定时报表
6. **审计合规**：全操作审计日志，数据变更追踪
7. **前端重构**：引入 Ant Design、React Query、国际化等企业级方案

总计 **15 个开发任务**，预计 **25-35 个工作日** 完成全部核心功能开发。