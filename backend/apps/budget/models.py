import uuid
from django.db import models


class BudgetType(models.TextChoices):
    OPEX = 'OPEX', '运营支出'
    CAPEX = 'CAPEX', '资本支出'


class BudgetStatus(models.TextChoices):
    DRAFT = 'DRAFT', '草稿'
    PENDING = 'PENDING', '待审批'
    APPROVED = 'APPROVED', '已审批'
    REJECTED = 'REJECTED', '已驳回'
    ADJUSTED = 'ADJUSTED', '已调整'
    CLOSED = 'CLOSED', '已关闭'


class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget_no = models.CharField(max_length=20, unique=True, db_index=True)  # BG-2026-001
    name = models.CharField(max_length=200)
    department = models.ForeignKey('department.Department', on_delete=models.PROTECT, related_name='budgets')
    type = models.CharField(max_length=5, choices=BudgetType.choices)
    year = models.IntegerField(db_index=True)
    version = models.IntegerField(default=1)
    parent_id = models.CharField(max_length=36, null=True, blank=True)  # 调整前版本
    total_amount = models.DecimalField(max_digits=18, decimal_places=2)
    used_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    frozen_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    payment_entity = models.CharField(max_length=200, null=True, blank=True)
    group = models.CharField(max_length=100, null=True, blank=True)
    account_code = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=10, choices=BudgetStatus.choices, default=BudgetStatus.DRAFT, db_index=True)
    creator_id = models.CharField(max_length=36)
    remark = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets'
        ordering = ['-created_at']


class BudgetItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)  # 费用类别
    specification = models.CharField(max_length=200, null=True, blank=True)
    function = models.CharField(max_length=200, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    quantity = models.IntegerField()
    total_amount = models.DecimalField(max_digits=18, decimal_places=2)
    used_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    frozen_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    payment_entity = models.CharField(max_length=200, null=True, blank=True)
    group = models.CharField(max_length=100, null=True, blank=True)
    account_code = models.CharField(max_length=50, null=True, blank=True)
    monthly_plan = models.JSONField(null=True, blank=True)  # {"1": 100000, "2": 200000, ...}
    project = models.CharField(max_length=200, null=True, blank=True)
    purpose = models.CharField(max_length=500, null=True, blank=True)
    supplier = models.CharField(max_length=200, null=True, blank=True)
    delivery_date = models.DateTimeField(null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'budget_items'
        ordering = ['sort_order']


class BudgetAdjustment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='adjustments')
    adjust_no = models.CharField(max_length=20, unique=True, db_index=True)  # ADJ-2026-001
    original_amount = models.DecimalField(max_digits=18, decimal_places=2)
    adjusted_amount = models.DecimalField(max_digits=18, decimal_places=2)
    reason = models.TextField()
    items = models.JSONField(null=True, blank=True)  # 调整明细快照
    status = models.CharField(
        max_length=10,
        choices=[('PENDING', '待审批'), ('APPROVED', '已通过'), ('REJECTED', '已驳回')],
        default='PENDING'
    )
    creator_id = models.CharField(max_length=36)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'budget_adjustments'
