"""
开发环境配置
"""
from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ['*']

SECRET_KEY = os.environ.get(  # noqa: F405
    'DJANGO_SECRET_KEY',
    'django-insecure-dev-key-change-in-production-2026'
)

# MySQL 数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'budget_management'),  # noqa: F405
        'USER': os.environ.get('DB_USER', 'root'),  # noqa: F405
        'PASSWORD': os.environ.get('DB_PASSWORD', 'root'),  # noqa: F405
        'HOST': os.environ.get('DB_HOST', 'localhost'),  # noqa: F405
        'PORT': os.environ.get('DB_PORT', '3306'),  # noqa: F405
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# CORS - 开发环境允许所有来源
CORS_ALLOW_ALL_ORIGINS = True
