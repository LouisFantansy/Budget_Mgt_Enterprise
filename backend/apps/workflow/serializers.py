from rest_framework import serializers

from .models import WorkflowTemplate, ApprovalFlow, ApprovalStep, ApprovalStatus, ApprovalAction


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    """工作流模板信息"""

    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'type', 'steps', 'conditions',
            'is_active', 'version', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ApprovalStepSerializer(serializers.ModelSerializer):
    """审批步骤信息（含审批人名称）"""

    approver_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ApprovalStep
        fields = [
            'id', 'step_order', 'step_name',
            'approver_id', 'approver_name', 'approver_role',
            'action', 'action_display', 'comment', 'operated_at',
        ]
        read_only_fields = ['id']

    def get_approver_name(self, obj):
        if not obj.approver_id:
            return None
        from apps.auth_user.models import User
        try:
            user = User.objects.get(pk=obj.approver_id)
            return user.name
        except User.DoesNotExist:
            return None


class ApprovalFlowSerializer(serializers.ModelSerializer):
    """审批流程详情（嵌套 steps、关联的 budget/purchase 信息）"""

    steps = ApprovalStepSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    target_info = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalFlow
        fields = [
            'id', 'template_id', 'target_type', 'target_info',
            'current_step', 'status', 'status_display',
            'steps', 'created_at', 'completed_at',
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']

    def get_target_info(self, obj):
        """获取关联目标简要信息"""
        if obj.target_type == 'BUDGET' and obj.budget:
            return {
                'id': str(obj.budget.id),
                'budget_no': obj.budget.budget_no,
                'name': obj.budget.name,
                'total_amount': str(obj.budget.total_amount),
            }
        elif obj.target_type == 'PURCHASE' and obj.purchase:
            return {
                'id': str(obj.purchase.id),
                'request_no': obj.purchase.request_no,
                'purpose': obj.purchase.purpose,
                'total_amount': str(obj.purchase.total_amount),
            }
        return None


class ApprovalFlowListSerializer(serializers.ModelSerializer):
    """审批流程列表（含 target 信息简要）"""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    target_info = serializers.SerializerMethodField()
    current_step_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalFlow
        fields = [
            'id', 'target_type', 'target_info',
            'current_step', 'current_step_name',
            'status', 'status_display',
            'created_at', 'completed_at',
        ]

    def get_target_info(self, obj):
        """获取关联目标简要信息"""
        if obj.target_type == 'BUDGET' and obj.budget:
            return {
                'id': str(obj.budget.id),
                'budget_no': obj.budget.budget_no,
                'name': obj.budget.name,
                'total_amount': str(obj.budget.total_amount),
            }
        elif obj.target_type == 'PURCHASE' and obj.purchase:
            return {
                'id': str(obj.purchase.id),
                'request_no': obj.purchase.request_no,
                'purpose': obj.purchase.purpose,
                'total_amount': str(obj.purchase.total_amount),
            }
        return None

    def get_current_step_name(self, obj):
        step = obj.steps.filter(step_order=obj.current_step).first()
        return step.step_name if step else None


class ApproveActionSerializer(serializers.Serializer):
    """审批操作请求"""

    action = serializers.ChoiceField(choices=ApprovalAction.choices)
    comment = serializers.CharField(required=False, allow_blank=True, default='')
