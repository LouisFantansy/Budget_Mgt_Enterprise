# 前端构建脚本 - 用于生产环境
#!/bin/bash

echo "开始构建前端..."

# 检查当前目录
if [ ! -f "Dockerfile.frontend" ]; then
    echo "错误：当前目录没有 Dockerfile.frontend"
    echo "请确保在项目根目录执行此脚本"
    exit 1
fi

# 构建前端镜像
echo "构建前端镜像..."
docker build -t budget-frontend:latest -f Dockerfile.frontend .

echo "前端构建完成！"