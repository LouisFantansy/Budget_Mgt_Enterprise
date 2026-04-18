# 企业级预算管理系统

<p align="center">
  <img src="frontend/public/logo.svg" alt="Logo" width="120">
</p>

<p align="center">
  <strong>Enterprise Budget Management System</strong>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#文档">文档</a> •
  <a href="#部署">部署</a>
</p>

---

## 📋 项目简介

一套功能完整、技术先进的企业级预算管理系统，专为半导体研发企业设计。实现预算管理的全流程自动化和智能化，包括预算编制、审批流程、执行监控、采购管理等功能。

## ✨ 特性

- 🏢 **部门层级管理**：三级部门树形结构，完整的 CRUD 功能
- 💰 **预算管理**：Opex/Capex 分类，版本控制，执行率计算
- 📝 **采购申请**：在线提交，关联预算，多级审批流程
- 📊 **预算监控**：实时占用追踪，智能预警
- 📈 **报表分析**：多维度汇总，数据钻取，可视化图表
- 🔔 **消息通知**：实时通知审批状态变更
- 🎨 **苹果风格设计**：现代化 UI，响应式布局
- 👤 **用户头像**：支持头像上传和更换

## 🛠️ 技术栈

### 后端
| 技术 | 版本 | 说明 |
|-----|------|------|
| **Django** | 4.2+ | Python Web 框架 |
| **Django REST Framework** | 3.14+ | RESTful API 框架 |
| **MySQL** | 8.0+ | 关系型数据库 |
| **Redis** | 7.0+ | 缓存和消息队列 |
| **JWT** | - | 用户认证 |
| **Celery** | 5.3+ | 异步任务处理 |

### 前端
| 技术 | 版本 | 说明 |
|-----|------|------|
| **Vue 3** | 3.4+ | 前端框架 |
| **TypeScript** | 5.x | 类型安全的 JavaScript |
| **Element Plus** | 2.5+ | UI 组件库 |
| **Pinia** | 2.1+ | 状态管理 |
| **Vue Router** | 4.2+ | 路由管理 |
| **ECharts** | 5.4+ | 图表库 |
| **Axios** | 1.6+ | HTTP 客户端 |

### 部署
| 技术 | 说明 |
|-----|------|
| **Docker** | 容器化部署 |
| **Docker Compose** | 多容器编排 |
| **Nginx** | 反向代理和静态文件服务 |

## 🚀 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 一键启动

```bash
# 克隆项目
git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git
cd Budget_Mgt_Enterprise

# 启动所有服务
docker-compose up -d

# 初始化数据库
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py seed_data
```

访问地址：
- 前端页面：http://localhost
- 后端 API：http://localhost/api
- 管理后台：http://localhost/admin

默认账号：
- 用户名：`admin`
- 密码：`admin123`

## 📁 项目结构

```
Budget_Mgt_Enterprise/
├── backend/                 # Django 后端
│   ├── apps/               # 应用模块
│   │   ├── auth_user/      # 用户认证
│   │   ├── budget/         # 预算管理
│   │   ├── department/     # 部门管理
│   │   ├── purchase/       # 采购管理
│   │   ├── workflow/       # 审批工作流
│   │   ├── audit/          # 审计日志
│   │   ├── notification/   # 消息通知
│   │   ├── report/         # 报表分析
│   │   └── import_export/  # 数据导入导出
│   ├── common/             # 公共组件
│   ├── config/             # 配置文件
│   └── manage.py           # Django 管理脚本
├── frontend/               # Vue3 前端
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── components/     # 公共组件
│   │   ├── layouts/        # 布局组件
│   │   ├── pages/          # 页面组件
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   └── package.json
├── server/                 # NestJS 后端（旧版，保留参考）
├── docs/                   # 项目文档
├── nginx/                  # Nginx 配置
├── scripts/                # 脚本文件
└── docker-compose.yml      # Docker 编排配置
```

## 📚 文档

| 文档 | 说明 |
|-----|------|
| [QUICK_START.md](QUICK_START.md) | 快速开始指南 |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 详细部署文档 |
| [FEATURES_GUIDE.md](FEATURES_GUIDE.md) | 功能特性说明 |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | 项目总结报告 |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | API 接口文档 |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | 数据库设计文档 |
| [docs/user-guide.md](docs/user-guide.md) | 用户使用手册 |
| [docs/deployment.md](docs/deployment.md) | 运维部署手册 |

## 🔧 开发指南

### 本地开发

```bash
# 后端开发
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver

# 前端开发
cd frontend
npm install
npm run dev
```

### 常用命令

```bash
# 查看日志
docker-compose logs -f [service]

# 重启服务
docker-compose restart [service]

# 进入容器
docker-compose exec [service] sh

# 数据库迁移
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# 创建超级用户
docker-compose exec backend python manage.py createsuperuser
```

## 🐳 部署

### 生产环境部署

```bash
# 1. 复制环境变量配置
cp .env.example .env
# 编辑 .env 文件，设置生产环境参数

# 2. 构建并启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 收集静态文件
docker-compose exec backend python manage.py collectstatic --noinput

# 4. 执行迁移
docker-compose exec backend python manage.py migrate
```

详细部署说明请参考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🛡️ 安全

- JWT 认证机制
- 密码加密存储
- API 权限控制
- SQL 注入防护
- XSS 防护
- CSRF 防护

## 📊 项目状态

- ✅ 功能开发完成
- ✅ 测试覆盖率 > 80%
- ✅ Docker 容器化
- ✅ 生产环境就绪
- ✅ 文档完善

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

---

<p align="center">
  Made with ❤️ for Enterprise Budget Management
</p>

**Version**: 3.0  
**Last Updated**: 2024-04-18
