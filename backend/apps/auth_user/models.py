import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', '正常'
    DISABLED = 'DISABLED', '禁用'
    LOCKED = 'LOCKED', '锁定'


class UserRoleCode(models.TextChoices):
    """用户角色编码"""
    # 一级部门角色
    FIRST_BUDGET_ADMIN = 'FIRST_BUDGET_ADMIN', '一级部门预算管理员'
    FIRST_BUDGET_HOST = 'FIRST_BUDGET_HOST', '一级部门预算管理员主办'
    FIRST_DEPT_HEAD = 'FIRST_DEPT_HEAD', '一级部门负责人'
    # 二级部门角色
    SECOND_BUDGET_ADMIN_PRIMARY = 'SECOND_BUDGET_ADMIN_PRIMARY', '主二级部门预算管理员'
    SECOND_BUDGET_ADMIN_SECONDARY = 'SECOND_BUDGET_ADMIN_SECONDARY', '次二级部门预算管理员'
    SECOND_DEPT_HEAD = 'SECOND_DEPT_HEAD', '二级部门负责人'
    # 普通员工
    ENGINEER = 'ENGINEER', '一线工程师'
    # 系统管理员（保留）
    ADMIN = 'ADMIN', '系统管理员'


class BudgetAdminType(models.TextChoices):
    """二级部门预算管理员类型"""
    PRIMARY = 'PRIMARY', '主预算管理员'
    SECONDARY = 'SECONDARY', '次预算管理员'


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('用户名不能为空')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('status', UserStatus.ACTIVE)
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=50, unique=True, db_index=True)
    password = models.CharField(max_length=128)  # bcrypt
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, null=True, blank=True, unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    avatar = models.CharField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=10, choices=UserStatus.choices, default=UserStatus.ACTIVE)
    # 部门关联
    department = models.ForeignKey('department.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    # 角色（多对多）
    roles = models.ManyToManyField('Role', through='UserRole', related_name='users', blank=True)
    # 二级部门预算管理员类型（仅当角色包含二级预算管理员时有效）
    budget_admin_type = models.CharField(max_length=10, choices=BudgetAdminType.choices, null=True, blank=True,
                                         help_text='二级部门预算管理员类型：主/次')
    login_attempts = models.IntegerField(default=0)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    @property
    def is_first_budget_admin(self):
        return self.roles.filter(code=UserRoleCode.FIRST_BUDGET_ADMIN).exists()

    @property
    def is_first_budget_host(self):
        return self.roles.filter(code=UserRoleCode.FIRST_BUDGET_HOST).exists()

    @property
    def is_first_dept_head(self):
        return self.roles.filter(code=UserRoleCode.FIRST_DEPT_HEAD).exists()

    @property
    def is_second_budget_admin_primary(self):
        return self.roles.filter(code=UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY).exists()

    @property
    def is_second_budget_admin_secondary(self):
        return self.roles.filter(code=UserRoleCode.SECOND_BUDGET_ADMIN_SECONDARY).exists()

    @property
    def is_second_dept_head(self):
        return self.roles.filter(code=UserRoleCode.SECOND_DEPT_HEAD).exists()

    @property
    def is_engineer(self):
        return self.roles.filter(code=UserRoleCode.ENGINEER).exists()

    @property
    def is_admin(self):
        return self.roles.filter(code=UserRoleCode.ADMIN).exists()

    @property
    def is_budget_admin(self):
        """是否为预算管理员（一级或二级）"""
        return self.roles.filter(
            code__in=[
                UserRoleCode.FIRST_BUDGET_ADMIN,
                UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY,
                UserRoleCode.SECOND_BUDGET_ADMIN_SECONDARY
            ]
        ).exists()

    @property
    def is_dept_head(self):
        """是否为部门负责人（一级或二级）"""
        return self.roles.filter(
            code__in=[UserRoleCode.FIRST_DEPT_HEAD, UserRoleCode.SECOND_DEPT_HEAD]
        ).exists()


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True, help_text='角色编码，如 FIRST_BUDGET_ADMIN')
    name = models.CharField(max_length=50, unique=True, db_index=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    is_system = models.BooleanField(default=False)
    permissions = models.ManyToManyField('Permission', through='RolePermission', related_name='roles', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'roles'


class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.CharField(max_length=50, db_index=True)  # budget, purchase, approval, report, system
    action = models.CharField(max_length=50)  # create, read, update, delete, approve, export
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'permissions'


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        db_table = 'user_roles'
        unique_together = ('user', 'role')


class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role', 'permission')
