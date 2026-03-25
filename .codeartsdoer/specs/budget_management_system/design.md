 # 预算管理系统技术设计文档

## 文档信息
- **项目名称**: 半导体研发企业预算管理系统
- **文档版本**: v1.2
- **创建日期**: 2025-01-18
- **最后更新**: 2025-01-18
- **文档状态**: 草稿
- **更新说明**: 
  - v1.1: 补充采购执行流程、月度差异分析流程、PR-PO Gap数据模型、数据Mapping机制等设计细节
  - v1.2: 新增苹果设计风格规范，包括色彩系统、字体系统、组件设计、动效规范等完整的设计系统

## 1. 设计概述

### 1.1 设计目标
- 构建一个高性能、可扩展、易维护的预算管理系统
- 支持大规模数据处理（年度预算900+条，PR/PO 4000+条）
- 提供友好的用户界面和丰富的数据可视化
- 确保数据安全性和审计追溯能力
- 支持灵活的业务规则配置

### 1.2 设计原则
- **分层架构**: 表现层、应用层、领域层、基础设施层清晰分离
- **模块化设计**: 高内聚、低耦合，功能模块独立可测试
- **配置驱动**: 业务规则可配置，减少代码修改
- **安全第一**: 完善的认证授权机制和数据保护措施
- **性能优先**: 合理的缓存策略和查询优化
- **可追溯性**: 完整的操作日志和数据变更历史
- **苹果设计风格**: 简洁、优雅、直观的用户界面设计

### 1.3 技术栈选择
| 技术领域 | 技术选型 | 选择理由 |
|----------|----------|----------|
| 前端框架 | React 18 + TypeScript | 成熟生态、类型安全、组件化开发 |
| UI组件库 | Ant Design 5.x (定制苹果风格主题) | 企业级组件、支持主题定制、丰富的表格和表单组件 |
| 状态管理 | Redux Toolkit | 简化Redux使用、内置immer和thunk |
| 图表库 | ECharts 5.x | 功能强大、性能优秀、支持大数据量、可定制苹果风格 |
| 表格组件 | AG-Grid Community | 高性能表格、支持大数据量渲染、可定制样式 |
| 构建工具 | Vite 5.x | 快速构建、优秀的开发体验 |
| 样式方案 | CSS-in-JS (styled-components) + Tailwind CSS | 灵活的样式定制、支持苹果设计系统 |
| 图标库 | SF Symbols (Apple风格图标) + Lucide React | 统一的苹果风格图标体系 |
| 后端框架 | NestJS 10.x | 企业级框架、依赖注入、模块化 |
| 数据库 | PostgreSQL 15+ | 强大的查询能力、支持JSON、开源免费 |
| ORM | TypeORM | TypeScript原生支持、装饰器语法 |
| 缓存 | Redis 7.x | 高性能缓存、会话管理、分布式锁 |
| 认证 | JWT + Passport | 标准化认证、支持多种策略 |
| API文档 | Swagger/OpenAPI | 自动生成文档、在线测试 |
| 文件处理 | ExcelJS | Excel读写、支持大文件流式处理 |
| 容器化 | Docker + Compose | 标准化部署、环境一致性 |

## 2. 系统架构

### 2.1 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React SPA (单页应用)                                 │  │
│  │  - 页面组件、路由管理、状态管理                        │  │
│  │  - 数据可视化、用户交互                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                        网关层                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Nginx 反向代理                                       │  │
│  │  - 静态资源服务、负载均衡、SSL终止                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      应用服务层                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NestJS Application Server                            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  表现层 (Controllers)                          │  │  │
│  │  │  - RESTful API接口                             │  │  │
│  │  │  - 请求验证、响应格式化                         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  应用层 (Services)                             │  │  │
│  │  │  - 业务逻辑编排                                │  │  │
│  │  │  - 事务管理、权限校验                          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  领域层 (Entities/Models)                      │  │  │
│  │  │  - 核心业务模型                                │  │  │
│  │  │  - 业务规则、数据验证                          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  基础设施层 (Repositories)                     │  │  │
│  │  │  - 数据持久化                                  │  │  │
│  │  │  - 外部服务集成                                │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  PostgreSQL    │  │  Redis         │  │  File Storage│  │
│  │  主数据库      │  │  缓存/会话     │  │  文件存储    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 架构分层
```
┌─────────────────────────────────┐
│       表现层 (Presentation)      │
│  - Controllers (控制器)          │
│  - DTOs (数据传输对象)           │
│  - Guards (守卫)                 │
│  - Interceptors (拦截器)         │
├─────────────────────────────────┤
│       应用层 (Application)       │
│  - Services (服务)               │
│  - Use Cases (用例)              │
│  - Validators (验证器)           │
├─────────────────────────────────┤
│       领域层 (Domain)            │
│  - Entities (实体)               │
│  - Value Objects (值对象)        │
│  - Domain Events (领域事件)      │
│  - Business Rules (业务规则)     │
├─────────────────────────────────┤
│    基础设施层 (Infrastructure)   │
│  - Repositories (仓储)           │
│  - External Services (外部服务)  │
│  - Database (数据库)             │
│  - Cache (缓存)                  │
└─────────────────────────────────┘
```

### 2.3 部署架构
```
┌─────────────────────────────────────────────────────────────┐
│                      生产环境                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Compose 编排                                  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  nginx容器                                      │  │  │
│  │  │  - 端口: 80, 443                                │  │  │
│  │  │  - SSL证书                                      │  │  │
│  │  │  - 静态资源、反向代理                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  app容器 (NestJS)                               │  │  │
│  │  │  - 端口: 3000                                   │  │  │
│  │  │  - 环境变量配置                                 │  │  │
│  │  │  - 日志卷挂载                                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
```

