from rest_framework import serializers
from .models import Budget, BudgetItem, BudgetChangeLog, BudgetVersionLog, BudgetDiff, PurchaseHistory


class BudgetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetItem
        fields = [
            'id', 'budget', 'template', 'item_no', 'field_data', 'computed_fields',
            'internal_comment', 'is_deleted',
            'created_by', 'created_at', 'updated_at'
        ]


class BudgetItemListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = BudgetItem
        fields = [
            'id', 'item_no', 'field_data', 'computed_fields',
            'internal_comment', 'is_deleted',
            'created_by_name', 'created_at'
        ]


class BudgetSerializer(serializers.ModelSerializer):
    items = BudgetItemListSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.name', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'budget_no', 'year', 'category', 'source',
            'department', 'department_name',
            'template', 'template_name',
            'version_major', 'version_minor', 'version_label',
            'parent_version', 'branched_from', 'is_branch', 'branch_name',
            'status', 'approved_at', 'approved_by', 'approved_by_name',
            'submitted_at', 'submitted_by', 'submitted_by_name',
            'total_amount', 'total_quantity',
            'remark', 'items',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'version_major', 'version_minor', 'version_label',
            'total_amount', 'total_quantity'
        ]


class BudgetListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'budget_no', 'year', 'category', 'source',
            'department', 'department_name',
            'version_label', 'status',
            'total_amount', 'total_quantity',
            'item_count', 'created_at'
        ]


class BudgetCreateSerializer(serializers.ModelSerializer):
    """创建预算（从模板生成）"""
    class Meta:
        model = Budget
        fields = [
            'year', 'category', 'source', 'department',
            'template', 'remark'
        ]


class BudgetChangeLogSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)

    class Meta:
        model = BudgetChangeLog
        fields = [
            'id', 'change_type', 'field_code', 'field_name',
            'old_value', 'new_value', 'reason',
            'operator', 'operator_name', 'operator_role',
            'created_at'
        ]


class BudgetVersionLogSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)

    class Meta:
        model = BudgetVersionLog
        fields = [
            'id', 'action', 'description',
            'from_version', 'to_version',
            'operator', 'operator_name', 'created_at'
        ]


class BudgetDiffSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetDiff
        fields = [
            'id', 'added_count', 'deleted_count', 'modified_count',
            'diff_details', 'generated_at'
        ]


class PurchaseHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseHistory
        fields = [
            'id', 'description', 'specification',
            'historical_price', 'suggested_price',
            'supplier', 'purchase_date',
            'usage_count', 'created_at'
        ]


class BudgetSubmitSerializer(serializers.Serializer):
    """提交预算审批"""
    remark = serializers.CharField(required=False, allow_blank=True)


class BudgetApproveSerializer(serializers.Serializer):
    """审批预算"""
    action = serializers.ChoiceField(choices=['APPROVE', 'REJECT'])
    comment = serializers.CharField(required=False, allow_blank=True)


class BudgetItemBatchUpdateSerializer(serializers.Serializer):
    """批量更新预算条目"""
    item_ids = serializers.ListField(child=serializers.UUIDField())
    field_updates = serializers.DictField(
        child=serializers.CharField(),
        help_text='要更新的字段和值，如 {"unit_price": "100.00"}'
    )
