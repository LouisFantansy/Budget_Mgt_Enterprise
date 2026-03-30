#!/bin/bash

################################################################################
# 预算管理系统 - 一键修复脚本
# 用于修复 Nginx 代理和后端服务问题
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd /opt/Budget_Mgt_Enterprise

log_info "=========================================="
log_info "步骤 1/5: 停止所有服务"
log_info "=========================================="
docker-compose down

log_info "=========================================="
log_info "步骤 2/5: 清理旧容器"
log_info "=========================================="
docker rm -f budget_frontend budget_backend budget_postgres budget_redis budget_nginx 2>/dev/null || true

log_info "=========================================="
log_info "步骤 3/5: 修复 nginx.conf"
log_info "=========================================="
cat > nginx.conf << 'EOF'
# Nginx 生产环境配置
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # 后端 API 代理 - 使用容器名
        location /api {
            proxy_pass http://budget_backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Swagger 文档
        location /swagger {
            proxy_pass http://budget_backend:3000/swagger;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
log_success "nginx.conf 已修复"

log_info "=========================================="
log_info "步骤 4/5: 检查并创建 .env 文件"
log_info "=========================================="
if [ ! -f ".env" ]; then
    cat > .env << EOF
POSTGRES_PASSWORD=Budget@2025_Secure
JWT_SECRET=budget_mgt_2025_jwt_secret_key_production_for_development_environment_test_value_123456789
REDIS_PASSWORD=Budget@2025_Redis
ADMIN_INITIAL_PASSWORD=admin123
EOF
    chmod 600 .env
    log_success ".env 文件已创建"
else
    log_info ".env 文件已存在"
fi

log_info "=========================================="
log_info "步骤 5/5: 启动所有服务"
log_info "=========================================="
docker-compose up -d

log_info "等待服务启动 (30 秒)..."
sleep 30

log_info "=========================================="
log_info "检查服务状态"
log_info "=========================================="
docker-compose ps

echo ""
log_info "查看后端日志（最后 20 行）："
docker-compose logs backend | tail -20

echo ""
log_info "测试本地访问："
if curl -s http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -q "success"; then
    log_success "✓ 后端 API 访问成功！"
else
    log_warning "✗ 后端 API 访问失败，请查看上面的日志"
fi

if curl -s http://localhost | grep -q "html"; then
    log_success "✓ 前端访问成功！"
else
    log_warning "✗ 前端访问失败，请查看 Nginx 日志"
fi

echo ""
log_success "=========================================="
log_success "修复完成！"
log_success "=========================================="
echo ""
log_info "访问地址："
log_info "  前端：http://$(hostname -I | awk '{print $1}')"
log_info "  后端 API: http://$(hostname -I | awk '{print $1'}):3000"
log_info "  Swagger: http://$(hostname -I | awk '{print $1'}):3000/swagger"
echo ""
log_info "默认管理员账号："
log_info "  用户名：admin"
log_info "  密码：admin123"
echo ""
