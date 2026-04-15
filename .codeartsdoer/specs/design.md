# 项目技术栈概述

## 技术栈选择

### 前端技术
- **框架**: React 18+ 或 Vue 3+
- **UI组件库**: Ant Design 或 Element Plus
- **状态管理**: Redux Toolkit 或 Pinia
- **图表库**: ECharts 或 Chart.js
- **表格组件**: AG-Grid 或 Ant Design Table
- **构建工具**: Vite

### 后端技术
- **运行时**: Node.js 18+ 或 Python 3.10+
- **框架**: NestJS (Node.js) 或 FastAPI (Python)
- **ORM**: TypeORM 或 SQLAlchemy
- **认证**: JWT + Passport.js 或 OAuth2
- **API文档**: Swagger/OpenAPI

### 数据库
- **主数据库**: PostgreSQL 15+ 或 MySQL 8+
- **缓存**: Redis
- **文件存储**: MinIO 或 本地文件系统

### 数据处理
- **Excel处理**: ExcelJS (Node.js) 或 openpyxl (Python)
- **数据验证**: Joi (Node.js) 或 Pydantic (Python)
- **任务调度**: node-cron 或 Celery

### 部署方案
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **进程管理**: PM2 (Node.js) 或 Gunicorn (Python)

### 开发工具
- **版本控制**: Git
- **代码规范**: ESLint + Prettier 或 Black + Flake8
- **测试框架**: Jest 或 Pytest
- **API测试**: Postman 或 Insomnia

## 技术决策理由

### 为什么选择React/Vue
- 成熟的生态系统
- 丰富的企业级组件库
- 良好的性能和开发体验

### 为什么选择NestJS/FastAPI
- 企业级框架，支持模块化开发
- 内置依赖注入和装饰器
- 完善的TypeScript支持
- 自动生成API文档

### 为什么选择PostgreSQL
- 强大的查询能力
- 支持JSON数据类型
- 优秀的并发性能
- 开源免费

### 为什么选择Redis
- 高性能缓存
- 支持会话管理
- 支持消息队列
- 支持分布式锁

## 技术约束
- 前后端分离架构
- RESTful API设计
- 数据库迁移管理
- 代码版本管理
- 自动化测试覆盖