## 2.4 苹果设计风格规范

### 2.4.1 设计理念
遵循Apple Human Interface Guidelines核心原则：
- **清晰性 (Clarity)**: 界面元素清晰易懂，文字简洁明确，图标直观
- **依从性 (Deference)**: 界面服务于内容，不喧宾夺主
- **深度感 (Depth)**: 合理使用层次和动效，增强视觉层次

### 2.4.2 色彩系统
```
主色调 (Primary Colors):
- 系统蓝: #007AFF (Apple System Blue)
- 系统绿: #34C759 (Apple System Green)
- 系统橙: #FF9500 (Apple System Orange)
- 系统红: #FF3B30 (Apple System Red)

中性色 (Neutral Colors):
- 深色模式背景: #1C1C1E
- 浅色模式背景: #F2F2F7
- 主文本色: #000000 (浅色模式) / #FFFFFF (深色模式)
- 次要文本色: #8E8E93
- 分割线: #C6C6C8

语义色 (Semantic Colors):
- 成功: #34C759
- 警告: #FF9500
- 错误: #FF3B30
- 信息: #007AFF
```

### 2.4.3 字体系统
```
字体族:
- 中文: PingFang SC (苹果苹方)
- 英文: SF Pro Text / SF Pro Display
- 数字: SF Mono (等宽字体，用于数据展示)

字号规范:
- 大标题 (Large Title): 34px
- 标题1 (Title 1): 28px
- 标题2 (Title 2): 22px
- 标题3 (Title 3): 20px
- 标题 (Headline): 17px (Semibold)
- 正文 (Body): 17px
- 次要正文 (Subheadline): 15px
- 脚注 (Footnote): 13px
- 说明 (Caption): 12px

字重:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
```

### 2.4.4 间距与布局
```
间距系统 (基于8px网格):
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

圆角规范:
- 小圆角: 6px (按钮、输入框)
- 中圆角: 12px (卡片)
- 大圆角: 20px (模态框、面板)
- 全圆角: 50% (头像、图标按钮)

阴影规范:
- 轻阴影: 0 2px 8px rgba(0, 0, 0, 0.08)
- 中阴影: 0 4px 16px rgba(0, 0, 0, 0.12)
- 重阴影: 0 8px 24px rgba(0, 0, 0, 0.16)
```

### 2.4.5 组件设计规范

#### 按钮设计
```
主要按钮 (Primary Button):
- 背景色: #007AFF
- 文字色: #FFFFFF
- 圆角: 6px
- 高度: 44px (触控友好)
- 悬停效果: 背景色加深10%

次要按钮 (Secondary Button):
- 背景色: 透明
- 边框: 1px solid #007AFF
- 文字色: #007AFF
- 圆角: 6px
- 高度: 44px

文字按钮 (Text Button):
- 背景色: 透明
- 文字色: #007AFF
- 无边框
- 点击效果: 文字色加深
```

#### 输入框设计
```
标准输入框:
- 高度: 44px
- 圆角: 6px
- 边框: 1px solid #C6C6C8
- 聚焦边框: 2px solid #007AFF
- 背景色: #FFFFFF (浅色模式) / #2C2C2E (深色模式)
- 内边距: 12px

搜索框:
- 高度: 36px
- 圆角: 10px
- 背景色: #E5E5EA (浅色模式) / #1C1C1E (深色模式)
- 左侧搜索图标
```

#### 卡片设计
```
标准卡片:
- 背景色: #FFFFFF
- 圆角: 12px
- 阴影: 0 2px 8px rgba(0, 0, 0, 0.08)
- 内边距: 16px
- 分组卡片间距: 16px

悬停效果:
- 阴影加深: 0 4px 16px rgba(0, 0, 0, 0.12)
- 轻微上移: transform: translateY(-2px)
```

#### 表格设计
```
表头:
- 背景色: #F2F2F7
- 文字色: #8E8E93
- 字重: Semibold
- 高度: 44px

表格行:
- 高度: 52px
- 分割线: 1px solid #C6C6C8
- 悬停背景: #F2F2F7
- 选中背景: rgba(0, 122, 255, 0.1)

单元格:
- 内边距: 16px
- 文字色: #000000
- 次要文字色: #8E8E93
```

#### 导航设计
```
顶部导航栏:
- 高度: 64px
- 背景色: 毛玻璃效果 (backdrop-filter: blur(20px))
- 背景透明度: 0.8
- 底部分割线: 1px solid rgba(0, 0, 0, 0.1)

侧边导航:
- 宽度: 240px (展开) / 64px (收起)
- 背景色: #F2F2F7 (浅色模式) / #1C1C1E (深色模式)
- 图标大小: 24px
- 文字大小: 15px
- 菜单项高度: 44px
```

### 2.4.6 动效规范
```
过渡动画:
- 标准过渡: 200ms ease-in-out
- 快速过渡: 100ms ease-in-out
- 慢速过渡: 300ms ease-in-out

缓动函数:
- 标准缓动: cubic-bezier(0.4, 0.0, 0.2, 1)
- 减速缓动: cubic-bezier(0.0, 0.0, 0.2, 1)
- 加速缓动: cubic-bezier(0.4, 0.0, 1, 1)

动画效果:
- 淡入淡出: opacity 0 → 1
- 滑入滑出: transform translateY(20px) → translateY(0)
- 缩放: transform scale(0.95) → scale(1)
- 弹簧效果: spring animation (模态框、下拉菜单)
```

