#!/bin/bash

################################################################################
# 企业级预算管理系统 - 一键部署脚本 (付费镜像版)
# 适用于 Ubuntu 22.04 LTS
# 
# 使用方法:
#   curl -O https://raw.githubusercontent.com/LouisFantansy/Budget_Mgt_Enterprise/main/deploy.sh
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# 作者：Louis
# 版本：1.2.0 (使用付费镜像加速)
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

# ===== 用户配置区域 =====
DOCKER_MIRROR="5oo6hewxl4otsdb6id.xuanyuan.run"
# =========================

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
apt install -y curl git vim wget htop net-tools unzip gnupg lsb-release ca-certificates

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
# 步骤 3: 配置 Docker 镜像加速
################################################################################
log_info "步骤 3/8: 配置 Docker 镜像加速..."

# 创建 Docker 配置目录
mkdir -p /etc/docker

# 配置镜像加速器（用于后续拉取镜像）
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://${DOCKER_MIRROR}"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

log_info "已配置镜像加速器：https://${DOCKER_MIRROR}"

################################################################################
# 步骤 4: 安装 Docker (使用付费镜像)
################################################################################
log_info "步骤 4/8: 安装 Docker 环境..."

# 尝试多种方式安装
install_docker() {
    # 方式1: 使用付费镜像源安装
    log_info "使用付费镜像源安装 Docker..."
    
    # 添加 Docker 官方 GPG 密钥
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null || \
    curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 添加 Docker 仓库
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 替换为付费镜像源
    sed -i "s|https://download.docker.com|https://${DOCKER_MIRROR}|g" /etc/apt/sources.list.d/docker.list 2>/dev/null || true
    
    apt update -y
    
    # 安装 Docker
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || apt install -y docker.io docker-compose
    
    return 0
}

install_docker

# 重启 Docker 服务
systemctl daemon-reload
systemctl restart docker
systemctl enable docker

# 验证
docker --version
docker-compose --version

log_success "Docker 环境安装完成"

################################################################################
# 步骤 5: 克隆项目代码 (使用镜像加速)
################################################################################
log_info "步骤 5/8: 克隆项目代码..."

cd /opt

if [ -d "Budget_Mgt_Enterprise" ]; then
    log_warning "检测到旧项目，备份并重新克隆..."
    mv Budget_Mgt_Enterprise Budget_Mgt_Enterprise_backup_$(date +%Y%m%d_%H%M%S)
fi

# 尝试多种克隆方式
log_info "使用镜像加速克隆..."
git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git || \
git clone https://${DOCKER_MIRROR}/https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git || \
git clone https://ghproxy.com/https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git

cd Budget_Mgt_Enterprise

log_success "项目代码克隆完成"

################################################################################
# 步骤 6: 生成环境变量配置
################################################################################
log_info "步骤 6/8: 生成环境变量配置..."

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
# 步骤 7: 启动服务
################################################################################
log_info "步骤 7/8: 启动所有服务..."

# 检查配置
if [ ! -f "docker-compose.prod.yml" ]; then
    log_warning "未找到生产配置，使用默认配置..."
    cp docker-compose.yml docker-compose.prod.yml 2>/dev/null || true
fi

# 预拉取镜像（使用镜像加速）
log_info "预拉取 Docker 镜像（可能需要几分钟）..."

# 设置镜像拉取策略
export DOCKER_REGISTRY_MIRROR="https://${DOCKER_MIRROR}"

# 拉取基础镜像
docker pull postgres:16-alpine || true
docker pull redis:7-alpine || true
docker pull nginx:alpine || true

# 启动服务
docker-compose -f docker-compose.prod.yml up -d || docker-compose up -d

sleep 30
docker-compose ps

log_success "服务启动完成"

################################################################################
# 步骤 8: 数据库初始化
################################################################################
log_info "步骤 8/8: 等待数据库就绪..."

# 等待数据库就绪
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