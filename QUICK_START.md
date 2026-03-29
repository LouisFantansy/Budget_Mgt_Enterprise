# 🚀 一键部署 - 3 分钟快速开始

## 前提条件

✅ 已购买 Ubuntu 22.04 云服务器  
✅ 已获取 SSH 登录权限  
✅ 服务器可以访问外网  

---

## 超简单 3 步走

### 第 1 步：SSH 登录服务器

```bash
ssh root@你的服务器 IP
```

### 第 2 步：下载并执行部署脚本

```bash
# 复制粘贴这一行命令即可
curl -O https://raw.githubusercontent.com/LouisFantansy/Budget_Mgt_Enterprise/main/deploy.sh && chmod +x deploy.sh && sudo ./deploy.sh
```

### 第 3 步：等待完成

脚本会自动完成所有工作（约 10-15 分钟）：
- ✅ 安装 Docker 环境
- ✅ 克隆项目代码
- ✅ 生成安全配置
- ✅ 启动所有服务
- ✅ 初始化数据库

完成后会显示访问地址和管理员账号！

---

## 🎉 完成！

看到以下提示表示部署成功：

```
🎉 部署完成！
==========================================
访问地址：
  前端：http://你的服务器IP
  后端 API: http://你的服务器IP:3000
  Swagger 文档：http://你的服务器IP:3000/swagger

默认管理员账号：
  用户名：admin
  密码：Admin@123456
```

---

## 🔧 常用命令

### 查看服务状态
```bash
cd /opt/Budget_Mgt_Enterprise
sudo docker-compose ps
```

### 查看日志
```bash
sudo docker-compose logs -f
```

### 重启服务
```bash
sudo docker-compose restart
```

### 备份数据库
```bash
sudo ./backup.sh
```

---

## ⚠️ 重要提示

1. **保存好密码**：部署完成后显示的数据库密码和管理员密码要妥善保存
2. **修改默认密码**：首次登录后请立即修改管理员默认密码
3. **定期备份**：建议每天备份数据库
4. **启用 HTTPS**：有域名的话建议申请 SSL 证书

---

## 🆘 遇到问题？

### 脚本执行失败
检查网络连接：`ping github.com`

### 服务无法访问
检查防火墙：`sudo ufw status`

### 需要帮助
查看详细文档：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**就是这么简单！** 😊
