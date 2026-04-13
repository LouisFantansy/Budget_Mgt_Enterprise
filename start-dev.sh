#!/bin/bash

# 预算管理系统启动脚本

echo "======================================"
echo "  预算管理系统启动脚本"
echo "======================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"
echo ""

# 检查PostgreSQL
echo "⚠️  请确保PostgreSQL已安装并运行"
echo "   数据库: budget_db"
echo "   用户: budget_user / budget_pass"
echo ""

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
fi
echo "✅ 后端依赖已安装"
echo ""

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
fi
echo "✅ 前端依赖已安装"
echo ""

# 启动服务
echo "🚀 启动服务..."
echo ""
echo "请在两个终端分别执行："
echo ""
echo "终端1 - 启动后端："
echo "  cd backend && npm run start:dev"
echo ""
echo "终端2 - 启动前端："
echo "  cd frontend && npm run dev"
echo ""
echo "======================================"
echo "  访问地址"
echo "======================================"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo "API文档: http://localhost:3000/api/docs"
echo ""
echo "默认账号: admin / admin123"
echo "======================================"
