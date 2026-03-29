#!/bin/bash

################################################################################
# 企业级预算管理系统 - 查看日志脚本
# 使用方法：./logs.sh [backend|frontend|nginx|postgres|redis]
################################################################################

SERVICE=${1:-all}

cd /opt/Budget_Mgt_Enterprise

case $SERVICE in
    backend)
        docker-compose logs -f budget_backend
        ;;
    frontend)
        docker-compose logs -f budget_frontend
        ;;
    nginx)
        docker-compose logs -f budget_nginx
        ;;
    postgres)
        docker-compose logs -f budget_postgres
        ;;
    redis)
        docker-compose logs -f budget_redis
        ;;
    all)
        docker-compose logs -f
        ;;
    *)
        echo "用法：$0 [backend|frontend|nginx|postgres|redis|all]"
        exit 1
        ;;
esac
