#!/bin/bash

################################################################################
# 企业级预算管理系统 - 一键部署脚本 (精简版)
# 适用于 Ubuntu 22.04 LTS - Docker 已安装环境
# 
# 使用方法:
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# 作者：Louis
# 版本：1.3.0
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

trap 'log_error "部署失败"; exit 1' ERR

################################################################################
# 步骤 1: 检查 Docker 并配置
################################################################################
log_info "步骤 1/6: 检查 Docker 环境..."

if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

# 检查 Docker 是否已安装
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker 服务状态
if ! systemctl is-active docker &> /dev/null; then
    log_info "启动 Docker 服务..."
    systemctl start docker
    systemctl enable docker
fi

docker --version
docker-compose --version 2>/dev/null || docker-compose version

log_success "Docker 环境就绪"

################################################################################
# 步骤 2: 配置防火墙（可选）
################################################################################
log_info "步骤 2/6: 配置防火墙..."

read -p "是否配置防火墙？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    log_success "防火墙配置完成"
else
    log_info "跳过防火墙配置"
fi

################################################################################
# 步骤 3: 拉取项目代码 (SSH方式)
################################################################################
log_info "步骤 3/6: 拉取项目代码..."

cd /opt

# 检查是否已存在
if [ -d "Budget_Mgt_Enterprise" ]; then
    log_warning "项目已存在，是否更新？(y/n): "
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd Budget_Mgt_Enterprise
        git pull origin main
        log_success "项目更新完成"
    else
        log_info "使用现有项目"
    fi
else
    # 使用 SSH 克隆
    log_info "使用 SSH 克隆项目..."
    git clone git@github.com:LouisFantansy/Budget_Mgt_Enterprise.git
    cd Budget_Mgt_Enterprise
    log_success "项目代码克隆完成"
fi

################################################################################
# 步骤 4: 生成环境变量配置
################################################################################
log_info "步骤 4/6: 生成环境变量配置..."

# 生成随机密钥
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
REDIS_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

# 检查 .env 是否存在
if [ -f ".env" ]; then
    log_warning ".env 已存在，是否覆盖？(y/n): "
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "使用现有配置"
    else
        cat > .env << EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
REDIS_PASSWORD=${REDIS_PASSWORD}
ADMIN_INITIAL_PASSWORD=Admin@123456
EOF
        chmod 600 .env
        log_success "环境变量配置已更新"
    fi
else
    cat > .env << EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
REDIS_PASSWORD=${REDIS_PASSWORD}
ADMIN_INITIAL_PASSWORD=Admin@123456
EOF
    chmod 600 .env
    log_success "环境变量配置生成完成"
fi

log_warning "=============================================="
log_warning "重要信息 - 请复制保存："
log_warning "=============================================="
log_warning "PostgreSQL 密码：${POSTGRES_PASSWORD}"
log_warning "Redis 密码：${REDIS_PASSWORD}"
log_warning "JWT 密钥：${JWT_SECRET}"
log_warning "管理员密码：Admin@123456"
log_warning "=============================================="

################################################################################
# 步骤 5: 启动服务
################################################################################
log_info "步骤 5/6: 启动所有服务..."

# 预拉取镜像（可选）
read -p "是否预拉取 Docker 镜像？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "预拉取镜像（可能需要几分钟）..."
    docker pull postgres:16-alpine 2>/dev/null || true
    docker pull redis:7-alpine 2>/dev/null || true
    docker pull nginx:alpine 2>/dev/null || true
fi

# 检查配置文件
if [ ! -f "docker-compose.prod.yml" ]; then
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.prod.yml
        log_info "已创建生产配置 docker-compose.prod.yml"
    fi
fi

# 启动服务
log_info "启动服务..."

# 先停止并清理旧容器（避免版本兼容性问题）
docker-compose down --remove-orphans 2>/dev/null || true
docker rm -f budget_frontend budget_postgres budget_redis budget_nginx budget_backend 2>/dev/null || true

# 强制重新构建前端和后端镜像
log_info "重新构建 Docker 镜像..."
docker-compose build --no-cache frontend backend

# 使用 docker-compose 或 docker compose 命令
if command -v docker &> /dev/null && docker compose version &>/dev/null; then
    log_info "使用新版 docker compose 命令..."
    docker compose -f docker-compose.prod.yml up -d || docker compose up -d
else
    log_info "使用 docker-compose 命令..."
    docker-compose -f docker-compose.prod.yml up -d || docker-compose up -d
fi

# 等待服务启动
sleep 15

# 检查容器状态
if command -v docker &> /dev/null && docker compose version &>/dev/null; then
    docker compose ps
else
    docker-compose ps
fi

log_success "服务启动完成"

################################################################################
# 步骤 6: 数据库初始化
################################################################################
log_info "步骤 6/6: 等待数据库就绪..."

# 等待数据库就绪
for i in {1..30}; do
    if docker exec budget_postgres pg_isready -U postgres 2>/dev/null; then
        log_success "数据库已就绪"
        break
    fi
    log_info "等待数据库启动... ($i/30)"
    sleep 2
done

# 初始化数据库（如果需要）
if [ -d "server" ] && [ -f "server/prisma/seed.ts" ]; then
    log_info "检查是否需要初始化数据..."
    # 可以在这里添加数据初始化命令
fi

################################################################################
# 部署完成
################################################################################
echo ""
log_success "=========================================="
log_success "🎉 部署完成！"
log_success "=========================================="
echo ""

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

log_info "访问地址："
log_info "  前端：http://${SERVER_IP}"
log_info "  后端 API: http://${SERVER_IP}:3000"
log_info "  Swagger: http://${SERVER_IP}:3000/swagger"
echo ""

log_info "默认管理员账号："
log_info "  用户名：admin"
log_info "  密码：Admin@123456"
echo ""

log_warning "重要提示："
log_warning "1. 请记录上面显示的数据库密码"
log_warning "2. 首次登录后修改管理员密码"
log_warning "3. 查看日志：cd /opt/Budget_Mgt_Enterprise && docker-compose logs -f"
log_warning "4. 重启服务：cd /opt/Budget_Mgt_Enterprise && docker-compose restart"
echo ""

log_success "部署成功！祝您使用愉快！"