# 快速启动脚本（Windows PowerShell）

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  预算管理系统 - 快速启动脚本" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker
Write-Host "[1/5] 检查 Docker 环境..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker 未安装，请先安装 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 启动开发环境
Write-Host ""
Write-Host "[2/5] 启动数据库和中间件..." -ForegroundColor Yellow
docker-compose up -d postgres redis

Write-Host "[3/5] 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "[4/5] 初始化数据库..." -ForegroundColor Yellow
cd server
npx prisma migrate dev --name init
npx prisma db seed
cd ..

Write-Host "[5/5] 启动应用服务..." -ForegroundColor Yellow
Write-Host ""
Write-Host "正在启动后端服务器..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run start:dev"

Write-Host "正在启动前端开发服务器..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  系统启动完成！" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  前端：http://localhost:5173" -ForegroundColor White
Write-Host "  后端 API: http://localhost:3000" -ForegroundColor White
Write-Host "  Swagger 文档：http://localhost:3000/swagger" -ForegroundColor White
Write-Host ""
Write-Host "默认管理员账号：" -ForegroundColor Cyan
Write-Host "  用户名：admin" -ForegroundColor White
Write-Host "  密码：admin123" -ForegroundColor White
Write-Host ""
