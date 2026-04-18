import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', '正常'
    DISABLED = 'DISABLED', '禁用'
    LOCKED = 'LOCKED', '锁定'


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
    department = models.ForeignKey('department.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    roles = models.ManyToManyField('Role', through='UserRole', related_name='users', blank=True)
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


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, db_index=True)  # admin, budget_manager, dept_head, finance, purchaser, viewer
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
