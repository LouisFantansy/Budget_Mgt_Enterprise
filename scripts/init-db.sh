#!/bin/bash
# 等待后端服务启动后执行
echo "Waiting for backend service..."
sleep 10

echo "Running database migrations..."
docker exec budget_backend python manage.py migrate

echo "Seeding initial data..."
docker exec budget_backend python manage.py seed_data

echo "Database initialization completed!"