### 2.4.7 图标设计
```
图标规范:
- 尺寸: 16px / 20px / 24px / 32px
- 线宽: 1.5px / 2px
- 圆角: 圆角端点和连接点
- 颜色: 继承文本颜色或指定语义色

图标库:
- 使用 SF Symbols 风格图标
- Lucide React 作为备选
- 统一的视觉语言
```

### 2.4.8 响应式设计
```
断点系统:
- 移动端: < 768px
- 平板: 768px - 1024px
- 桌面: > 1024px

布局适配:
- 移动端: 单列布局，底部导航
- 平板: 双列布局，侧边导航可收起
- 桌面: 多列布局，侧边导航展开
```

### 2.4.9 深色模式支持
```
自动切换:
- 跟随系统设置 (prefers-color-scheme)
- 用户手动切换
- 记住用户偏好

颜色映射:
- 背景色: #FFFFFF ↔ #1C1C1E
- 卡片背景: #FFFFFF ↔ #2C2C2E
- 文本色: #000000 ↔ #FFFFFF
- 分割线: #C6C6C8 ↔ #38383A
```
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  postgres容器                                   │  │  │
│  │  │  - 端口: 5432                                   │  │  │
│  │  │  - 数据卷挂载                                   │  │  │
│  │  │  - 定时备份                                     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  redis容器                                      │  │  │
│  │  │  - 端口: 6379                                   │  │  │
│  │  │  - 数据持久化                                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 3. 模块设计

### 3.1 预算编制模块 (Budget Module)

#### 3.1.1 模块职责
- 管理预算模板配置
- 处理年度预算创建和初始化
- 提供预算数据录入和导入功能
- 管理预算审批流程

#### 3.1.2 核心类设计
| 类名 | 职责 | 主要方法 |
|------|------|----------|
| BudgetController | 预算相关API控制器 | create(), update(), submit(), approve(), reject() |
| BudgetService | 预算业务逻辑服务 | createBudget(), importBudget(), calculateBudget() |
| BudgetTemplateService | 预算模板管理服务 | createTemplate(), getTemplate(), validateTemplate() |
| BudgetApprovalService | 预算审批服务 | submitApproval(), processApproval(), getApprovalFlow() |
| Budget | 预算实体 | validate(), calculate(), updateStatus() |
| BudgetItem | 预算明细实体 | validate(), calculate() |
| BudgetRepository | 预算仓储 | save(), find(), update(), delete() |

#### 3.1.3 接口设计
```typescript
// 预算创建接口
interface CreateBudgetDto {
  fiscalYear: number;
  budgetType: 'CAPEX' | 'OPEX';
  departmentId: string;
  projectId?: string;
  items: BudgetItemDto[];
}

// 预算明细接口
interface BudgetItemDto {
  accountId: string;          // 预算科目ID
  accountName: string;        // 科目名称
  budgetAmount: number;       // 预算金额
  description?: string;       // 描述
  remark?: string;            // 备注
}

// 预算审批接口
interface BudgetApprovalDto {
  budgetId: string;
  action: 'submit' | 'approve' | 'reject';
  comment?: string;
  approverId: string;
}
```

### 3.2 预算执行模块 (Execution Module)

#### 3.2.1 模块职责
- 处理PR/PO/结算数据导入
- 管理预算执行数据关联
- 提供预算执行监控功能
- 生成预算预警信息

#### 3.2.2 核心类设计
| 类名 | 职责 | 主要方法 |
|------|------|----------|
| ExecutionController | 执行数据API控制器 | importPR(), importPO(), importSettlement(), getExecution() |
| DataImportService | 数据导入服务 | importPRData(), importPOData(), importSettlementData(), validateData() |
| ExecutionMonitorService | 执行监控服务 | calculateExecution(), getExecutionRate(), getRemainingBudget() |
| AlertService | 预警服务 | checkAlerts(), generateAlerts(), sendNotifications() |
| PRRecord | PR记录实体 | validate(), matchBudget() |
| PORecord | PO记录实体 | validate(), linkToPR() |
| SettlementRecord | 结算记录实体 | validate(), updateExecution() |

#### 3.2.3 接口设计
```typescript
// 数据导入接口
interface ImportDataDto {
  dataType: 'PR' | 'PO' | 'SETTLEMENT';
  file: Express.Multer.File;
  options?: ImportOptionsDto;
}

// 导入选项接口
interface ImportOptionsDto {
  skipValidation?: boolean;
  updateExisting?: boolean;
  notifyOnComplete?: boolean;
}

// 执行监控查询接口
interface ExecutionQueryDto {
  fiscalYear: number;
  departmentId?: string;
  projectId?: string;
  accountId?: string;
  period?: 'month' | 'quarter' | 'year';
}
```

### 3.3 预算调整模块 (Adjustment Module)

#### 3.3.1 模块职责
- 处理预算调整申请
- 管理调整审批流程
- 维护调整历史记录
- 更新预算数据

#### 3.3.2 核心类设计
| 类名 | 职责 | 主要方法 |
|------|------|----------|
| AdjustmentController | 调整API控制器 | apply(), approve(), reject(), getHistory() |
| AdjustmentService | 调整业务服务 | createAdjustment(), processAdjustment(), updateBudget() |
| AdjustmentApprovalService | 调整审批服务 | submitApproval(), processApproval() |
| AdjustmentHistoryService | 调整历史服务 | recordHistory(), getHistory(), exportHistory() |
| BudgetAdjustment | 预算调整实体 | validate(), calculate() |
| AdjustmentRecord | 调整记录实体 | record() |

