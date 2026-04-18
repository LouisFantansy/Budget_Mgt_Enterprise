import uuid
from django.db import models


class UrgencyLevel(models.TextChoices):
    LOW = 'LOW', '低'
    NORMAL = 'NORMAL', '一般'
    HIGH = 'HIGH', '高'
    URGENT = 'URGENT', '紧急'


class PurchaseStatus(models.TextChoices):
    DRAFT = 'DRAFT', '草稿'
    PENDING = 'PENDING', '待提交'
    IN_APPROVAL = 'IN_APPROVAL', '审批中'
    APPROVED = 'APPROVED', '已通过'
    REJECTED = 'REJECTED', '已驳回'
    CANCELLED = 'CANCELLED', '已取消'


class PurchaseRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_no = models.CharField(max_length=20, unique=True, db_index=True)  # PR-2026-001
    applicant_id = models.CharField(max_length=36)
    department_id = models.CharField(max_length=36)
    budget = models.ForeignKey('budget.Budget', on_delete=models.PROTECT, related_name='purchases')
    budget_item_id = models.CharField(max_length=36, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2)
    purpose = models.TextField()
    urgency_level = models.CharField(max_length=10, choices=UrgencyLevel.choices, default=UrgencyLevel.NORMAL)
    status = models.CharField(max_length=15, choices=PurchaseStatus.choices, default=PurchaseStatus.DRAFT, db_index=True)
    current_step = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_requests'
        ordering = ['-created_at']


class PurchaseItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(PurchaseRequest, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    specification = models.CharField(max_length=200, null=True, blank=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2)
    supplier = models.CharField(max_length=200, null=True, blank=True)
    delivery_date = models.DateTimeField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'purchase_items'
