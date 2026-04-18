import uuid
from django.db import models


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=36, db_index=True)
    user_name = models.CharField(max_length=100)
    action = models.CharField(max_length=20, db_index=True)  # CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, EXPORT
    module = models.CharField(max_length=20, db_index=True)  # budget, purchase, approval, user, system
    target_type = models.CharField(max_length=50, null=True, blank=True)
    target_id = models.CharField(max_length=36, null=True, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip = models.CharField(max_length=50, null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
