import uuid
from django.db import models


class ApprovalStatus(models.TextChoices):
    PENDING = 'PENDING', '待处理'
    IN_PROGRESS = 'IN_PROGRESS', '进行中'
    APPROVED = 'APPROVED', '已通过'
    REJECTED = 'REJECTED', '已驳回'
    CANCELLED = 'CANCELLED', '已取消'


class ApprovalAction(models.TextChoices):
    APPROVE = 'APPROVE', '通过'
    REJECT = 'REJECT', '驳回'
    WITHDRAW = 'WITHDRAW', '撤回'


class WorkflowTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=30, db_index=True)  # BUDGET_APPROVAL, PURCHASE_APPROVAL, ADJUSTMENT_APPROVAL
    steps = models.JSONField()  # 步骤定义
    conditions = models.JSONField(null=True, blank=True)  # 触发条件
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workflow_templates'


class ApprovalFlow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template_id = models.CharField(max_length=36, null=True, blank=True)
    target_type = models.CharField(max_length=20)  # BUDGET, PURCHASE, ADJUSTMENT
    budget = models.ForeignKey('budget.Budget', on_delete=models.CASCADE, null=True, blank=True, related_name='approvals')
    purchase = models.ForeignKey('purchase.PurchaseRequest', on_delete=models.CASCADE, null=True, blank=True, related_name='approvals')
    current_step = models.IntegerField(default=1)
    status = models.CharField(max_length=15, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'approval_flows'


class ApprovalStep(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flow = models.ForeignKey(ApprovalFlow, on_delete=models.CASCADE, related_name='steps')
    step_order = models.IntegerField()
    step_name = models.CharField(max_length=100)
    approver_id = models.CharField(max_length=36, null=True, blank=True)
    approver_role = models.CharField(max_length=50, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ApprovalAction.choices, null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    operated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'approval_steps'
        ordering = ['step_order']
