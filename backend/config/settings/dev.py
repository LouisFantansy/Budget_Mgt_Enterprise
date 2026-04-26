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

# SQLite 数据库（开发环境，无需 Docker）
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',  # noqa: F405
    }
}

# CORS - 开发环境允许所有来源
CORS_ALLOW_ALL_ORIGINS = True
