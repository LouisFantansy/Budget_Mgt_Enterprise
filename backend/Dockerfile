FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖（mysqlclient 需要）
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=300 -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt

# 复制项目代码
COPY . .

# 收集静态文件
RUN DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py collectstatic --noinput || true

EXPOSE 8000

# 使用 Gunicorn 启动
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