#### 3.3.3 接口设计
```typescript
// 调整申请接口
interface CreateAdjustmentDto {
  budgetId: string;
  adjustmentType: 'ADD' | 'REDUCE' | 'TRANSFER' | 'CHANGE_ACCOUNT';
  amount: number;
  reason: string;
  reasonCategory: string;
  impactAnalysis?: string;
  attachments?: string[];
}

// 调整审批接口
interface AdjustmentApprovalDto {
  adjustmentId: string;
  action: 'approve' | 'reject';
  comment?: string;
  approverId: string;
}
```

### 3.4 预算分析模块 (Analysis Module)

#### 3.4.1 模块职责
- 执行预算差异分析
- 预测全年执行力
- 生成多维度报表
- 提供可视化数据

#### 3.4.2 核心类设计
| 类名 | 职责 | 主要方法 |
|------|------|----------|
| AnalysisController | 分析API控制器 | varianceAnalysis(), forecast(), getReport(), getDashboard() |
| VarianceAnalysisService | 差异分析服务 | calculateVariance(), analyzeByDimension(), exportReport() |
| ForecastService | 预测服务 | forecastExecution(), calculateExecutionForce() |
| ReportService | 报表服务 | generateReport(), exportReport(), getReportTemplates() |
| DashboardService | 仪表板服务 | getOverview(), getCharts(), getAlerts() |

#### 3.4.3 接口设计
```typescript
// 差异分析查询接口
interface VarianceQueryDto {
  fiscalYear: number;
  period: 'month' | 'quarter' | 'year';
  periodValue: number;
  dimension: 'department' | 'project' | 'account';
  filters?: FilterDto[];
}

// 预测查询接口
interface ForecastQueryDto {
  fiscalYear: number;
  method: 'historical' | 'trend' | 'progress';
  dimension?: 'department' | 'project' | 'account';
}

// 报表生成接口
interface ReportQueryDto {
  reportType: 'summary' | 'detail' | 'variance' | 'adjustment' | 'trend';
  fiscalYear: number;
  filters?: FilterDto[];
  format?: 'json' | 'excel' | 'pdf';
}
```

### 3.5 基础数据模块 (Master Data Module)

#### 3.5.1 模块职责
- 管理组织架构数据
- 维护IPD项目信息
- 管理预算科目体系
- 配置数据导入模板

#### 3.5.2 核心类设计
| 类名 | 职责 | 主要方法 |
|------|------|----------|
| OrganizationController | 组织架构API控制器 | create(), update(), getTree(), import() |
| ProjectController | 项目API控制器 | create(), update(), getProjects(), import() |
| AccountController | 科目API控制器 | create(), update(), getTree(), import() |
| TemplateController | 模板API控制器 | create(), update(), download(), validate() |
| Organization | 组织实体 | validate(), buildTree() |
| IPDProject | 项目实体 | validate() |
| BudgetAccount | 科目实体 | validate(), buildTree() |

### 3.6 系统管理模块 (System Module)

#### 3.6.1 模块职责
- 用户认证和授权
- 角色权限管理
- 系统配置管理
- 操作日志记录

#### 3.6.2 核心类设计
| 类名 | 职责 | 主要方法 |
|------|------|----------|
| AuthController | 认证API控制器 | login(), logout(), refreshToken(), getCurrentUser() |
| UserController | 用户API控制器 | create(), update(), getUsers(), assignRole() |
| RoleController | 角色API控制器 | create(), update(), getRoles(), assignPermissions() |
| ConfigController | 配置API控制器 | get(), update(), getByCategory() |
| LogController | 日志API控制器 | query(), export(), getStatistics() |
| AuthService | 认证服务 | validateUser(), generateToken(), verifyToken() |
| PermissionService | 权限服务 | checkPermission(), getUserPermissions() |
| LogService | 日志服务 | record(), query(), export() |

## 4. 数据设计

### 4.1 概念模型
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Organization│       │  IPDProject │       │BudgetAccount│
│  (组织架构) │       │  (IPD项目)  │       │ (预算科目)  │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │                     │                     │
       └──────────┬──────────┴──────────┬─────────┘
                  │                     │
           ┌──────┴──────┐       ┌──────┴──────┐
           │    Budget   │       │   Budget    │
           │  (预算主表) │◄──────│    Item     │
           └──────┬──────┘       │ (预算明细)  │
                  │              └─────────────┘
                  │
       ┌──────────┼──────────┬──────────┐
       │          │          │          │
┌──────┴───┐ ┌────┴────┐ ┌──┴────┐ ┌───┴─────┐
│PRRecord  │ │PORecord │ │Settle │ │Adjust   │
│(PR记录)  │ │(PO记录) │ │Record │ │ment     │
└──────────┘ └─────────┘ │(结算) │ │(调整)   │
                          └───────┘ └─────────┘
