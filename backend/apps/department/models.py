import uuid
from django.db import models


class DepartmentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', '正常'
    INACTIVE = 'INACTIVE', '停用'


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    level = models.IntegerField(default=1)  # 1/2/3 三级
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    manager_id = models.CharField(max_length=36, null=True, blank=True)  # 部门负责人
    budget_admin_id = models.CharField(max_length=36, null=True, blank=True)  # 预算管理员
    sort_order = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=DepartmentStatus.choices, default=DepartmentStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['sort_order', 'code']
