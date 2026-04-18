from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from common.pagination import StandardPagination
from common.utils import success_response, error_response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(ViewSet):
    """通知管理"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/notifications/ - 当前用户的通知列表

        查询参数:
            - type: 通知类型筛选
            - is_read: 是否已读 (true/false)
            - page: 页码
            - page_size: 每页数量
        """
        user_id = str(request.user.id)
        queryset = Notification.objects.filter(user_id=user_id)

        # 类型筛选
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)

        # 已读状态筛选
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)

        # 分页
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['put'])
    def read(self, request, pk=None):
        """
        PUT /api/notifications/{id}/read/ - 标记通知为已读
        """
        user_id = str(request.user.id)

        try:
            notification = Notification.objects.get(id=pk, user_id=user_id)
        except Notification.DoesNotExist:
            return error_response('通知不存在', status_code=404)

        notification.is_read = True
        notification.save(update_fields=['is_read'])

        return success_response({'id': str(notification.id), 'is_read': True})

    @action(detail=False, methods=['put'], url_path='read-all')
    def read_all(self, request):
        """
        PUT /api/notifications/read-all/ - 标记所有通知为已读
        """
        user_id = str(request.user.id)
        count = Notification.objects.filter(
            user_id=user_id, is_read=False
        ).update(is_read=True)

        return success_response({'marked_count': count})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """
        GET /api/notifications/unread-count/ - 获取未读通知数量

        返回:
            - total: 未读总数
            - by_type: 按类型分组的未读数量
        """
        user_id = str(request.user.id)

        # 总未读数
        total = Notification.objects.filter(
            user_id=user_id, is_read=False
        ).count()

        # 按类型统计
        from .models import NotificationType
        by_type = {}
        for type_code, type_name in NotificationType.choices:
            count = Notification.objects.filter(
                user_id=user_id, is_read=False, type=type_code
            ).count()
            if count > 0:
                by_type[type_code] = {
                    'name': type_name,
                    'count': count
                }

        return success_response({
            'total': total,
            'by_type': by_type
        })