```

### 4.2 逻辑模型

#### 4.2.1 组织架构表 (organizations)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 组织编码 |
| name | VARCHAR(100) | NOT NULL | 组织名称 |
| parent_id | UUID | FK | 上级组织ID |
| org_level | INTEGER | NOT NULL | 组织层级(1:公司,2:一级部门,3:二级部门) |
| cost_center | VARCHAR(50) | | 成本中心 |
| manager_id | UUID | FK | 负责人ID |
| status | VARCHAR(20) | NOT NULL | 状态(active/inactive) |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| created_by | UUID | FK | 创建人ID |

#### 4.2.2 IPD项目表 (ipd_projects)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| project_code | VARCHAR(50) | UNIQUE, NOT NULL | 项目编号 |
| project_name | VARCHAR(200) | NOT NULL | 项目名称 |
| project_type | VARCHAR(50) | NOT NULL | 项目类型 |
| parent_id | UUID | FK | 父项目ID |
| manager_id | UUID | FK | 项目负责人ID |
| start_date | DATE | | 开始日期 |
| end_date | DATE | | 结束日期 |
| status | VARCHAR(20) | NOT NULL | 状态(planning/ongoing/completed/paused) |
| budget_amount | DECIMAL(15,2) | | 项目预算 |
| description | TEXT | | 项目描述 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 4.2.3 预算科目表 (budget_accounts)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| account_code | VARCHAR(50) | UNIQUE, NOT NULL | 科目编码 |
| account_name | VARCHAR(100) | NOT NULL | 科目名称 |
| account_type | VARCHAR(20) | NOT NULL | 科目类型(CAPEX/OPEX) |
| parent_id | UUID | FK | 上级科目ID |
| account_level | INTEGER | NOT NULL | 科目层级 |
| is_leaf | BOOLEAN | NOT NULL | 是否叶节点 |
| status | VARCHAR(20) | NOT NULL | 状态(active/inactive) |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 4.2.4 预算主表 (budgets)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| budget_no | VARCHAR(50) | UNIQUE, NOT NULL | 预算编号 |
| fiscal_year | INTEGER | NOT NULL | 财务年度 |
| budget_type | VARCHAR(20) | NOT NULL | 预算类型(CAPEX/OPEX) |
| department_id | UUID | FK, NOT NULL | 部门ID |
| project_id | UUID | FK | 项目ID |
| total_amount | DECIMAL(15,2) | NOT NULL | 预算总金额 |
| executed_amount | DECIMAL(15,2) | DEFAULT 0 | 已执行金额 |
| remaining_amount | DECIMAL(15,2) | | 剩余金额 |
| execution_rate | DECIMAL(5,2) | | 执行率(%) |
| status | VARCHAR(20) | NOT NULL | 状态(draft/submitted/approved/rejected) |
| version | INTEGER | DEFAULT 1 | 版本号 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| created_by | UUID | FK | 创建人ID |
| approved_by | UUID | FK | 审批人ID |
| approved_at | TIMESTAMP | | 审批时间 |

#### 4.2.5 预算明细表 (budget_items)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| budget_id | UUID | FK, NOT NULL | 预算主表ID |
| account_id | UUID | FK, NOT NULL | 科目ID |
| item_name | VARCHAR(200) | NOT NULL | 项目名称 |
| budget_amount | DECIMAL(15,2) | NOT NULL | 预算金额 |
| executed_amount | DECIMAL(15,2) | DEFAULT 0 | 已执行金额 |
| description | TEXT | | 描述 |
| remark | TEXT | | 备注 |
| line_no | INTEGER | NOT NULL | 行号 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 4.2.6 PR记录表 (pr_records)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| pr_no | VARCHAR(50) | UNIQUE, NOT NULL | PR编号 |
| department_id | UUID | FK | 申请部门ID |
| project_id | UUID | FK | 项目ID |
| request_date | DATE | NOT NULL | 申请日期 |
| material_desc | VARCHAR(500) | | 物料描述 |
| quantity | DECIMAL(10,2) | | 数量 |
| unit_price | DECIMAL(15,2) | | 单价 |
| total_amount | DECIMAL(15,2) | NOT NULL | 总金额 |
| budget_id | UUID | FK | 关联预算ID |
| match_status | VARCHAR(20) | | 匹配状态(matched/partial/unmatched) |
| status | VARCHAR(20) | NOT NULL | PR状态 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| imported_at | TIMESTAMP | NOT NULL | 导入时间 |
| imported_by | UUID | FK | 导入人ID |

#### 4.2.7 PO记录表 (po_records)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| po_no | VARCHAR(50) | UNIQUE, NOT NULL | PO编号 |
| pr_no | VARCHAR(50) | FK | 关联PR编号 |
| vendor_name | VARCHAR(200) | | 供应商名称 |
| order_date | DATE | NOT NULL | 订单日期 |
| total_amount | DECIMAL(15,2) | NOT NULL | 总金额 |
| status | VARCHAR(20) | NOT NULL | PO状态 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| imported_at | TIMESTAMP | NOT NULL | 导入时间 |
| imported_by | UUID | FK | 导入人ID |

#### 4.2.8 结算记录表 (settlement_records)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| settlement_no | VARCHAR(50) | UNIQUE, NOT NULL | 结算单号 |
| po_no | VARCHAR(50) | FK | 关联PO编号 |
| settlement_date | DATE | NOT NULL | 结算日期 |
| settlement_amount | DECIMAL(15,2) | NOT NULL | 结算金额 |
| invoice_no | VARCHAR(50) | | 发票号 |
| status | VARCHAR(20) | NOT NULL | 结算状态 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| imported_at | TIMESTAMP | NOT NULL | 导入时间 |
| imported_by | UUID | FK | 导入人ID |

#### 4.2.9 预算调整表 (budget_adjustments)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| adjustment_no | VARCHAR(50) | UNIQUE, NOT NULL | 调整单号 |
| budget_id | UUID | FK, NOT NULL | 预算ID |
| adjustment_type | VARCHAR(20) | NOT NULL | 调整类型(ADD/REDUCE/TRANSFER/CHANGE_ACCOUNT) |
| original_amount | DECIMAL(15,2) | NOT NULL | 原预算金额 |
| adjustment_amount | DECIMAL(15,2) | NOT NULL | 调整金额 |
| new_amount | DECIMAL(15,2) | NOT NULL | 调整后金额 |
| reason | TEXT | NOT NULL | 调整原因 |
| reason_category | VARCHAR(50) | | 原因分类 |
| impact_analysis | TEXT | | 影响分析 |
| status | VARCHAR(20) | NOT NULL | 状态(draft/submitted/approved/rejected) |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| created_by | UUID | FK | 申请人ID |
| approved_by | UUID | FK | 审批人ID |
| approved_at | TIMESTAMP | | 审批时间 |

#### 4.2.10 用户表 (users)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | 密码(加密) |
| real_name | VARCHAR(100) | NOT NULL | 真实姓名 |
| email | VARCHAR(100) | | 邮箱 |
| phone | VARCHAR(20) | | 电话 |
| department_id | UUID | FK | 部门ID |
| status | VARCHAR(20) | NOT NULL | 状态(active/inactive) |
| last_login_at | TIMESTAMP | | 最后登录时间 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 4.2.11 角色表 (roles)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| role_code | VARCHAR(50) | UNIQUE, NOT NULL | 角色编码 |
| role_name | VARCHAR(100) | NOT NULL | 角色名称 |
| description | TEXT | | 描述 |
| is_system | BOOLEAN | DEFAULT FALSE | 是否系统角色 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 4.2.12 操作日志表 (operation_logs)
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | UUID | PK | 主键ID |
| user_id | UUID | FK, NOT NULL | 用户ID |
| username | VARCHAR(50) | NOT NULL | 用户名 |
| operation_type | VARCHAR(50) | NOT NULL | 操作类型 |
| operation_desc | VARCHAR(200) | | 操作描述 |
| resource_type | VARCHAR(50) | | 资源类型 |
| resource_id | UUID | | 资源ID |
| request_method | VARCHAR(10) | | 请求方法 |
| request_url | VARCHAR(500) | | 请求URL |
| request_params | TEXT | | 请求参数 |
| response_status | INTEGER | | 响应状态码 |
| ip_address | VARCHAR(50) | | IP地址 |
| user_agent | VARCHAR(500) | | 用户代理 |
| execution_time | INTEGER | | 执行时间(ms) |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

### 4.3 物理模型

#### 4.3.1 索引设计
```sql
-- 预算主表索引
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_department ON budgets(department_id);
CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_type_year ON budgets(budget_type, fiscal_year);

