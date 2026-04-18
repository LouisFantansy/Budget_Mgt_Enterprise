from rest_framework import serializers

from .models import Notification, NotificationType


class NotificationSerializer(serializers.ModelSerializer):
    """通知信息序列化器"""

    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'content',
            'link', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """通知创建序列化器（内部使用）"""

    class Meta:
        model = Notification
        fields = [
            'user_id', 'type', 'title', 'content', 'link', 'channels',
        ]

    def validate_type(self, value):
        valid_types = [c[0] for c in NotificationType.choices]
        if value not in valid_types:
            raise serializers.ValidationError(f'无效的通知类型，可选: {valid_types}')
        return value
