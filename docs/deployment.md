# 企业级预算管理系统 - 部署指南

## 目录

1. [环境要求](#1-环境要求)
2. [Docker Compose 部署](#2-docker-compose-部署)
3. [手动部署步骤](#3-手动部署步骤)
4. [环境变量配置](#4-环境变量配置)
5. [数据库初始化](#5-数据库初始化)
6. [前端构建和部署](#6-前端构建和部署)
7. [Nginx 配置](#7-nginx-配置)
8. [常见问题排查](#8-常见问题排查)

---

## 1. 环境要求

### 1.1 硬件要求

| 环境 | CPU | 内存 | 磁盘 | 网络 |
|-----|-----|------|-----|------|
| 开发环境 | 2核 | 4GB | 20GB | 10Mbps |
| 测试环境 | 2核 | 4GB | 40GB | 10Mbps |
| 生产环境 | 4核+ | 8GB+ | 100GB+ | 50Mbps+ |

### 1.2 软件要求

| 软件 | 版本 | 用途 |
|-----|------|-----|
| Node.js | 20.x LTS | 运行后端服务 |
| PostgreSQL | 16.x | 主数据库 |
| Redis | 7.x | 缓存和Session |
| Nginx | 1.24+ | 反向代理和静态资源 |
| Docker | 24.x+ | 容器化部署（推荐） |
| Docker Compose | 2.x+ | 容器编排 |

### 1.3 支持的操作系统

- Ubuntu Server 22.04 LTS（推荐）
- CentOS 8/RHEL 8
- Debian 12
- macOS（开发环境）
- Windows Server 2022

---

## 2. Docker Compose 部署

### 2.1 一键部署（推荐）

```bash
# 1. 克隆项目代码
git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git
cd Budget_Mgt_Enterprise

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 文件，修改数据库密码和JWT密钥

# 3. 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 4. 初始化数据库
cd server
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed

# 5. 检查服务状态
docker-compose ps
```

### 2.2 生产环境 Docker Compose 配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:16-alpine
    container_name: budget_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-budget_management}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: budget_redis
    command: redis-server --requirepass ${REDIS_PASSWORD:-}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # MinIO 对象存储
  minio:
    image: minio/minio:latest
    container_name: budget_minio
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped

  # 后端服务
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: budget_backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-budget_management}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      REFRESH_TOKEN_EXPIRES_IN: ${REFRESH_TOKEN_EXPIRES_IN:-30d}
      MAIL_HOST: ${MAIL_HOST:-}
      MAIL_PORT: ${MAIL_PORT:-587}
      MAIL_USER: ${MAIL_USER:-}
      MAIL_PASSWORD: ${MAIL_PASSWORD:-}
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # 前端服务（Nginx）
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: budget_frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 2.3 常用运维命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart
docker-compose restart backend

# 停止服务
docker-compose down

# 完全清理（包括数据卷）
docker-compose down -v

# 更新部署
docker-compose pull
docker-compose up -d

# 进入容器调试
docker exec -it budget_backend bash
docker exec -it budget_postgres psql -U postgres -d budget_management
```

---

## 3. 手动部署步骤

### 3.1 安装依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl git vim wget htop net-tools

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 3.2 安装 PostgreSQL

```bash
# 添加 PostgreSQL 仓库
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# 安装 PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib

# 启动服务
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql -c "CREATE DATABASE budget_management;"
sudo -u postgres psql -c "CREATE USER budget_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE budget_management TO budget_user;"
```

### 3.3 安装 Redis

```bash
# 安装 Redis
sudo apt install -y redis-server

# 配置密码
sudo vim /etc/redis/redis.conf
# 修改: requirepass your_password

# 启动服务
sudo systemctl enable redis
sudo systemctl restart redis
```

### 3.4 部署后端服务

```bash
# 克隆代码
cd /opt
git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git
cd Budget_Mgt_Enterprise/server

# 安装依赖
npm ci

# 配置环境变量
cp .env.example .env
vim .env  # 根据实际情况修改配置

# 执行数据库迁移
npx prisma migrate deploy

# 初始化种子数据
npm run prisma:seed

# 构建应用
npm run build

# 启动服务（使用 PM2）
sudo npm install -g pm2
pm2 start dist/main.js --name budget-backend
pm2 save
pm2 startup
```

### 3.5 部署前端服务

```bash
# 返回项目根目录
cd /opt/Budget_Mgt_Enterprise

# 安装依赖
npm ci

# 配置 API 地址
vim .env
# 添加: VITE_API_URL=http://your-server-ip:3000

# 构建
npm run build

# 配置 Nginx
sudo apt install -y nginx
sudo vim /etc/nginx/sites-available/budget-app

# 创建符号链接
sudo ln -s /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 重启 Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. 环境变量配置

### 4.1 后端环境变量（server/.env）

| 变量名 | 必填 | 默认值 | 说明 |
|-------|------|-------|------|
| PORT | 否 | 3000 | 服务端口 |
| NODE_ENV | 否 | development | 运行环境 |
| DATABASE_URL | 是 | - | PostgreSQL连接字符串 |
| REDIS_HOST | 否 | localhost | Redis主机 |
| REDIS_PORT | 否 | 6379 | Redis端口 |
| REDIS_PASSWORD | 否 | - | Redis密码 |
| JWT_SECRET | 是 | - | JWT密钥（生产环境必须修改） |
| JWT_EXPIRES_IN | 否 | 7d | Token有效期 |
| REFRESH_TOKEN_EXPIRES_IN | 否 | 30d | 刷新Token有效期 |
| CORS_ORIGIN | 否 | http://localhost:5173 | 前端地址 |
| MAIL_HOST | 否 | - | SMTP服务器 |
| MAIL_PORT | 否 | 587 | SMTP端口 |
| MAIL_USER | 否 | - | 邮箱账号 |
| MAIL_PASSWORD | 否 | - | 邮箱密码 |
| MAIL_FROM | 否 | - | 发件人地址 |
| MINIO_ENDPOINT | 否 | localhost:9000 | MinIO地址 |
| MINIO_ACCESS_KEY | 否 | minioadmin | MinIO访问密钥 |
| MINIO_SECRET_KEY | 否 | minioadmin | MinIO密钥 |
| MINIO_BUCKET | 否 | budget-files | 存储桶名称 |

### 4.2 前端环境变量（.env）

| 变量名 | 必填 | 默认值 | 说明 |
|-------|------|-------|------|
| VITE_API_URL | 是 | http://localhost:3000 | 后端API地址 |
| VITE_WS_URL | 否 | ws://localhost:3000 | WebSocket地址 |

### 4.3 环境变量示例

```bash
# 应用配置
PORT=3000
NODE_ENV=production

# 数据库配置
DATABASE_URL="postgresql://postgres:your_strong_password@localhost:5432/budget_management?schema=public"

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT 配置（生产环境请使用强密钥）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-$(openssl rand -hex 32)"
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS 配置
CORS_ORIGIN=https://your-domain.com

# 邮件配置
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=noreply@example.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=noreply@example.com

# MinIO/OSS 配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=budget-files
```

---

## 5. 数据库初始化

### 5.1 执行迁移

```bash
cd server

# 开发环境
npx prisma migrate dev

# 生产环境
npx prisma migrate deploy
```

### 5.2 初始化种子数据

```bash
# 执行种子脚本
npm run prisma:seed
```

种子数据包含：
- 默认部门（研发部、市场部、财务部等）
- 系统角色（admin, budget_manager, dept_head, finance, purchaser, viewer）
- 默认权限配置
- 管理员账号（admin/admin123）

### 5.3 数据库备份与恢复

```bash
# 备份脚本
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="budget_backup_${DATE}.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
docker exec budget_postgres pg_dump -U postgres budget_management > $BACKUP_DIR/$FILENAME

# 压缩备份
gzip $BACKUP_DIR/$FILENAME

# 保留最近30天的备份
find $BACKUP_DIR -name "budget_backup_*.sql.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR/${FILENAME}.gz"
```

```bash
# 恢复数据库
gunzip budget_backup_20240101_120000.sql.gz
docker exec -i budget_postgres psql -U postgres -d budget_management < budget_backup_20240101_120000.sql
```

---

## 6. 前端构建和部署

### 6.1 本地构建

```bash
# 安装依赖
npm ci

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 6.2 Dockerfile

```dockerfile
# Dockerfile.frontend
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建
RUN npm run build

# 生产镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. Nginx 配置

### 7.1 基础配置

```nginx
# /etc/nginx/sites-available/budget-app
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态资源
    location / {
        root /opt/Budget_Mgt_Enterprise/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 7.2 HTTPS 配置（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 3 * * * certbot renew --quiet
```

### 7.3 完整 HTTPS 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 前端静态资源
    location / {
        root /opt/Budget_Mgt_Enterprise/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 8. 常见问题排查

### 8.1 服务无法启动

**问题：** Docker 容器启动后立即退出

```bash
# 查看日志
docker-compose logs backend

# 常见问题：
# 1. 数据库连接失败 - 检查 DATABASE_URL
# 2. 端口被占用 - 检查 3000/5432/6379 端口
# 3. 内存不足 - 增加服务器内存或 swap
```

### 8.2 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker ps | grep postgres
docker logs budget_postgres

# 测试连接
docker exec budget_postgres pg_isready -U postgres

# 检查网络
docker network ls
docker network inspect budget_mgt_enterprise_default
```

### 8.3 前端无法访问 API

```bash
# 检查后端是否运行
curl http://localhost:3000/health

# 检查 Nginx 配置
sudo nginx -t

# 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
```

### 8.4 权限问题

```bash
# 修复文件权限
sudo chown -R $USER:$USER /opt/Budget_Mgt_Enterprise

# Docker 权限
sudo usermod -aG docker $USER
newgrp docker
```

### 8.5 性能问题

```bash
# 查看资源使用
docker stats
htop

# 数据库慢查询
sudo -u postgres psql -d budget_management -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Redis 内存使用
docker exec budget_redis redis-cli info memory
```

### 8.6 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f --tail=100

# 查看特定服务
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 导出日志
docker-compose logs backend > backend.log 2>&1
```

### 8.7 重置环境

```bash
# 停止所有服务
docker-compose down

# 删除数据卷（会丢失所有数据）
docker-compose down -v

# 重新构建
docker-compose build --no-cache
docker-compose up -d

# 重新初始化数据库
cd server
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

---

**文档版本：** v1.0  
**编写日期：** 2026-04-03  
**编写人：** AI Assistant