-- 预算明细表索引
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX idx_budget_items_account ON budget_items(account_id);

-- PR记录索引
CREATE INDEX idx_pr_records_date ON pr_records(request_date);
CREATE INDEX idx_pr_records_department ON pr_records(department_id);
CREATE INDEX idx_pr_records_budget ON pr_records(budget_id);

-- PO记录索引
CREATE INDEX idx_po_records_pr ON po_records(pr_no);
CREATE INDEX idx_po_records_date ON po_records(order_date);

-- 结算记录索引
CREATE INDEX idx_settlement_po ON settlement_records(po_no);
CREATE INDEX idx_settlement_date ON settlement_records(settlement_date);

-- 调整记录索引
CREATE INDEX idx_adjustments_budget ON budget_adjustments(budget_id);
CREATE INDEX idx_adjustments_status ON budget_adjustments(status);
CREATE INDEX idx_adjustments_date ON budget_adjustments(created_at);

-- 操作日志索引
CREATE INDEX idx_logs_user ON operation_logs(user_id);
CREATE INDEX idx_logs_type ON operation_logs(operation_type);
CREATE INDEX idx_logs_date ON operation_logs(created_at);
```

#### 4.3.2 分区策略
- 操作日志表按月分区，便于历史数据归档
- PR/PO/结算记录按年分区，提升查询性能

### 4.4 数据字典

#### 预算类型 (budget_type)
| 值 | 说明 |
|----|------|
| CAPEX | 资本性支出 |
| OPEX | 运营性支出 |

#### 预算状态 (budget_status)
| 值 | 说明 |
|----|------|
| draft | 草稿 |
| submitted | 已提交 |
| approved | 已批准 |
| rejected | 已驳回 |

#### 调整类型 (adjustment_type)
| 值 | 说明 |
|----|------|
| ADD | 预算追加 |
| REDUCE | 预算调减 |
| TRANSFER | 预算调剂 |
| CHANGE_ACCOUNT | 科目变更 |

## 5. 接口设计

### 5.1 API接口列表

#### 预算管理接口
| 接口名称 | HTTP方法 | 路径 | 说明 |
|----------|----------|------|------|
| 创建预算 | POST | /api/v1/budgets | 创建新的预算 |
| 获取预算列表 | GET | /api/v1/budgets | 查询预算列表 |
| 获取预算详情 | GET | /api/v1/budgets/:id | 查询预算详情 |
| 更新预算 | PUT | /api/v1/budgets/:id | 更新预算信息 |
| 删除预算 | DELETE | /api/v1/budgets/:id | 删除预算(草稿状态) |
| 提交审批 | POST | /api/v1/budgets/:id/submit | 提交预算审批 |
| 审批预算 | POST | /api/v1/budgets/:id/approve | 审批预算 |
| 导入预算 | POST | /api/v1/budgets/import | Excel导入预算 |
| 导出预算 | GET | /api/v1/budgets/export | 导出预算数据 |

#### 执行管理接口
| 接口名称 | HTTP方法 | 路径 | 说明 |
|----------|----------|------|------|
| 导入PR数据 | POST | /api/v1/execution/pr/import | 导入PR数据 |
| 导入PO数据 | POST | /api/v1/execution/po/import | 导入PO数据 |
| 导入结算数据 | POST | /api/v1/execution/settlement/import | 导入结算数据 |
| 获取执行监控 | GET | /api/v1/execution/monitor | 查询执行监控数据 |
| 获取预警列表 | GET | /api/v1/execution/alerts | 查询预警信息 |

#### 调整管理接口
| 接口名称 | HTTP方法 | 路径 | 说明 |
|----------|----------|------|------|
| 创建调整申请 | POST | /api/v1/adjustments | 创建调整申请 |
| 获取调整列表 | GET | /api/v1/adjustments | 查询调整列表 |
| 审批调整 | POST | /api/v1/adjustments/:id/approve | 审批调整申请 |
| 获取调整历史 | GET | /api/v1/adjustments/history | 查询调整历史 |

#### 分析报表接口
| 接口名称 | HTTP方法 | 路径 | 说明 |
|----------|----------|------|------|
| 差异分析 | GET | /api/v1/analysis/variance | 执行差异分析 |
| 执行力预测 | GET | /api/v1/analysis/forecast | 预测全年执行力 |
| 生成报表 | GET | /api/v1/analysis/report | 生成分析报表 |
| 获取仪表板 | GET | /api/v1/analysis/dashboard | 获取仪表板数据 |

#### 基础数据接口
| 接口名称 | HTTP方法 | 路径 | 说明 |
|----------|----------|------|------|
| 获取组织树 | GET | /api/v1/organizations/tree | 获取组织架构树 |
| 获取项目列表 | GET | /api/v1/projects | 查询项目列表 |
| 获取科目树 | GET | /api/v1/accounts/tree | 获取科目树 |

#### 系统管理接口
| 接口名称 | HTTP方法 | 路径 | 说明 |
|----------|----------|------|------|
| 用户登录 | POST | /api/v1/auth/login | 用户登录认证 |
| 用户登出 | POST | /api/v1/auth/logout | 用户登出 |
| 获取当前用户 | GET | /api/v1/auth/current | 获取当前登录用户 |
| 获取用户列表 | GET | /api/v1/users | 查询用户列表 |
| 获取角色列表 | GET | /api/v1/roles | 查询角色列表 |

### 5.2 接口详细设计

#### 5.2.1 创建预算
**请求**:
```json
POST /api/v1/budgets
Content-Type: application/json
Authorization: Bearer {token}

