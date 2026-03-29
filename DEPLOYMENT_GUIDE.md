# 企业级预算管理系统 - 生产环境部署指南

## 🚀 快速开始（一键部署）

### 前置要求

- Ubuntu Server 22.04 LTS
- 至少 2 核 CPU、4GB 内存、40GB 硬盘
- 已配置 SSH 密钥登录（推荐）
- 域名解析到服务器 IP（用于 SSL 证书）

### 一键部署命令

```bash
# 1. 下载部署脚本
curl -O https://raw.githubusercontent.com/LouisFantansy/Budget_Mgt_Enterprise/main/deploy.sh

# 2. 添加执行权限
chmod +x deploy.sh

# 3. 执行部署（需要 sudo 权限）
sudo ./deploy.sh
```

### 等待完成

部署过程约 10-15 分钟，完成后会显示：
- ✅ 访问地址
- ✅ 管理员账号
- ✅ 数据库密码等重要信息

---

## 📋 手动部署步骤（可选）

如果想了解详细过程，可以按以下步骤手动部署：

### 1. 系统更新

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git vim wget htop net-tools
```

### 2. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证
docker --version
docker-compose --version
```

### 3. 克隆项目

```bash
cd /opt
sudo git clone https://github.com/LouisFantansy/Budget_Mgt_Enterprise.git
cd Budget_Mgt_Enterprise
```

### 4. 配置环境变量

```bash
# 创建 .env 文件
sudo cp .env.example .env

# 编辑配置（替换默认密码）
sudo vim .env
```

**.env 文件内容**：
```bash
POSTGRES_PASSWORD=你的强密码
JWT_SECRET=随机生成的密钥（openssl rand -hex 32）
REDIS_PASSWORD=你的 Redis 密码
ADMIN_INITIAL_PASSWORD=管理员初始密码
```

### 5. 启动服务

```bash
# 使用生产环境配置启动
sudo docker-compose -f docker-compose.prod.yml up -d

# 查看状态
sudo docker-compose ps

# 查看日志
sudo docker-compose logs -f
```

### 6. 初始化数据库

```bash
cd server

# 生成 Prisma 客户端
sudo docker exec budget_backend npx prisma generate

# 执行迁移
sudo docker exec budget_backend npx prisma migrate deploy

# 初始化种子数据
sudo docker exec budget_backend npm run prisma:seed
```

---

## 🔧 常用运维命令

### 查看服务状态

```bash
cd /opt/Budget_Mgt_Enterprise
sudo docker-compose ps
```

### 重启服务

```bash
sudo docker-compose restart
```

### 停止服务

```bash
sudo docker-compose down
```

### 查看日志

```bash
# 查看所有服务日志
sudo docker-compose logs -f

# 查看特定服务日志
sudo docker-compose logs -f backend
```

### 数据库备份

```bash
# 使用备份脚本
sudo ./backup.sh

# 或手动备份
sudo docker exec budget_postgres pg_dump -U postgres budget_management > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
sudo cat backup.sql | sudo docker exec -i budget_postgres psql -U postgres -d budget_management
```

### 更新代码

```bash
cd /opt/Budget_Mgt_Enterprise
sudo git pull
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🔒 安全加固建议

### 1. 配置防火墙

```bash
# 启用 UFW
sudo ufw enable

# 允许必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

### 2. SSH 安全配置

```bash
# 编辑 SSH 配置
sudo vim /etc/ssh/sshd_config

# 禁用密码登录
PasswordAuthentication no
PubkeyAuthentication yes

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 3. 自动安全更新

```bash
# 安装自动更新工具
sudo apt install -y unattended-upgrades

# 启用自动更新
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. SSL 证书（HTTPS）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

---

## 📊 监控和告警

### 系统资源监控

```bash
# 安装 htop
sudo apt install -y htop

# 查看实时资源使用
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### Docker 容器监控

```bash
# 查看容器资源使用
sudo docker stats

# 查看容器进程
sudo docker top budget_backend
```

### 日志分析

```bash
# 查看错误日志
sudo docker-compose logs backend | grep ERROR

# 统计访问日志
sudo docker-compose logs nginx | grep "GET" | wc -l
```

---

## ⚠️ 故障排查

### 服务无法访问

```bash
# 检查服务状态
sudo docker-compose ps

# 检查端口占用
sudo netstat -tulpn | grep :3000

# 检查防火墙
sudo ufw status
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo docker ps | grep postgres

# 查看数据库日志
sudo docker logs budget_postgres

# 测试连接
sudo docker exec budget_postgres psql -U postgres -c "SELECT version();"
```

### 后端服务异常

```bash
# 查看后端日志
sudo docker logs budget_backend

# 重启后端
sudo docker restart budget_backend

# 进入容器调试
sudo docker exec -it budget_backend bash
```

---

## 💡 性能优化

### 1. PostgreSQL 优化

编辑 `/opt/Budget_Mgt_Enterprise/docker-compose.prod.yml`：

```yaml
services:
  postgres:
    command: >
      postgres
      -c shared_buffers=256MB
      -c effective_cache_size=768MB
      -c work_mem=16MB
```

### 2. Redis 缓存优化

```yaml
services:
  redis:
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### 3. Nginx 优化

```nginx
worker_processes auto;
worker_connections 1024;

http {
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;
}
```

---

## 🆘 获取帮助

### 官方文档
- GitHub: https://github.com/LouisFantansy/Budget_Mgt_Enterprise
- Issues: https://github.com/LouisFantansy/Budget_Mgt_Enterprise/issues

### 社区支持
- 提交 Issue 描述问题
- 提供详细的错误日志
- 说明复现步骤

---

## 📝 定期检查清单

### 每日检查
- [ ] 服务是否正常运行
- [ ] 错误日志是否有异常
- [ ] CPU/内存使用率是否正常

### 每周检查
- [ ] 数据库备份是否成功
- [ ] 磁盘空间是否充足
- [ ] SSL 证书有效期检查

### 每月检查
- [ ] 系统安全更新
- [ ] 性能指标分析
- [ ] 清理无用数据和日志

---

**祝您部署顺利！** 🎉
