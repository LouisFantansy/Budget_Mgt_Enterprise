import uuid
from django.db import models


class DepartmentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', '正常'
    INACTIVE = 'INACTIVE', '停用'


class DepartmentType(models.TextChoices):
    """部门类型"""
    FIRST = 'FIRST', '一级部门'
    SECOND = 'SECOND', '二级部门'
    SS_PUBLIC = 'SS_PUBLIC', 'SS Public'


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    # 部门类型：一级部门/二级部门/SS Public
    dept_type = models.CharField(max_length=15, choices=DepartmentType.choices, default=DepartmentType.SECOND)
    # 一级部门的简称（如 SS）
    short_name = models.CharField(max_length=50, null=True, blank=True, help_text='一级部门简称，如 SS')
    # 层级（兼容旧数据，一级部门level=1，二级部门level=2）
    level = models.IntegerField(default=2)
    # 上级部门（二级部门的上级是一级部门）
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    # 部门负责人（二级部门负责人）
    manager = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='managed_departments')
    # 主预算管理员
    primary_budget_admin = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='primary_budget_departments')
    # 次预算管理员（可多个，用JSON存储或单独关联表）
    secondary_budget_admins = models.ManyToManyField('auth_user.User', through='DepartmentBudgetAdmin',
                                                      related_name='secondary_budget_departments', blank=True)
    sort_order = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=DepartmentStatus.choices, default=DepartmentStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['sort_order', 'code']

    @property
    def is_first_level(self):
        return self.dept_type == DepartmentType.FIRST

    @property
    def is_second_level(self):
        return self.dept_type == DepartmentType.SECOND

    @property
    def is_ss_public(self):
        return self.dept_type == DepartmentType.SS_PUBLIC


class DepartmentBudgetAdmin(models.Model):
    """部门与次预算管理员关联表"""
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    user = models.ForeignKey('auth_user.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'department_budget_admins'
        unique_together = ('department', 'user')