{
  "fiscalYear": 2025,
  "budgetType": "CAPEX",
  "departmentId": "uuid-dept-001",
  "projectId": "uuid-proj-001",
  "items": [
    {
      "accountId": "uuid-account-001",
      "itemName": "设备采购",
      "budgetAmount": 1000000.00,
      "description": "生产设备采购",
      "remark": "Q1采购"
    }
  ]
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid-budget-001",
    "budgetNo": "CAP-2025-0001",
    "fiscalYear": 2025,
    "budgetType": "CAPEX",
    "totalAmount": 1000000.00,
    "status": "draft",
    "createdAt": "2025-01-18T10:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限 |
| 409 | 预算编号冲突 |

#### 5.2.2 导入PR数据
**请求**:
```json
POST /api/v1/execution/pr/import
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [Excel文件]
options: {
  "skipValidation": false,
  "updateExisting": false
}
```

**响应**:
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "message": "PR编号已存在"
      }
    ]
  }
}
```

#### 5.2.3 差异分析
**请求**:
```json
GET /api/v1/analysis/variance?fiscalYear=2025&period=month&periodValue=1&dimension=department
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "fiscalYear": 2025,
    "period": "month",
    "periodValue": 1,
    "dimension": "department",
    "items": [
      {
        "dimensionId": "uuid-dept-001",
        "dimensionName": "研发一部",
        "budgetAmount": 1000000.00,
        "executedAmount": 800000.00,
        "variance": 200000.00,
        "varianceRate": 20.00,
        "executionRate": 80.00
      }
    ]
  }
}
```

## 6. 业务流程设计

### 6.1 预算编制流程
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 创建预算  │───►│ 填写明细  │───►│ 提交审批  │───►│ 审批流程  │
│ (草稿)    │    │          │    │ (待审批)  │    │          │
└──────────┘    └──────────┘    └──────────┘    └─────┬────┘
                                                      │
                    ┌─────────────────────────────────┴────┐
                    │                                      │
              ┌─────▼─────┐                          ┌─────▼─────┐
              │ 审批通过   │                          │ 审批驳回   │
              │ (已批准)   │                          │ (已驳回)   │
              └───────────┘                          └───────────┘
```

### 6.2 数据导入流程
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 上传文件  │───►│ 解析数据  │───►│ 数据校验  │───►│ 匹配预算  │
└──────────┘    └──────────┘    └──────────┘    └─────┬────┘
                                                      │
                    ┌─────────────────────────────────┴────┐
                    │                                      │
              ┌─────▼─────┐                          ┌─────▼─────┐
              │ 保存数据   │                          │ 返回错误   │
              │ 更新执行   │                          │ 记录日志   │
              └───────────┘                          └───────────┘
```

### 6.3 预算调整流程
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 申请调整  │───►│ 填写原因  │───►│ 提交审批  │───►│ 审批流程  │
└──────────┘    └──────────┘    └──────────┘    └─────┬────┘
                                                      │
                    ┌─────────────────────────────────┴────┐
                    │                                      │
              ┌─────▼─────┐                          ┌─────▼─────┐
              │ 审批通过   │                          │ 审批驳回   │
              │ 更新预算   │                          │ 记录历史   │
              │ 记录历史   │                          └───────────┘
              └───────────┘
```

## 7. 安全设计

### 7.1 认证机制
- **JWT认证**: 使用JWT进行用户身份认证
- **Token刷新**: 支持Token刷新机制，避免频繁登录
- **会话管理**: Redis存储会话信息，支持会话超时和强制登出
- **密码策略**: 密码加密存储(bcrypt)，支持密码强度验证

**认证流程**:
```
1. 用户提交用户名和密码
2. 服务端验证用户信息
3. 生成JWT Token (access_token + refresh_token)
4. 返回Token给客户端
5. 客户端后续请求携带Token
6. 服务端验证Token有效性
7. Token过期时使用refresh_token刷新
```

