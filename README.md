# 半导体研发企业预算管理系统

## 项目简介

本系统是为半导体研发企业研发部门预算管理员构建的一套完整的预算管理系统，涵盖Capex/Opex年度预算编制、执行监控、调整管理和差异分析等核心功能。

## 核心功能

- **预算编制管理**：Capex/Opex年度预算编制、审批流程
- **预算执行控制**：PR/PO/财务结算数据导入、执行监控、预算预警
- **预算调整管理**：预算调整申请、审批、历史追溯
- **预算分析报告**：差异分析、执行力预估、多维度报表、可视化仪表板
- **基础数据管理**：组织架构、IPD项目、预算科目管理
- **系统管理**：用户权限、系统配置、操作日志

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5.x
- Tailwind CSS + styled-components
- ECharts 5.x
- Redux Toolkit
- Ant Design 5.x (苹果风格定制)

### 后端
- NestJS 10 + TypeScript
- TypeORM
- PostgreSQL 15+
- Redis 7.x
- JWT + Passport

### 部署
- Docker + Docker Compose
- Nginx

## 项目结构

```
budget_management_system/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/    # UI组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   ├── store/         # 状态管理
│   │   ├── styles/        # 样式
│   │   └── utils/         # 工具函数
│   └── public/
├── backend/           # 后端项目
│   ├── src/
│   │   ├── modules/       # 功能模块
│   │   ├── common/        # 公共模块
│   │   ├── config/        # 配置
│   │   └── database/      # 数据库
│   └── migrations/
├── docs/              # 文档
├── .codeartsdoer/     # SDD文档
└── docker-compose.yml
```

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (可选)

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

### 配置环境变量

```bash
# 后端配置
cp backend/.env.example backend/.env
# 编辑 .env 文件，配置数据库连接等

# 前端配置
cp frontend/.env.example frontend/.env
```

### 启动开发服务器

```bash
# 使用Docker启动
docker-compose up -d

# 或手动启动
# 后端
cd backend
npm run start:dev

# 前端
cd frontend
npm run dev
```

### 访问系统

- 前端：http://localhost:5173
- 后端API：http://localhost:3000
- API文档：http://localhost:3000/api

## 开发指南

### 代码规范
- 使用ESLint + Prettier进行代码格式化
- 遵循TypeScript最佳实践
- 提交代码前运行 `npm run lint`

### 分支管理
- main: 生产分支
- develop: 开发分支
- feature/*: 功能分支
- hotfix/*: 修复分支

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

## 文档

- [需求规格文档](./.codeartsdoer/specs/budget_management_system/spec.md)
- [技术设计文档](./.codeartsdoer/specs/budget_management_system/design.md)
- [任务规划文档](./.codeartsdoer/specs/budget_management_system/tasks.md)

## 许可证

MIT

## 联系方式

项目维护者：研发部门预算管理团队
