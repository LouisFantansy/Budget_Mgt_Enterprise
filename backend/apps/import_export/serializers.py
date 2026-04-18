from rest_framework import serializers

from .models import PurchaseOrder, Settlement, DataMapping, MatchStatus, Attachment


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """采购订单序列化器"""

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'order_no', 'supplier', 'amount', 'order_date',
            'status', 'budget_no', 'mapping_id', 'import_batch_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SettlementSerializer(serializers.ModelSerializer):
    """结算单序列化器"""

    class Meta:
        model = Settlement
        fields = [
            'id', 'settlement_no', 'invoice_no', 'amount', 'settle_date',
            'supplier', 'budget_no', 'mapping_id', 'import_batch_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class DataMappingSerializer(serializers.ModelSerializer):
    """三单匹配序列化器"""

    match_status_display = serializers.CharField(source='get_match_status_display', read_only=True)

    class Meta:
        model = DataMapping
        fields = [
            'id', 'budget_no', 'purchase_order_no', 'settlement_no',
            'match_status', 'match_status_display', 'amount_diff',
            'verified_at', 'verified_by', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AttachmentSerializer(serializers.ModelSerializer):
    """附件序列化器"""

    class Meta:
        model = Attachment
        fields = [
            'id', 'file_name', 'file_size', 'mime_type', 'storage_path',
            'uploader_id', 'target_type', 'target_id', 'purchase_request', 'created_at',
        ]
        read_only_fields = ['id', 'uploader_id', 'created_at']
