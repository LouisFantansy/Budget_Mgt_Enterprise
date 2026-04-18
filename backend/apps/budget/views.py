from django.db.models import Q
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import DataIsolationMixin, RoleRequired
from common.utils import get_client_ip, generate_adjust_no, success_response, error_response

from .models import Budget, BudgetItem, BudgetAdjustment, BudgetStatus
from .serializers import (
    BudgetSerializer,
    BudgetListSerializer,
    BudgetCreateSerializer,
    BudgetUpdateSerializer,
    BudgetAdjustSerializer,
    BudgetAdjustmentSerializer,
)


def _log_audit(user, action, module, target_type=None, target_id=None,
               ip=None, user_agent=None, new_value=None):
    """记录审计日志"""
    from apps.audit.models import AuditLog
    AuditLog.objects.create(
        user_id=str(user.id),
        user_name=user.name or user.username,
        action=action,
        module=module,
        target_type=target_type,
        target_id=target_id,
        new_value=new_value,
        ip=ip,
        user_agent=user_agent,
    )


class BudgetViewSet(DataIsolationMixin, ModelViewSet):
    """预算 CRUD + 提交审批 + 预算调整"""

    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated(), RoleRequired(['dept_head', 'budget_manager', 'admin'])]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), RoleRequired(['dept_head', 'budget_manager', 'admin'])]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return BudgetListSerializer
        if self.action == 'create':
            return BudgetCreateSerializer
        if self.action in ['update', 'partial_update']:
            return BudgetUpdateSerializer
        return BudgetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        department_id = params.get('departmentId')
        if department_id:
            qs = qs.filter(department_id=department_id)

        year = params.get('year')
        if year:
            qs = qs.filter(year=year)

        status_param = params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        type_param = params.get('type')
        if type_param:
            qs = qs.filter(type=type_param)

        search = params.get('search')
        if search:
            qs = qs.filter(Q(budget_no__icontains=search) | Q(name__icontains=search))

        return qs

    # ---- 自定义 action ----

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """POST /api/budgets/{id}/submit/ - 提交审批"""
        budget = self.get_object()
        if budget.status != BudgetStatus.DRAFT:
            return error_response('只有草稿状态的预算可以提交审批')

        budget.status = BudgetStatus.PENDING
        budget.save(update_fields=['status', 'updated_at'])

        # 触发审批流程
        from apps.workflow.services import WorkflowEngine
        flow = WorkflowEngine.create_approval_flow(
            'BUDGET', str(budget.id), budget.total_amount, str(request.user.id)
        )

        _log_audit(
            user=request.user, action='SUBMIT', module='budget',
            target_type='Budget', target_id=str(budget.id),
            ip=get_client_ip(request),
            new_value={
                'status': 'PENDING',
                'budget_no': budget.budget_no,
                'approval_flow_id': str(flow.id),
            },
        )

        return success_response({'id': str(budget.id), 'status': budget.status, 'approval_flow_id': str(flow.id)})

    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """POST /api/budgets/{id}/adjust/ - 预算调整"""
        budget = self.get_object()
        if budget.status != BudgetStatus.APPROVED:
            return error_response('只有已审批的预算可以调整')

        serializer = BudgetAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 创建调整记录
        adjust_no = generate_adjust_no(budget.year)
        adjustment = BudgetAdjustment.objects.create(
            budget=budget,
            adjust_no=adjust_no,
            original_amount=budget.total_amount,
            adjusted_amount=serializer.validated_data['adjusted_amount'],
            reason=serializer.validated_data['reason'],
            items=serializer.validated_data.get('items'),
            creator_id=str(request.user.id),
        )

        # 更新预算金额和状态
        budget.total_amount = serializer.validated_data['adjusted_amount']
        budget.status = BudgetStatus.ADJUSTED
        budget.save(update_fields=['total_amount', 'status', 'updated_at'])

        _log_audit(
            user=request.user, action='ADJUST', module='budget',
            target_type='Budget', target_id=str(budget.id),
            ip=get_client_ip(request),
            new_value={
                'adjust_no': adjust_no,
                'original_amount': str(adjustment.original_amount),
                'adjusted_amount': str(adjustment.adjusted_amount),
                'reason': adjustment.reason,
            },
        )

        return success_response(BudgetAdjustmentSerializer(adjustment).data)

    # ---- CRUD 钩子 ----

    def perform_create(self, serializer):
        budget = serializer.save()
        _log_audit(
            user=self.request.user, action='CREATE', module='budget',
            target_type='Budget', target_id=str(budget.id),
            ip=get_client_ip(self.request),
            new_value={'budget_no': budget.budget_no, 'name': budget.name},
        )

    def perform_update(self, serializer):
        budget = serializer.save()
        _log_audit(
            user=self.request.user, action='UPDATE', module='budget',
            target_type='Budget', target_id=str(budget.id),
            ip=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        if instance.status != BudgetStatus.DRAFT:
            raise ValidationError('只有草稿状态的预算可以删除')
        instance.delete()
        _log_audit(
            user=self.request.user, action='DELETE', module='budget',
            target_type='Budget', target_id=str(instance.id),
            ip=get_client_ip(self.request),
            new_value={'budget_no': instance.budget_no},
        )
