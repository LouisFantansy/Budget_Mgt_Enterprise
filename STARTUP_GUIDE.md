# 预算管理系统启动指南

## 📋 系统要求

- Node.js >= 18.0.0
- PostgreSQL >= 15.0
- Redis >= 7.0 (可选，用于缓存)
- npm >= 9.0.0

## 🚀 快速启动

### 方式一：使用Docker（推荐）

#### 1. 启动数据库服务
```bash
docker-compose up -d postgres redis
```

#### 2. 等待数据库就绪
```bash
docker-compose ps
```

#### 3. 安装后端依赖
```bash
cd backend
npm install
```

#### 4. 安装前端依赖
```bash
cd ../frontend
npm install
```

#### 5. 启动后端服务
```bash
cd ../backend
npm run start:dev
```

#### 6. 启动前端服务（新终端）
```bash
cd frontend
npm run dev
```

### 方式二：本地开发模式

#### 1. 安装PostgreSQL
- 下载并安装PostgreSQL 15+
- 创建数据库：`budget_db`
- 创建用户：`budget_user` / `budget_pass`

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=budget_user
DB_PASSWORD=budget_pass
DB_DATABASE=budget_db
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

#### 3. 初始化数据库
```bash
# 连接PostgreSQL执行初始化脚本
psql -U budget_user -d budget_db -f backend/database/init/01_init_schema.sql
```

#### 4. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

#### 5. 启动服务
```bash
# 后端（终端1）
cd backend
npm run start:dev

# 前端（终端2）
cd frontend
npm run dev
```

## 🌐 访问系统

- **前端地址**：http://localhost:5173
- **后端API**：http://localhost:3000
- **API文档**：http://localhost:3000/api/docs

## 🔑 默认账号

- 用户名：`admin`
- 密码：`admin123`

## 📁 项目结构

```
Budget_Mgt/
├── backend/                 # 后端项目
│   ├── src/                # 源代码
│   │   ├── modules/        # 业务模块
│   │   ├── config/         # 配置文件
│   │   └── main.ts         # 入口文件
│   ├── database/           # 数据库
│   │   └── init/           # 初始化脚本
│   └── package.json
│
├── frontend/               # 前端项目
│   ├── src/               # 源代码
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   └── App.tsx        # 主应用
│   └── package.json
│
├── docker-compose.yml     # Docker配置
├── .env.example          # 环境变量模板
└── README.md             # 项目说明
```

## 🛠️ 开发命令

### 后端
```bash
npm run start:dev      # 开发模式
npm run build          # 构建生产版本
npm run start:prod     # 生产模式
npm run test           # 运行测试
npm run lint           # 代码检查
```

### 前端
```bash
npm run dev            # 开发模式
npm run build          # 构建生产版本
npm run preview        # 预览生产版本
npm run lint           # 代码检查
```

## 🐛 常见问题

### 1. 数据库连接失败
- 检查PostgreSQL是否启动
- 检查环境变量配置是否正确
- 检查数据库用户权限

### 2. 依赖安装失败
- 清除npm缓存：`npm cache clean --force`
- 删除node_modules重新安装
- 使用国内镜像：`npm config set registry https://registry.npmmirror.com`

### 3. 端口被占用
- 后端默认端口：3000
- 前端默认端口：5173
- 修改.env文件中的端口配置

### 4. Docker镜像拉取失败
- 检查Docker是否运行
- 配置Docker镜像加速器
- 使用本地开发模式

## 📞 技术支持

如遇问题，请查看：
- 项目文档：`.codeartsdoer/specs/budget_management_system/`
- API文档：http://localhost:3000/api/docs
- README.md

## 🎯 下一步

系统启动后，您可以：
1. 登录系统（admin/admin123）
2. 配置组织架构和预算科目
3. 编制年度预算
4. 导入PR/PO/结算数据
5. 查看差异分析报表
