from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView, RegisterView, RefreshTokenView, LogoutView,
    ChangePasswordView, CurrentUserView,
    UserViewSet, RoleViewSet, PermissionViewSet,
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('roles', RoleViewSet, basename='role')
router.register('permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    # 认证相关
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/password/', ChangePasswordView.as_view(), name='auth-password'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    # 用户管理 / 角色管理 / 权限列表 (router)
    path('', include(router.urls)),
]
