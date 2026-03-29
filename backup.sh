#!/bin/bash

################################################################################
# 企业级预算管理系统 - 快速备份脚本
# 使用方法：sudo ./backup.sh
################################################################################

set -e

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "开始备份数据库..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec budget_postgres pg_dump -U postgres budget_management > $BACKUP_DIR/db_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "备份完成：$BACKUP_DIR/db_$DATE.sql.gz"
