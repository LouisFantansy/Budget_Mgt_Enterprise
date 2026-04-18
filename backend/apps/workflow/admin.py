from django.contrib import admin
from .models import WorkflowTemplate, ApprovalFlow, ApprovalStep


@admin.register(WorkflowTemplate)
class WorkflowTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'is_active', 'version', 'created_at')
    list_filter = ('type', 'is_active', 'created_at')
    search_fields = ('name', 'type')
    readonly_fields = ('id', 'created_at')


@admin.register(ApprovalFlow)
class ApprovalFlowAdmin(admin.ModelAdmin):
    list_display = ('id', 'target_type', 'current_step', 'status', 'created_at', 'completed_at')
    list_filter = ('target_type', 'status', 'created_at')
    readonly_fields = ('id', 'created_at', 'completed_at')


@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    list_display = ('flow', 'step_order', 'step_name', 'action', 'operated_at')
    list_filter = ('action', 'operated_at')
    search_fields = ('step_name',)
    readonly_fields = ('id',)
