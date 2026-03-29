# 企业级预算管理系统 - 后端服务

基于 NestJS + Prisma + PostgreSQL 的企业级后端服务

## 技术栈

- **运行时**: Node.js 20 LTS
- **框架**: NestJS 10
- **ORM**: Prisma
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7
- **认证**: JWT + Passport.js
- **文件存储**: MinIO (兼容 S3)
- **API 文档**: Swagger / OpenAPI 3.0

## 项目结构

```
server/
├── src/
│   ├── modules/           # 业务模块
│   │   ├── auth/         # 认证授权
│   │   ├── user/         # 用户管理
│   │   ├── department/   # 部门管理
│   │   ├── budget/       # 预算管理
│   │   ├── purchase/     # 采购管理
│   │   ├── workflow/     # 工作流引擎
│   │   ├── approval/     # 审批管理
│   │   ├── notification/ # 通知系统
│   │   ├── report/       # 报表模块
│   │   ├── import-export/# 导入导出
│   │   ├── audit/        # 审计日志
│   │   └── system/       # 系统配置
│   ├── common/           # 公共模块
│   │   ├── prisma/       # Prisma 服务
│   │   ├── redis/        # Redis 服务
│   │   ├── filters/      # 异常过滤器
│   │   ├── interceptors/ # 拦截器
│   │   ├── guards/       # 守卫
│   │   └── pipes/        # 管道
│   ├── config/           # 配置文件
│   ├── prisma/           # Prisma Schema
│   ├── app.module.ts     # 根模块
│   └── main.ts           # 入口文件
├── test/                 # 测试文件
├── docker-compose.yml    # Docker 编排
├── .env                  # 环境变量
└── package.json
```

## 快速开始

### 1. 环境要求

- Node.js >= 20
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### 2. 安装依赖

```bash
cd server
npm install
```

### 3. 启动基础设施（Docker）

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL (端口 5432)
- Redis (端口 6379)
- MinIO (端口 9000, 9001)

### 4. 配置环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

### 5. 数据库迁移

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# （可选）种子数据
npm run prisma:seed
```

### 6. 启动开发服务器

```bash
npm run start:dev
```

访问：
- API: http://localhost:3000
- Swagger 文档：http://localhost:3000/api/docs

## 可用命令

```bash
# 开发
npm run start:dev          # 热重载启动
npm run start:debug        # 调试模式

# 构建
npm run build              # 编译 TypeScript

# 生产
npm run start:prod         # 生产环境启动

# 数据库
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 运行迁移
npm run prisma:studio      # Prisma Studio GUI
npm run prisma:seed        # 种子数据

# 测试
npm run test               # 单元测试
npm run test:e2e           # E2E 测试
```

## API 设计

### RESTful 规范

所有 API 遵循 RESTful 风格：

- `GET /api/resource` - 获取资源列表
- `GET /api/resource/:id` - 获取单个资源
- `POST /api/resource` - 创建资源
- `PUT /api/resource/:id` - 更新资源
- `DELETE /api/resource/:id` - 删除资源

### 统一响应格式

```typescript
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-03-27T12:00:00.000Z"
}
```

### 分页参数

```typescript
GET /api/resource?page=1&pageSize=20&sortBy=name&sortOrder=asc
```

## 开发指南

### 创建新模块

使用 NestJS CLI：

```bash
npx nest g module modules/new-module
npx nest g controller modules/new-module
npx nest g service modules/new-module
```

### 数据库操作

```typescript
// 注入 Prisma 服务
constructor(private prisma: PrismaService) {}

// CRUD 操作
await this.prisma.user.findMany();
await this.prisma.user.create({ data });
await this.prisma.user.update({ where, data });
await this.prisma.user.delete({ where });
```

## 下一步计划

按照以下顺序逐步实现各模块：

1. ✅ Task 1: 前端架构重构
2. 🔄 Task 2: 后端项目初始化（进行中）
3. ⏳ Task 3: 认证授权模块
4. ⏳ Task 4: 部门管理模块
5. ⏳ Task 5: 预算管理模块
6. ⏳ Task 6: 采购申请模块
7. ⏳ Task 7: 工作流审批引擎
8. ⏳ Task 8: 通知系统
9. ⏳ Task 9: 导入导出模块
10. ⏳ Task 10: 报表与分析模块
11. ⏳ Task 11: 审计日志系统
12. ⏳ Task 12: 系统管理增强
13. ⏳ Task 13: UI/UX 全面提升
14. ⏳ Task 14: 测试与质量保障
15. ⏳ Task 15: 部署与运维配置

## 许可证

MIT
