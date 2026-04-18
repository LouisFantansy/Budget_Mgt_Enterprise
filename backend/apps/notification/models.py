import uuid
from django.db import models


class NotificationType(models.TextChoices):
    APPROVAL_PENDING = 'APPROVAL_PENDING', '待审批'
    APPROVAL_RESULT = 'APPROVAL_RESULT', '审批结果'
    BUDGET_WARNING = 'BUDGET_WARNING', '预算预警'
    BUDGET_OVERRUN = 'BUDGET_OVERRUN', '预算超支'
    SYSTEM = 'SYSTEM', '系统通知'
    REPORT_READY = 'REPORT_READY', '报表就绪'


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=36, db_index=True)
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    content = models.TextField()
    link = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    channels = models.JSONField(default=list)  # ["in_app", "email", "wechat"]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
