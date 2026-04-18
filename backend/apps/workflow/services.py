from decimal import Decimal

from django.utils import timezone

from .models import ApprovalFlow, ApprovalStep, ApprovalStatus


class WorkflowEngine:
    """审批引擎 - 多级审批工作流核心服务"""

    # 金额分级阈值
    TIER_1 = Decimal('50000')      # 5万
    TIER_2 = Decimal('500000')     # 50万

    # 审批步骤配置
    STEPS_2 = [
        {'step_order': 1, 'step_name': '部门负责人审批', 'approver_role': 'dept_head'},
        {'step_order': 2, 'step_name': '预算管理员审批', 'approver_role': 'budget_manager'},
    ]
    STEPS_3 = [
        {'step_order': 1, 'step_name': '部门负责人审批', 'approver_role': 'dept_head'},
        {'step_order': 2, 'step_name': '预算管理员审批', 'approver_role': 'budget_manager'},
        {'step_order': 3, 'step_name': '总监审批', 'approver_role': 'finance'},
    ]
    STEPS_4 = [
        {'step_order': 1, 'step_name': '部门负责人审批', 'approver_role': 'dept_head'},
        {'step_order': 2, 'step_name': '预算管理员审批', 'approver_role': 'budget_manager'},
        {'step_order': 3, 'step_name': '总监审批', 'approver_role': 'finance'},
        {'step_order': 4, 'step_name': '总经理审批', 'approver_role': 'admin'},
    ]

    @staticmethod
    def _get_steps_config(amount):
        """根据金额确定审批级数

        - < 50000 (5万)：2级（部门负责人 → 预算管理员）
        - 50000-500000 (5-50万)：3级（部门负责人 → 预算管理员 → 总监）
        - >= 500000 (50万)：4级（部门负责人 → 预算管理员 → 总监 → 总经理）
        """
        amount = Decimal(str(amount))
        if amount < WorkflowEngine.TIER_1:
            return WorkflowEngine.STEPS_2
        elif amount < WorkflowEngine.TIER_2:
            return WorkflowEngine.STEPS_3
        else:
            return WorkflowEngine.STEPS_4

    @staticmethod
    def create_approval_flow(target_type, target_id, amount, creator_id):
        """创建审批流程

        Args:
            target_type: 目标类型 'BUDGET' / 'PURCHASE'
            target_id: 目标对象 ID（UUID 字符串）
            amount: 金额（用于确定审批级数）
            creator_id: 发起人 ID

        Returns:
            ApprovalFlow 实例
        """
        steps_config = WorkflowEngine._get_steps_config(amount)

        # 创建 ApprovalFlow
        flow_kwargs = {
            'target_type': target_type,
            'current_step': 1,
            'status': ApprovalStatus.IN_PROGRESS,
        }
        if target_type == 'BUDGET':
            flow_kwargs['budget_id'] = target_id
        elif target_type == 'PURCHASE':
            flow_kwargs['purchase_id'] = target_id

        flow = ApprovalFlow.objects.create(**flow_kwargs)

        # 创建审批步骤
        for step_conf in steps_config:
            ApprovalStep.objects.create(flow=flow, **step_conf)

        return flow

    @staticmethod
    def process_approval(flow_id, approver, action, comment=''):
        """处理审批操作

        Args:
            flow_id: 审批流程 ID
            approver: 审批人 User 实例
            action: 'APPROVE' 或 'REJECT'
            comment: 审批意见

        Raises:
            ValueError: 流程状态异常
            PermissionError: 审批人无权限
        """
        try:
            flow = ApprovalFlow.objects.get(id=flow_id)
        except ApprovalFlow.DoesNotExist:
            raise ValueError('审批流程不存在')

        if flow.status != ApprovalStatus.IN_PROGRESS:
            raise ValueError('该审批流程已结束')

        # 获取当前步骤
        current_step = flow.steps.filter(step_order=flow.current_step).first()
        if not current_step:
            raise ValueError('审批步骤异常')

        # 验证审批人权限（角色匹配，admin 拥有所有步骤审批权限）
        approver_roles = set(approver.roles.values_list('name', flat=True))
        if 'admin' not in approver_roles and current_step.approver_role not in approver_roles:
            raise PermissionError('您没有权限审批此步骤')

        # 检查步骤是否已被操作
        if current_step.action is not None:
            raise ValueError('该步骤已被处理')

        # 记录审批操作
        current_step.approver_id = str(approver.id)
        current_step.action = action
        current_step.comment = comment
        current_step.operated_at = timezone.now()
        current_step.save()

        if action == ApprovalStatus.APPROVED or action == 'APPROVE':
            # 检查是否还有下一步
            next_step = flow.steps.filter(step_order=flow.current_step + 1).first()
            if next_step:
                flow.current_step += 1
                flow.save(update_fields=['current_step'])
            else:
                # 所有步骤通过，流程结束
                flow.status = ApprovalStatus.APPROVED
                flow.completed_at = timezone.now()
                flow.save(update_fields=['status', 'completed_at'])
                WorkflowEngine._on_approved(flow)

        elif action == ApprovalStatus.REJECTED or action == 'REJECT':
            flow.status = ApprovalStatus.REJECTED
            flow.completed_at = timezone.now()
            flow.save(update_fields=['status', 'completed_at'])
            WorkflowEngine._on_rejected(flow)

        # 记录审计日志
        WorkflowEngine._log_approval_action(flow, current_step, approver, action, comment)

    @staticmethod
    def withdraw_approval(flow_id, user_id):
        """撤回审批

        只有发起人可以撤回，且流程仍在进行中

        Args:
            flow_id: 审批流程 ID
            user_id: 发起人 ID（UUID 字符串）

        Raises:
            ValueError: 状态不允许撤回或非发起人
        """
        try:
            flow = ApprovalFlow.objects.get(id=flow_id)
        except ApprovalFlow.DoesNotExist:
            raise ValueError('审批流程不存在')

        if flow.status not in [ApprovalStatus.PENDING, ApprovalStatus.IN_PROGRESS]:
            raise ValueError('当前状态不允许撤回')

        # 验证是否为发起人
        is_creator = False
        if flow.target_type == 'BUDGET' and flow.budget:
            is_creator = (flow.budget.creator_id == str(user_id))
        elif flow.target_type == 'PURCHASE' and flow.purchase:
            is_creator = (flow.purchase.applicant_id == str(user_id))

        if not is_creator:
            raise ValueError('只有发起人可以撤回审批')

        flow.status = ApprovalStatus.CANCELLED
        flow.completed_at = timezone.now()
        flow.save(update_fields=['status', 'completed_at'])

        # 恢复目标状态
        WorkflowEngine._on_cancelled(flow)

    # ---- 回调方法 ----

    @staticmethod
    def _on_approved(flow):
        """审批通过后的回调"""
        if flow.target_type == 'BUDGET' and flow.budget:
            from apps.budget.models import BudgetStatus
            flow.budget.status = BudgetStatus.APPROVED
            flow.budget.save(update_fields=['status', 'updated_at'])

        elif flow.target_type == 'PURCHASE' and flow.purchase:
            from apps.purchase.models import PurchaseStatus
            purchase = flow.purchase
            budget = purchase.budget
            # 预算：frozen_amount -= amount, used_amount += amount
            budget.frozen_amount = max(Decimal('0'), budget.frozen_amount - purchase.total_amount)
            budget.used_amount += purchase.total_amount
            budget.save(update_fields=['frozen_amount', 'used_amount', 'updated_at'])
            purchase.status = PurchaseStatus.APPROVED
            purchase.save(update_fields=['status', 'updated_at'])

    @staticmethod
    def _on_rejected(flow):
        """审批驳回后的回调"""
        if flow.target_type == 'BUDGET' and flow.budget:
            from apps.budget.models import BudgetStatus
            flow.budget.status = BudgetStatus.REJECTED
            flow.budget.save(update_fields=['status', 'updated_at'])

        elif flow.target_type == 'PURCHASE' and flow.purchase:
            from apps.purchase.models import PurchaseStatus
            purchase = flow.purchase
            budget = purchase.budget
            # 释放冻结金额
            budget.frozen_amount = max(Decimal('0'), budget.frozen_amount - purchase.total_amount)
            budget.save(update_fields=['frozen_amount', 'updated_at'])
            purchase.status = PurchaseStatus.REJECTED
            purchase.save(update_fields=['status', 'updated_at'])

    @staticmethod
    def _on_cancelled(flow):
        """审批撤回后的回调"""
        if flow.target_type == 'BUDGET' and flow.budget:
            from apps.budget.models import BudgetStatus
            flow.budget.status = BudgetStatus.DRAFT
            flow.budget.save(update_fields=['status', 'updated_at'])

        elif flow.target_type == 'PURCHASE' and flow.purchase:
            from apps.purchase.models import PurchaseStatus
            purchase = flow.purchase
            budget = purchase.budget
            # 释放冻结金额
            budget.frozen_amount = max(Decimal('0'), budget.frozen_amount - purchase.total_amount)
            budget.save(update_fields=['frozen_amount', 'updated_at'])
            purchase.status = PurchaseStatus.DRAFT
            purchase.save(update_fields=['status', 'updated_at'])

    @staticmethod
    def _log_approval_action(flow, step, approver, action, comment):
        """记录审批操作的审计日志"""
        try:
            from apps.audit.models import AuditLog

            target_type = flow.target_type
            target_id = None
            new_value = {
                'flow_id': str(flow.id),
                'step_order': step.step_order,
                'step_name': step.step_name,
                'action': action,
                'comment': comment,
            }

            if flow.target_type == 'BUDGET' and flow.budget:
                target_id = str(flow.budget.id)
                new_value['budget_no'] = flow.budget.budget_no
            elif flow.target_type == 'PURCHASE' and flow.purchase:
                target_id = str(flow.purchase.id)
                new_value['request_no'] = flow.purchase.request_no

            AuditLog.objects.create(
                user_id=str(approver.id),
                user_name=approver.name or approver.username,
                action=f'APPROVAL_{action}',
                module='workflow',
                target_type=target_type,
                target_id=target_id,
                new_value=new_value,
            )
        except Exception:
            # 审计日志写入失败不影响主流程
            pass
