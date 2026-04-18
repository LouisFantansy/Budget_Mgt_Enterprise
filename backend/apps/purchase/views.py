from django.db.models import Q
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import DataIsolationMixin, RoleRequired
from common.utils import get_client_ip, success_response, error_response

from .models import PurchaseRequest, PurchaseStatus
from .serializers import (
    PurchaseRequestSerializer,
    PurchaseRequestListSerializer,
    PurchaseRequestCreateSerializer,
    PurchaseRequestUpdateSerializer,
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


class PurchaseRequestViewSet(DataIsolationMixin, ModelViewSet):
    """采购申请 CRUD"""

    queryset = PurchaseRequest.objects.all()
    serializer_class = PurchaseRequestSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), RoleRequired(['purchaser', 'dept_head', 'admin'])]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), RoleRequired(['purchaser', 'dept_head', 'admin'])]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseRequestListSerializer
        if self.action == 'create':
            return PurchaseRequestCreateSerializer
        if self.action in ['update', 'partial_update']:
            return PurchaseRequestUpdateSerializer
        return PurchaseRequestSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        budget_id = params.get('budgetId')
        if budget_id:
            qs = qs.filter(budget_id=budget_id)

        status_param = params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        urgency_level = params.get('urgencyLevel')
        if urgency_level:
            qs = qs.filter(urgency_level=urgency_level)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(request_no__icontains=search) | Q(purpose__icontains=search)
            )

        return qs

    # ---- 自定义 action ----

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """POST /api/purchases/{id}/submit/ - 提交审批"""
        purchase = self.get_object()
        if purchase.status != PurchaseStatus.DRAFT:
            return error_response('只有草稿状态的采购申请可以提交')

        # 验证关联预算可用金额
        budget = purchase.budget
        available = budget.total_amount - budget.used_amount - budget.frozen_amount
        if purchase.total_amount > available:
            return error_response(f'预算可用金额不足，当前可用: {available}')

        # 冻结预算金额
        budget.frozen_amount += purchase.total_amount
        budget.save(update_fields=['frozen_amount', 'updated_at'])

        purchase.status = PurchaseStatus.IN_APPROVAL
        purchase.save(update_fields=['status', 'updated_at'])

        # 触发审批流程
        from apps.workflow.services import WorkflowEngine
        flow = WorkflowEngine.create_approval_flow(
            'PURCHASE', str(purchase.id), purchase.total_amount, str(request.user.id)
        )

        _log_audit(
            user=request.user, action='SUBMIT', module='purchase',
            target_type='PurchaseRequest', target_id=str(purchase.id),
            ip=get_client_ip(request),
            new_value={
                'status': 'IN_APPROVAL',
                'request_no': purchase.request_no,
                'frozen_amount': str(budget.frozen_amount),
                'approval_flow_id': str(flow.id),
            },
        )

        return success_response({'id': str(purchase.id), 'status': purchase.status, 'approval_flow_id': str(flow.id)})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """POST /api/purchases/{id}/cancel/ - 取消采购申请"""
        purchase = self.get_object()
        if purchase.status not in [PurchaseStatus.DRAFT, PurchaseStatus.PENDING, PurchaseStatus.IN_APPROVAL]:
            return error_response('当前状态不允许取消')

        # 如果已冻结金额，释放
        if purchase.status in [PurchaseStatus.PENDING, PurchaseStatus.IN_APPROVAL]:
            budget = purchase.budget
            budget.frozen_amount = max(0, budget.frozen_amount - purchase.total_amount)
            budget.save(update_fields=['frozen_amount', 'updated_at'])

        purchase.status = PurchaseStatus.CANCELLED
        purchase.save(update_fields=['status', 'updated_at'])

        _log_audit(
            user=request.user, action='CANCEL', module='purchase',
            target_type='PurchaseRequest', target_id=str(purchase.id),
            ip=get_client_ip(request),
            new_value={
                'status': 'CANCELLED',
                'request_no': purchase.request_no,
            },
        )

        return success_response({'id': str(purchase.id), 'status': purchase.status})

    # ---- CRUD 钩子 ----

    def perform_create(self, serializer):
        purchase = serializer.save()
        _log_audit(
            user=self.request.user, action='CREATE', module='purchase',
            target_type='PurchaseRequest', target_id=str(purchase.id),
            ip=get_client_ip(self.request),
            new_value={'request_no': purchase.request_no, 'purpose': purchase.purpose},
        )

    def perform_update(self, serializer):
        purchase = serializer.save()
        _log_audit(
            user=self.request.user, action='UPDATE', module='purchase',
            target_type='PurchaseRequest', target_id=str(purchase.id),
            ip=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        if instance.status != PurchaseStatus.DRAFT:
            raise ValidationError('只有草稿状态的采购申请可以删除')
        instance.delete()
        _log_audit(
            user=self.request.user, action='DELETE', module='purchase',
            target_type='PurchaseRequest', target_id=str(instance.id),
            ip=get_client_ip(self.request),
            new_value={'request_no': instance.request_no},
        )
