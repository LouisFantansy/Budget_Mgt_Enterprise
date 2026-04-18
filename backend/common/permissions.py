from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """仅管理员"""
    message = '需要管理员权限'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.roles.filter(name='admin').exists()


class IsOwnerOrAdmin(BasePermission):
    """资源所有者或管理员权限"""
    message = '无权操作此资源'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.roles.filter(name='admin').exists():
            return True
        return getattr(obj, 'created_by', None) == request.user


class RoleRequired(BasePermission):
    """检查是否具有指定角色"""
    message = '权限不足'
    required_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user_roles = set(request.user.roles.values_list('name', flat=True))
        # admin 角色拥有所有权限
        if 'admin' in user_roles:
            return True
        return bool(user_roles & set(self.required_roles))


class ModulePermission(BasePermission):
    """模块级别权限检查"""
    message = '权限不足'
    module = ''

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # admin 拥有所有权限
        if request.user.roles.filter(name='admin').exists():
            return True
        # 根据 HTTP method 映射 action
        action_map = {
            'GET': 'read', 'HEAD': 'read', 'OPTIONS': 'read',
            'POST': 'create', 'PUT': 'update', 'PATCH': 'update',
            'DELETE': 'delete',
        }
        action = action_map.get(request.method, 'read')
        permission_name = f"{self.module}:{action}"
        return request.user.roles.filter(
            permissions__name=permission_name
        ).exists()


class DataIsolationMixin:
    """数据隔离查询集过滤"""

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user or not user.is_authenticated:
            return qs.none()

        user_roles = set(user.roles.values_list('name', flat=True))

        # admin, budget_manager, finance: 全公司数据
        if user_roles & {'admin', 'budget_manager', 'finance'}:
            return qs

        # dept_head: 本部门及子部门
        if 'dept_head' in user_roles:
            dept = user.department
            if dept:
                dept_ids = [dept.id] + list(dept.children.values_list('id', flat=True))
                return qs.filter(department_id__in=dept_ids)

        # purchaser, viewer: 本部门数据
        if user.department:
            return qs.filter(department_id=user.department_id)

        return qs.none()
