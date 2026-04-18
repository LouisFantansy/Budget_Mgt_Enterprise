from datetime import datetime

from django.db.models import Q

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, UserStatus, Role, Permission, UserRole
from .serializers import (
    LoginSerializer, RegisterSerializer, ChangePasswordSerializer,
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    RoleSerializer, RoleCreateSerializer, PermissionSerializer,
    UserInfoSerializer, RoleBriefSerializer, DepartmentBriefSerializer,
)
from common.permissions import IsAdmin, ModulePermission
from common.utils import get_client_ip


def _log_audit(user, action, module, target_type=None, target_id=None,
               ip=None, user_agent=None, new_value=None):
    """记录审计日志"""
    from apps.audit.models import AuditLog
    AuditLog.objects.create(
        user_id=str(user.id),
        user_name=user.name or user.username,
        action=action,
        module=module,
        target_type=target_type,
        target_id=target_id,
        new_value=new_value,
        ip=ip,
        user_agent=user_agent,
    )


# ────────────────────────────────────────────
# 认证相关 Views
# ────────────────────────────────────────────

class LoginView(APIView):
    """POST /api/auth/login - 用户登录"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        try:
            user = User.objects.select_related('department').prefetch_related('roles').get(username=username)
        except User.DoesNotExist:
            return Response(
                {'code': 401, 'message': '用户名或密码错误', 'data': None},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 检查账户状态
        if user.status == UserStatus.DISABLED:
            return Response(
                {'code': 403, 'message': '账户已禁用，请联系管理员', 'data': None},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.status == UserStatus.LOCKED:
            return Response(
                {'code': 423, 'message': '账户已锁定，请联系管理员', 'data': None},
                status=status.HTTP_423_LOCKED,
            )

        # 验证密码
        if not user.check_password(password):
            user.login_attempts += 1
            if user.login_attempts >= 5:
                user.status = UserStatus.LOCKED
            user.save(update_fields=['login_attempts', 'status', 'updated_at'])
            remaining = 5 - user.login_attempts
            if user.status == UserStatus.LOCKED:
                msg = '登录失败次数过多，账户已锁定'
            else:
                msg = f'用户名或密码错误，还剩 {remaining} 次机会'
            return Response(
                {'code': 401, 'message': msg, 'data': None},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 登录成功
        user.login_attempts = 0
        user.last_login_at = datetime.now()
        user.save(update_fields=['login_attempts', 'last_login_at', 'updated_at'])

        # 生成 JWT Token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # 构建用户信息
        roles_data = RoleBriefSerializer(user.roles.all(), many=True).data
        dept_data = DepartmentBriefSerializer(user.department).data if user.department else None

        user_data = {
            'id': str(user.id),
            'username': user.username,
            'name': user.name,
            'roles': roles_data,
            'department': dept_data,
        }

        # 审计日志
        _log_audit(
            user=user, action='LOGIN', module='user',
            ip=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'token': access_token,
                'refreshToken': refresh_token,
                'user': user_data,
            },
        })


class RegisterView(APIView):
    """POST /api/auth/register - 用户注册"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 检查用户名是否已存在
        username = serializer.validated_data['username']
        if User.objects.filter(username=username).exists():
            return Response(
                {'code': 400, 'message': '用户名已存在', 'data': None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 检查邮箱是否已存在
        email = serializer.validated_data.get('email')
        if email and User.objects.filter(email=email).exists():
            return Response(
                {'code': 400, 'message': '邮箱已被注册', 'data': None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 创建用户
        dept_id = serializer.validated_data.get('departmentId')
        department = None
        if dept_id:
            from apps.department.models import Department
            try:
                department = Department.objects.get(id=dept_id)
            except Department.DoesNotExist:
                pass

        user = User.objects.create_user(
            username=username,
            password=request.data.get('password'),
            name=serializer.validated_data.get('name', ''),
            email=email,
            phone=serializer.validated_data.get('phone'),
            department=department,
        )

        # 审计日志
        _log_audit(
            user=user, action='CREATE', module='user',
            target_type='User', target_id=str(user.id),
            ip=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({
            'code': 201,
            'message': '注册成功',
            'data': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class RefreshTokenView(APIView):
    """POST /api/auth/refresh - 刷新 Token"""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refreshToken') or request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {'code': 400, 'message': 'refreshToken 不能为空', 'data': None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            return Response(
                {'code': 401, 'message': 'refreshToken 无效或已过期', 'data': None},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 获取用户并生成新的 token 对
        try:
            user_id = refresh.get('user_id')
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, KeyError):
            return Response(
                {'code': 401, 'message': '用户不存在', 'data': None},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        new_refresh = RefreshToken.for_user(user)
        access_token = str(new_refresh.access_token)
        new_refresh_token = str(new_refresh)

        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'token': access_token,
                'refreshToken': new_refresh_token,
            },
        })


class LogoutView(APIView):
    """POST /api/auth/logout - 登出"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refreshToken') or request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, AttributeError):
                pass  # token 已失效或黑名单功能未启用，忽略

        # 审计日志
        _log_audit(
            user=request.user, action='LOGIN', module='user',
            ip=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            new_value={'action': 'logout'},
        )

        return Response({
            'code': 200,
            'message': '登出成功',
            'data': None,
        })


class ChangePasswordView(APIView):
    """PUT /api/auth/password - 修改密码"""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password', 'updated_at'])

        # 审计日志
        _log_audit(
            user=user, action='UPDATE', module='user',
            target_type='User', target_id=str(user.id),
            ip=get_client_ip(request),
            new_value={'action': 'change_password'},
        )

        return Response({
            'code': 200,
            'message': '密码修改成功',
            'data': None,
        })


class CurrentUserView(APIView):
    """GET /api/auth/me - 获取当前用户信息"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # 预加载关联数据
        user = User.objects.select_related('department').prefetch_related(
            'roles', 'roles__permissions'
        ).get(id=user.id)

        # 构建权限列表
        permissions = set()
        for role in user.roles.all():
            for perm in role.permissions.all():
                permissions.add(perm.name)

        data = {
            'id': str(user.id),
            'username': user.username,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'avatar': user.avatar,
            'status': user.status,
            'department': DepartmentBriefSerializer(user.department).data if user.department else None,
            'roles': RoleBriefSerializer(user.roles.all(), many=True).data,
            'permissions': sorted(list(permissions)),
            'last_login_at': user.last_login_at,
        }

        return Response({
            'code': 200,
            'message': 'success',
            'data': data,
        })


# ────────────────────────────────────────────
# 用户管理 Views
# ────────────────────────────────────────────

class UserViewSet(ModelViewSet):
    """用户 CRUD - /api/users/"""
    queryset = User.objects.select_related('department').prefetch_related('roles').all()
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        department_id = self.request.query_params.get('departmentId')
        status_param = self.request.query_params.get('status')

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(name__icontains=search)
                | Q(email__icontains=search)
            )
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    def perform_create(self, serializer):
        user = serializer.save()
        _log_audit(
            user=self.request.user, action='CREATE', module='user',
            target_type='User', target_id=str(user.id),
            ip=get_client_ip(self.request),
            new_value={'username': user.username, 'name': user.name},
        )

    def perform_update(self, serializer):
        user = serializer.save()
        _log_audit(
            user=self.request.user, action='UPDATE', module='user',
            target_type='User', target_id=str(user.id),
            ip=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        # 软删除：设置 status=DISABLED
        instance.status = UserStatus.DISABLED
        instance.save(update_fields=['status', 'updated_at'])
        _log_audit(
            user=self.request.user, action='DELETE', module='user',
            target_type='User', target_id=str(instance.id),
            ip=get_client_ip(self.request),
            new_value={'status': 'DISABLED'},
        )

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """POST /api/users/{id}/reset-password/ - 重置密码为默认密码"""
        user = self.get_object()
        default_password = 'Password123!'
        user.set_password(default_password)
        user.login_attempts = 0
        if user.status == UserStatus.LOCKED:
            user.status = UserStatus.ACTIVE
        user.save(update_fields=['password', 'login_attempts', 'status', 'updated_at'])

        _log_audit(
            user=request.user, action='UPDATE', module='user',
            target_type='User', target_id=str(user.id),
            ip=get_client_ip(request),
            new_value={'action': 'reset_password'},
        )

        return Response({
            'code': 200,
            'message': '密码已重置为默认密码',
            'data': None,
        })


# ────────────────────────────────────────────
# 角色管理 Views
# ────────────────────────────────────────────

class RoleViewSet(ModelViewSet):
    """角色 CRUD - /api/roles/"""
    queryset = Role.objects.prefetch_related('permissions').all()
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return RoleCreateSerializer
        return RoleSerializer

    def perform_create(self, serializer):
        role = serializer.save()
        _log_audit(
            user=self.request.user, action='CREATE', module='user',
            target_type='Role', target_id=str(role.id),
            ip=get_client_ip(self.request),
            new_value={'name': role.name, 'display_name': role.display_name},
        )

    def perform_update(self, serializer):
        role = serializer.save()
        _log_audit(
            user=self.request.user, action='UPDATE', module='user',
            target_type='Role', target_id=str(role.id),
            ip=get_client_ip(self.request),
        )

    def destroy(self, request, *args, **kwargs):
        """删除角色 - 系统内置角色不可删除"""
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {'code': 400, 'message': '系统内置角色不可删除', 'data': None},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
        _log_audit(
            user=request.user, action='DELETE', module='user',
            target_type='Role', target_id=str(instance.id),
            ip=get_client_ip(request),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ────────────────────────────────────────────
# 权限管理 Views
# ────────────────────────────────────────────

class PermissionViewSet(ReadOnlyModelViewSet):
    """权限列表 - /api/permissions/"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        return queryset
