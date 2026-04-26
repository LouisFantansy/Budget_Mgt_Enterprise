from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import User, UserStatus, Role, Permission, UserRole, RolePermission


class PermissionSerializer(serializers.ModelSerializer):
    """权限信息"""

    class Meta:
        model = Permission
        fields = ['id', 'module', 'action', 'name', 'description']


class RoleSerializer(serializers.ModelSerializer):
    """角色信息（含 permissions 嵌套）"""
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True, write_only=True, required=False, source='permissions'
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'display_name', 'description', 'is_system', 'permissions', 'permission_ids', 'created_at', 'updated_at']
        read_only_fields = ['is_system', 'created_at', 'updated_at']


class RoleCreateSerializer(serializers.ModelSerializer):
    """创建/更新角色"""
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True, write_only=True, required=False, source='permissions'
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'display_name', 'description', 'permission_ids']

    def create(self, validated_data):
        permissions = validated_data.pop('permissions', [])
        role = Role.objects.create(**validated_data)
        if permissions:
            role.permissions.set(permissions)
        return role

    def update(self, instance, validated_data):
        permissions = validated_data.pop('permissions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance


class DepartmentBriefSerializer(serializers.Serializer):
    """部门简要信息"""
    id = serializers.UUIDField()
    name = serializers.CharField()
    code = serializers.CharField()


class RoleBriefSerializer(serializers.Serializer):
    """角色简要信息"""
    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()
    display_name = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """用户完整信息（含 roles, department 嵌套）"""
    roles = RoleBriefSerializer(many=True, read_only=True)
    department = DepartmentBriefSerializer(read_only=True)
    department_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'phone', 'avatar',
            'status', 'department', 'department_id', 'roles',
            'login_attempts', 'last_login_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'login_attempts', 'last_login_at', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """创建用户（含 roleIds）"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True, write_only=True, required=False, source='roles'
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'name', 'email', 'phone',
                  'status', 'department', 'role_ids']
        extra_kwargs = {
            'email': {'required': False, 'allow_null': True},
            'phone': {'required': False, 'allow_null': True},
            'status': {'required': False},
            'department': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        roles = validated_data.pop('roles', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if roles:
            user.roles.set(roles)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """更新用户"""
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True, write_only=True, required=False, source='roles'
    )

    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'avatar', 'status', 'department', 'role_ids']
        extra_kwargs = {
            'name': {'required': False},
            'email': {'required': False, 'allow_null': True},
            'phone': {'required': False, 'allow_null': True},
            'department': {'required': False, 'allow_null': True},
            'status': {'required': False},
        }

    def update(self, instance, validated_data):
        roles = validated_data.pop('roles', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance


class LoginSerializer(serializers.Serializer):
    """登录请求"""
    username = serializers.CharField(required=True, max_length=50)
    password = serializers.CharField(required=True, write_only=True)


class RegisterSerializer(serializers.Serializer):
    """注册请求"""
    username = serializers.CharField(required=True, max_length=50)
    password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    name = serializers.CharField(required=True, max_length=100)
    email = serializers.EmailField(required=False, allow_null=True, max_length=100)
    phone = serializers.CharField(required=False, allow_null=True, max_length=20)
    departmentId = serializers.UUIDField(required=False, allow_null=True)


class ChangePasswordSerializer(serializers.Serializer):
    """修改密码"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('旧密码不正确')
        return value


class UserInfoSerializer(serializers.Serializer):
    """当前用户信息（/auth/me 使用，包含 roles 详情和 permissions 列表）"""
    id = serializers.UUIDField()
    username = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField(allow_null=True)
    phone = serializers.CharField(allow_null=True)
    avatar = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    department = DepartmentBriefSerializer(allow_null=True)
    roles = RoleBriefSerializer(many=True)
    permissions = serializers.ListField()
    last_login_at = serializers.DateTimeField(allow_null=True)
