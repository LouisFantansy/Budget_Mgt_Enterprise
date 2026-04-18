from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """审计日志序列化器"""

    action_display = serializers.SerializerMethodField()
    module_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_id', 'user_name', 'action', 'action_display',
            'module', 'module_display', 'target_type', 'target_id',
            'old_value', 'new_value', 'ip', 'user_agent', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_action_display(self, obj):
        """操作类型显示"""
        action_map = {
            'CREATE': '创建',
            'UPDATE': '更新',
            'DELETE': '删除',
            'APPROVE': '审批通过',
            'REJECT': '审批驳回',
            'SUBMIT': '提交',
            'ADJUST': '调整',
            'LOGIN': '登录',
            'LOGOUT': '登出',
            'EXPORT': '导出',
            'IMPORT': '导入',
        }
        return action_map.get(obj.action, obj.action)

    def get_module_display(self, obj):
        """模块显示"""
        module_map = {
            'budget': '预算管理',
            'purchase': '采购管理',
            'approval': '审批管理',
            'user': '用户管理',
            'department': '部门管理',
            'system': '系统管理',
            'report': '报表分析',
            'import_export': '导入导出',
        }
        return module_map.get(obj.module, obj.module)


class AuditLogExportSerializer(serializers.ModelSerializer):
    """审计日志导出序列化器"""

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_name', 'action', 'module',
            'target_type', 'target_id', 'ip', 'created_at',
        ]
