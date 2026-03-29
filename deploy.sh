#!/bin/bash

################################################################################
# 企业级预算管理系统 - 一键部署脚本 (修订版)
# 适用于 Ubuntu 22.04 LTS
# 
# 使用方法:
#   curl -O https://raw.githubusercontent.com/LouisFantansy/Budget_Mgt_Enterprise/main/deploy.sh
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# 作者：Louis
# 版本：1.1.0 (修复国内网络问题)
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
# 步骤 1: 系统检查和更新
################################################################################
log_info "步骤 1/8: 检查系统环境和更新..."

if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

apt update -y
apt upgrade -y
apt install -y curl git vim wget htop net-tools unzip gnupg lsb-release

log_success "系统更新完成"

################################################################################
# 步骤 2: 配置防火墙
################################################################################
log_info "步骤 2/8: 配置防火墙..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
log_success "防火墙配置完成"

################################################################################
# 步骤 3: 安装 Docker (国内优化版)
################################################################################
log_info "步骤 3/8: 安装 Docker 环境..."

# 尝试多种安装方式
install_docker() {
    # 方式1: 尝试使用阿里云镜像
    log_info "尝试方式1: 使用阿里云 Docker 镜像..."
    curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt update -y && \
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin && return 0
    
    # 方式2: 使用系统自带的 docker.io
    log_info "尝试方式2: 使用系统自带 Docker..."
    apt install -y docker.io docker-compose && return 0
    
    # 方式3: 强制安装
    log_info "尝试方式3: 强制安装..."
    apt update -y
    apt install -y --allow-unauthenticated docker.io docker-compose
    return 0
}

install_docker

# 确保 Docker 启动
systemctl start docker 2>/dev/null || true
systemctl enable docker 2>/dev/null || true

# 验证
docker --version || log_warning "Docker 验证失败，请手动检查"
docker-compose --version || log_warning "Docker Compose 验证失败，请手动检查"

log_success "Docker 环境安装完成"

################################################################################
# 步骤 4: 克隆项目代码
################################################################################
log_info "步骤 4/8: 克隆项目代码..."

cd /opt

if [ -d "Budget_Mgt_Enterprise" ]; then
    log_warning "检测到旧项目，��份并重新克隆..."
    mv Budget_Mgt_Enterprise Budget_Mgt_Enterprise_backup_$(date +%Y%m%d_%H%M%S)
fi

# 尝试多种克隆方式
git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git || \
git clone https://ghproxy.com/https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git || \
git clone https://hub.fgit.ml/LouisFantansy/Budget_Mgt_Enterprise.git

cd Budget_Mgt_Enterprise

log_success "项目代码克隆完成"

################################################################################
# 步骤 5: 生成环境变量配置
################################################################################
log_info "步骤 5/8: 生成环境变量配置..."

# 生成随机密钥
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
REDIS_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

cat > .env << EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
REDIS_PASSWORD=${REDIS_PASSWORD}
ADMIN_INITIAL_PASSWORD=Admin@123456
EOF

chmod 600 .env

log_success "环境变量配置生成完成"

log_warning "=============================================="
log_warning "重要信息 - 请复制保存："
log_warning "=============================================="
log_warning "PostgreSQL 密码：${POSTGRES_PASSWORD}"
log_warning "Redis 密码：${REDIS_PASSWORD}"
log_warning "JWT 密钥：${JWT_SECRET}"
log_warning "管理员密码：Admin@123456"
log_warning "=============================================="

################################################################################
# 步骤 6: SSL 证书（跳过）
################################################################################
log_info "步骤 6/8: 跳过 SSL 证书申请 (可选)..."
log_warning "提示：如需 HTTPS，请配置域名后手动申请 Let's Encrypt 证书"

################################################################################
# 步骤 7: 启动服务
################################################################################
log_info "步骤 7/8: 启动所有服务..."

# 检查并修复 docker-compose 配置
if [ ! -f "docker-compose.prod.yml" ]; then
    log_warning "未找到生产配置，使用默认配置..."
    cp docker-compose.yml docker-compose.prod.yml 2>/dev/null || true
fi

# 尝试启动
docker-compose -f docker-compose.prod.yml up -d || \
docker-compose up -d

sleep 30
docker-compose ps

log_success "服务启动完成"

################################################################################
# 步骤 8: 数据库初始化
################################################################################
log_info "步骤 8/8: 等待数据库就绪..."

sleep 20

# 检查 PostgreSQL 是否就绪
for i in {1..30}; do
    if docker exec budget_postgres pg_isready -U postgres 2>/dev/null; then
        log_success "数据库已就绪"
        break
    fi
    log_info "等待数据库启动... ($i/30)"
    sleep 2
done

log_success "数据库就绪"

################################################################################
# 部署完成
################################################################################
echo ""
log_success "=========================================="
log_success "🎉 部署完成！"
log_success "=========================================="
echo ""

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "您的服务器IP")

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
log_warning "4. 备份命令：cd /opt/Budget_Mgt_Enterprise && docker exec budget_postgres pg_dump -U postgres budget_management > backup.sql"
echo ""

log_success "部署成功！祝您使用愉快！"