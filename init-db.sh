#!/bin/bash

################################################################################
# 预算管理系统 - 完整数据库初始化脚本
# 解决所有数据库问题
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
log_info "完整数据库初始化开始"
log_info "=========================================="

# 1. 停止所有服务
log_info "步骤 1/6: 停止所有服务..."
docker-compose down

# 2. 清理旧数据
log_info "步骤 2/6: 清理旧数据..."
docker volume rm budget_mgt_enterprise_postgres_data 2>/dev/null || true
docker volume rm budget_mgt_enterprise_redis_data 2>/dev/null || true

# 3. 确保 .env 正确
log_info "步骤 3/6: 配置环境变量..."
cat > .env << 'EOF'
POSTGRES_PASSWORD=Budget@2025_Secure
JWT_SECRET=budget_mgt_2025_jwt_secret_key_production_for_development_environment_test_value_123456789
REDIS_PASSWORD=Budget@2025_Redis
ADMIN_INITIAL_PASSWORD=admin123
EOF
chmod 600 .env
log_success ".env 已配置"

# 4. 启动数据库
log_info "步骤 4/6: 启动数据库服务..."
docker-compose up -d postgres redis
log_info "等待数据库启动 (20秒)..."
sleep 20

# 验证数据库
docker exec budget_postgres pg_isready -U postgres
log_success "数据库已就绪"

# 5. 在服务器上安装依赖并执行 Prisma 迁移
log_info "步骤 5/6: 执行数据库迁移和种子数据..."

cd /opt/Budget_Mgt_Enterprise/server

# 安装依赖
log_info "安装 Node.js 依赖..."
npm install --legacy-peer-deps 2>/dev/null || npm install

# 设置数据库连接
export DATABASE_URL="postgresql://postgres:Budget@2025_Secure@localhost:5432/budget_management?schema=public"

# 推送 schema 到数据库
log_info "推送 Prisma schema 到数据库..."
npx prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss --skip-generate

# 运行种子数据
log_info "运行种子数据脚本..."
npx ts-node --compiler-options '{"module":"CommonJS"}' ./src/prisma/seed.ts

cd /opt/Budget_Mgt_Enterprise
log_success "数据库初始化完成"

# 6. 启动所有服务
log_info "步骤 6/6: 启动所有服务..."
docker-compose up -d

log_info "等待服务启动 (30秒)..."
sleep 30

# 检查状态
log_info "=========================================="
log_info "服务状态"
log_info "=========================================="
docker-compose ps

# 测试登录
log_info "=========================================="
log_info "测试登录"
log_info "=========================================="
RESULT=$(curl -s http://localhost/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}')

if echo "$RESULT" | grep -q '"code":200'; then
    log_success "✓ 登录成功！"
else
    log_warning "登录测试结果: $RESULT"
fi

echo ""
log_success "=========================================="
log_success "🎉 部署完成！"
log_success "=========================================="
echo ""
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
log_info "访问地址："
log_info "  前端：http://${SERVER_IP}"
log_info "  后端 API: http://${SERVER_IP}:3000"
echo ""
log_info "登录账号："
log_info "  用户名：admin"
log_info "  密码：admin123"
echo ""
