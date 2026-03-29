#!/bin/bash

################################################################################
# 企业级预算管理系统 - 一键部署脚本
# 适用于 Ubuntu 22.04 LTS
# 
# 使用方法:
#   curl -O https://raw.githubusercontent.com/LouisFantansy/Budget_Mgt_Enterprise/main/deploy.sh
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# 作者：Louis
# 版本：1.0.0
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 错误处理
handle_error() {
    log_error "部署失败，请检查错误信息"
    exit 1
}

trap handle_error ERR

################################################################################
# 步骤 1: 系统检查和更新
################################################################################
log_info "步骤 1/8: 检查系统环境和更新..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

# 更新软件包列表
apt update -y
apt upgrade -y

# 安装基础工具
apt install -y curl git vim wget htop net-tools unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

log_success "系统更新完成"

################################################################################
# 步骤 2: 配置防火墙
################################################################################
log_info "步骤 2/8: 配置防火墙..."

# 启用 UFW 防火墙
ufw --force enable

# 允许 SSH
ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

log_success "防火墙配置完成"

################################################################################
# 步骤 3: 安装 Docker
################################################################################
log_info "步骤 3/8: 安装 Docker 环境..."

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
apt update -y
apt install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

log_success "Docker 环境安装完成"

################################################################################
# 步骤 4: 克隆项目代码
################################################################################
log_info "步骤 4/8: 克隆项目代码..."

cd /opt

# 克隆项目（如果已存在则先删除）
if [ -d "Budget_Mgt_Enterprise" ]; then
    log_warning "检测到旧的项目目录，正在备份..."
    mv Budget_Mgt_Enterprise Budget_Mgt_Enterprise_backup_$(date +%Y%m%d_%H%M%S)
fi

git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git
cd Budget_Mgt_Enterprise

log_success "项目代码克隆完成"

################################################################################
# 步骤 5: 生成环境变量配置
################################################################################
log_info "步骤 5/8: 生成环境变量配置..."

# 生成随机密钥
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 16)

# 创建 .env 文件
cat > .env << EOF
# 数据库配置
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# JWT 密钥（重要！请妥善保存）
JWT_SECRET=${JWT_SECRET}

# Redis 密码
REDIS_PASSWORD=${REDIS_PASSWORD}

# 管理员初始密码
ADMIN_INITIAL_PASSWORD=Admin@123456
EOF

# 设置权限
chmod 600 .env

log_success "环境变量配置生成完成"

# 显示重要信息
log_warning "=========================================="
log_warning "重要信息 - 请妥善保存："
log_warning "=========================================="
log_warning "PostgreSQL 密码：${POSTGRES_PASSWORD}"
log_warning "Redis 密码：${REDIS_PASSWORD}"
log_warning "JWT Secret: ${JWT_SECRET}"
log_warning "管理员默认密码：Admin@123456"
log_warning "=========================================="

################################################################################
# 步骤 6: 申请 SSL 证书（可选）
################################################################################
log_info "步骤 6/8: 配置 SSL 证书（可选）..."

read -p "是否需要申请 Let's Encrypt SSL 证书？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "请输入您的域名 (例如：example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        log_warning "未输入域名，跳过 SSL 证书申请"
    else
        # 安装 Certbot
        apt install -y certbot python3-certbot-nginx
        
        # 临时启动 Nginx 用于证书验证
        docker run -d --name temp-nginx -p 80:80 nginx:alpine
        sleep 5
        
        # 申请证书
        certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email admin@$DOMAIN --agree-tos --no-eff-email
        
        # 停止临时 Nginx
        docker stop temp-nginx && docker rm temp-nginx
        
        # 创建 SSL 目录
        mkdir -p /etc/nginx/ssl
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/
        
        log_success "SSL 证书申请完成"
    fi
else
    log_warning "跳过 SSL 证书申请，使用 HTTP 访问"
fi

################################################################################
# 步骤 7: 启动服务
################################################################################
log_info "步骤 7/8: 启动所有服务..."

cd /opt/Budget_Mgt_Enterprise

# 使用生产环境配置启动
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
log_info "等待服务初始化..."
sleep 30

# 检查服务状态
docker-compose ps

log_success "服务启动完成"

################################################################################
# 步骤 8: 初始化数据库
################################################################################
log_info "步骤 8/8: 初始化数据库..."

cd /opt/Budget_Mgt_Enterprise/server

# 等待 PostgreSQL 完全启动
sleep 10

# 生成 Prisma 客户端
docker exec budget_backend npx prisma generate

# 执行数据库迁移
docker exec budget_backend npx prisma migrate deploy

# 初始化种子数据
docker exec budget_backend npm run prisma:seed

log_success "数据库初始化完成"

################################################################################
# 部署完成
################################################################################
echo ""
log_success "=========================================="
log_success "🎉 部署完成！"
log_success "=========================================="
echo ""

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me)

log_info "访问地址："
log_info "  前端：http://${SERVER_IP}"
log_info "  后端 API: http://${SERVER_IP}:3000"
log_info "  Swagger 文档：http://${SERVER_IP}:3000/swagger"
echo ""

log_info "默认管理员账号："
log_info "  用户名：admin"
log_info "  密码：Admin@123456"
echo ""

log_warning "重要提示："
log_warning "1. 请及时修改管理员密码"
log_warning "2. 定期备份数据库：docker exec budget_postgres pg_dump -U postgres budget_management > backup.sql"
log_warning "3. 查看日志：docker-compose logs -f"
log_warning "4. 重启服务：docker-compose restart"
log_warning "5. 停止服务：docker-compose down"
echo ""

log_success "部署成功！祝您使用愉快！"
