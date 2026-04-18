from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from common.utils import success_response, error_response
from common.permissions import RoleRequired

from .models import ApprovalFlow, ApprovalStatus
from .serializers import (
    ApprovalFlowSerializer,
    ApprovalFlowListSerializer,
    ApproveActionSerializer,
)
from .services import WorkflowEngine


class ApprovalViewSet(viewsets.ViewSet):
    """审批操作"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /api/approvals/ - 待审批列表

        根据当前用户角色筛选当前步骤匹配的审批流程。
        支持 targetType 查询参数筛选。
        """
        user_roles = set(request.user.roles.values_list('name', flat=True))

        # 查询 IN_PROGRESS 的流程
        flows = ApprovalFlow.objects.filter(status=ApprovalStatus.IN_PROGRESS).select_related('budget', 'purchase')

        # 筛选当前步骤角色匹配的
        result = []
        for flow in flows:
            current_step = flow.steps.filter(step_order=flow.current_step).first()
            if current_step and (current_step.approver_role in user_roles or 'admin' in user_roles):
                result.append(flow)

        # 支持 targetType 筛选
        target_type = request.query_params.get('targetType')
        if target_type:
            result = [f for f in result if f.target_type == target_type]

        serializer = ApprovalFlowListSerializer(result, many=True)
        return success_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my')
    def my_approvals(self, request):
        """GET /api/approvals/my/ - 我发起的审批"""
        user_id = str(request.user.id)

        # 通过 budget.creator_id 或 purchase.applicant_id 查找
        budget_flows = list(
            ApprovalFlow.objects.filter(
                target_type='BUDGET', budget__creator_id=user_id
            ).select_related('budget', 'purchase')
        )
        purchase_flows = list(
            ApprovalFlow.objects.filter(
                target_type='PURCHASE', purchase__applicant_id=user_id
            ).select_related('budget', 'purchase')
        )
        flows = budget_flows + purchase_flows
        flows.sort(key=lambda f: f.created_at, reverse=True)

        serializer = ApprovalFlowListSerializer(flows, many=True)
        return success_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='all')
    def all_approvals(self, request):
        """GET /api/approvals/all/ - 所有审批流程（管理员/预算管理员/财务）"""
        user_roles = set(request.user.roles.values_list('name', flat=True))
        if not user_roles & {'admin', 'budget_manager', 'finance'}:
            return error_response('权限不足', status_code=403)

        flows = ApprovalFlow.objects.all().select_related('budget', 'purchase').order_by('-created_at')

        # 支持筛选
        status_param = request.query_params.get('status')
        if status_param:
            flows = flows.filter(status=status_param)

        target_type = request.query_params.get('targetType')
        if target_type:
            flows = flows.filter(target_type=target_type)

        serializer = ApprovalFlowListSerializer(flows, many=True)
        return success_response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/approvals/{id}/ - 审批详情"""
        try:
            flow = ApprovalFlow.objects.get(id=pk)
        except ApprovalFlow.DoesNotExist:
            return error_response('审批流程不存在', status_code=404)

        serializer = ApprovalFlowSerializer(flow)
        return success_response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """POST /api/approvals/{id}/approve/ - 通过"""
        comment = request.data.get('comment', '')
        try:
            WorkflowEngine.process_approval(pk, request.user, 'APPROVE', comment)
            return success_response({'message': '审批通过'})
        except ValueError as e:
            return error_response(str(e))
        except PermissionError as e:
            return error_response(str(e), status_code=403)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """POST /api/approvals/{id}/reject/ - 驳回"""
        reason = request.data.get('reason', '')
        if not reason:
            return error_response('驳回原因不能为空')
        try:
            WorkflowEngine.process_approval(pk, request.user, 'REJECT', reason)
            return success_response({'message': '已驳回'})
        except ValueError as e:
            return error_response(str(e))
        except PermissionError as e:
            return error_response(str(e), status_code=403)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """POST /api/approvals/{id}/withdraw/ - 撤回"""
        try:
            WorkflowEngine.withdraw_approval(pk, str(request.user.id))
            return success_response({'message': '已撤回'})
        except ValueError as e:
            return error_response(str(e))
