from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'action', 'module', 'target_type', 'created_at')
    list_filter = ('action', 'module', 'created_at')
    search_fields = ('user_name', 'action', 'module')
    readonly_fields = ('id', 'created_at')