### 7.2 授权机制
- **RBAC模型**: 基于角色的访问控制
- **权限粒度**: 菜单权限 + 操作权限 + 数据权限
- **数据权限**: 按部门、项目维度控制数据访问范围
- **权限校验**: 路由守卫 + 方法装饰器双重校验

**权限模型**:
```
用户 ──► 角色 ──► 权限
  │                  │
  └──► 数据范围 ◄────┘
```

### 7.3 数据安全
- **传输加密**: 全站HTTPS，防止中间人攻击
- **密码加密**: bcrypt加密存储，salt rounds = 10
- **敏感数据脱敏**: 日志中脱敏敏感信息
- **SQL注入防护**: 使用ORM参数化查询
- **XSS防护**: 输入数据转义处理
- **CSRF防护**: Token验证机制

## 8. 性能设计

### 8.1 性能指标
| 指标名称 | 目标值 | 测试方法 |
|----------|--------|----------|
| 页面加载时间 | < 2秒 | Lighthouse性能测试 |
| API响应时间 | < 500ms | 接口性能测试 |
| 报表生成时间 | < 5秒 | 大数据量报表测试 |
| 数据导入速度 | > 100条/秒 | 批量导入测试 |
| 并发用户数 | > 50 | 并发压力测试 |
| 数据库查询时间 | < 100ms | 慢查询分析 |

### 8.2 优化策略

#### 8.2.1 缓存策略
- **应用缓存**: Redis缓存热点数据
  - 用户权限信息缓存 (TTL: 30分钟)
  - 组织架构树缓存 (TTL: 1小时)
  - 科目树缓存 (TTL: 1小时)
  - 预算汇总数据缓存 (TTL: 5分钟)

- **数据库缓存**: PostgreSQL内置缓存
  - shared_buffers = 256MB
  - effective_cache_size = 1GB

- **前端缓存**:
  - 静态资源CDN缓存
  - LocalStorage缓存用户配置

#### 8.2.2 查询优化
- 合理使用索引，避免全表扫描
- 复杂查询使用查询计划分析
- 大数据量查询使用分页
- 统计查询使用物化视图

#### 8.2.3 异步处理
- 数据导入使用后台任务队列
- 报表生成使用异步任务
- 预警通知使用消息队列
- 日志记录使用异步写入

## 9. 可靠性设计

### 9.1 容错机制
- **异常捕获**: 全局异常过滤器统一处理
- **错误重试**: 关键操作支持自动重试
- **降级处理**: 非核心功能失败时降级处理
- **熔断机制**: 外部服务调用熔断保护

### 9.2 备份恢复
- **数据备份**:
  - 每日全量备份 + 实时增量备份
  - 备份文件保留30天
  - 异地备份容灾

- **数据恢复**:
  - 支持指定时间点恢复
  - 恢复演练每季度一次

### 9.3 监控告警
- **应用监控**:
  - 接口响应时间监控
  - 错误率监控
  - 并发数监控

- **系统监控**:
  - CPU、内存、磁盘使用率
  - 数据库连接数
  - Redis连接数

- **告警规则**:
  - 接口错误率 > 5% 告警
  - 响应时间 > 3秒 告警
  - CPU使用率 > 80% 告警
  - 磁盘使用率 > 85% 告警

## 10. 技术风险

| 风险项 | 影响程度 | 应对策略 |
|--------|----------|----------|
| 数据导入性能问题 | 高 | 使用流式处理、分批导入、异步处理 |
| 预算匹配准确性 | 高 | 提供手工匹配功能、优化匹配算法 |
| 大数据量报表生成 | 中 | 使用异步生成、缓存结果、分页展示 |
| 并发数据冲突 | 中 | 使用乐观锁、事务管理、分布式锁 |
| 历史数据迁移 | 中 | 提供数据迁移工具、分批迁移 |
| 用户权限复杂度 | 低 | 简化权限模型、提供权限配置界面 |

## 附录

### A. 技术选型对比

#### 前端框架对比
| 框架 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| React | 生态丰富、组件化、TypeScript支持好 | 学习曲线较陡 | **选择** |
| Vue | 易学易用、文档完善 | 生态相对较小 | 备选 |
| Angular | 完整框架、企业级 | 过于复杂、学习成本高 | 不选择 |

#### 后端框架对比
| 框架 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| NestJS | 企业级、模块化、TypeScript原生 | 相对较新 | **选择** |
| Express | 灵活、生态丰富 | 缺乏约束、需要自己组织 | 备选 |
| FastAPI | 高性能、Python生态 | Python性能相对较低 | 备选 |

#### 数据库对比
| 数据库 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| PostgreSQL | 功能强大、支持JSON、开源 | 运维复杂度较高 | **选择** |
| MySQL | 成熟稳定、生态丰富 | 功能相对较少 | 备选 |
| MongoDB | 灵活、高性能 | 不支持事务、关系处理弱 | 不选择 |

### B. 设计决策记录
| 决策项 | 选择方案 | 决策理由 |
|--------|----------|----------|
| 前后端分离 | 是 | 提升开发效率、便于前后端独立部署 |
| RESTful API | 是 | 标准化接口设计、便于对接 |
| JWT认证 | 是 | 无状态、支持分布式部署 |
| Redis缓存 | 是 | 提升性能、支持会话管理 |
| Docker部署 | 是 | 标准化部署、环境一致性 |
| Excel导入 | 是 | 用户习惯、采购系统不开放API |

### C. 变更历史
| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2025-01-18 | 初始版本 | SDD Agent |
