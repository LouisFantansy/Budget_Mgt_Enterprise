"""通知服务 - 内部使用，不暴露为 API"""

from .models import Notification, NotificationType


class NotificationService:
    """通知服务类"""

    @staticmethod
    def create_notification(user_id, notification_type, title, content, link=None):
        """
        创建通知

        Args:
            user_id: 用户ID
            notification_type: 通知类型 (NotificationType)
            title: 标题
            content: 内容
            link: 跳转链接（可选）

        Returns:
            Notification: 创建的通知对象
        """
        return Notification.objects.create(
            user_id=user_id,
            type=notification_type,
            title=title,
            content=content,
            link=link,
            channels=['in_app']
        )

    @staticmethod
    def notify_approval_pending(approver_ids, target_type, target_name):
        """
        通知审批人有待审批事项

        Args:
            approver_ids: 审批人ID列表
            target_type: 审批对象类型（预算/采购）
            target_name: 审批对象名称
        """
        type_display = '预算' if target_type == 'BUDGET' else '采购申请'
        title = f'待审批{type_display}'
        content = f'您有一条"{target_name}"{type_display}待审批，请及时处理。'
        link = f'/approvals'

        for user_id in approver_ids:
            Notification.objects.create(
                user_id=user_id,
                type=NotificationType.APPROVAL_PENDING,
                title=title,
                content=content,
                link=link,
                channels=['in_app']
            )

    @staticmethod
    def notify_approval_result(user_id, target_type, target_name, result):
        """
        通知发起人审批结果

        Args:
            user_id: 发起人用户ID
            target_type: 审批对象类型（预算/采购）
            target_name: 审批对象名称
            result: 审批结果（APPROVED/REJECTED）
        """
        type_display = '预算' if target_type == 'BUDGET' else '采购申请'
        result_display = '已通过' if result == 'APPROVED' else '已驳回'

        title = f'{type_display}审批{result_display}'
        content = f'您的"{target_name}"{type_display}审批{result_display}。'
        link = f'/approvals/my'

        return Notification.objects.create(
            user_id=user_id,
            type=NotificationType.APPROVAL_RESULT,
            title=title,
            content=content,
            link=link,
            channels=['in_app']
        )

    @staticmethod
    def notify_budget_warning(user_id, budget_no, usage_rate):
        """
        预算预警通知（使用率>80%）

        Args:
            user_id: 用户ID
            budget_no: 预算编号
            usage_rate: 使用率（百分比）
        """
        title = '预算使用预警'
        content = f'预算"{budget_no}"使用率已达 {usage_rate:.1f}%，请留意预算余额。'
        link = f'/budgets'

        return Notification.objects.create(
            user_id=user_id,
            type=NotificationType.BUDGET_WARNING,
            title=title,
            content=content,
            link=link,
            channels=['in_app']
        )

    @staticmethod
    def notify_budget_overrun(user_id, budget_no, exceeded_amount):
        """
        预算超支通知

        Args:
            user_id: 用户ID
            budget_no: 预算编号
            exceeded_amount: 超支金额
        """
        title = '预算超支警告'
        content = f'预算"{budget_no}"已超支 {exceeded_amount:.2f} 元，请立即处理。'
        link = f'/budgets'

        return Notification.objects.create(
            user_id=user_id,
            type=NotificationType.BUDGET_OVERRUN,
            title=title,
            content=content,
            link=link,
            channels=['in_app']
        )

    @staticmethod
    def notify_system(user_id, title, content, link=None):
        """
        系统通知

        Args:
            user_id: 用户ID
            title: 标题
            content: 内容
            link: 跳转链接（可选）
        """
        return Notification.objects.create(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title=title,
            content=content,
            link=link,
            channels=['in_app']
        )

    @staticmethod
    def notify_report_ready(user_id, report_name, download_link=None):
        """
        报表就绪通知

        Args:
            user_id: 用户ID
            report_name: 报表名称
            download_link: 下载链接（可选）
        """
        title = '报表生成完成'
        content = f'您的"{report_name}"报表已生成完毕，可以下载查看。'

        return Notification.objects.create(
            user_id=user_id,
            type=NotificationType.REPORT_READY,
            title=title,
            content=content,
            link=download_link,
            channels=['in_app']
        )
