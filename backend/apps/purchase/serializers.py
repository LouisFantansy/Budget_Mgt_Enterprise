from decimal import Decimal

from rest_framework import serializers

from .models import PurchaseRequest, PurchaseItem, UrgencyLevel, PurchaseStatus


# ---------------------------------------------------------------------------
# PurchaseItem 序列化器
# ---------------------------------------------------------------------------

class PurchaseItemSerializer(serializers.ModelSerializer):
    """采购明细 - 完整信息"""

    class Meta:
        model = PurchaseItem
        fields = [
            'id', 'name', 'specification', 'quantity',
            'unit_price', 'total_amount', 'supplier',
            'delivery_date', 'remark',
        ]
        read_only_fields = ['id', 'total_amount']


class PurchaseItemCreateSerializer(serializers.ModelSerializer):
    """创建采购明细（自动计算 total_amount = unit_price * quantity）"""

    class Meta:
        model = PurchaseItem
        fields = [
            'name', 'specification', 'quantity',
            'unit_price', 'total_amount', 'supplier',
            'delivery_date', 'remark',
        ]
        extra_kwargs = {
            'total_amount': {'required': False},
        }

    def validate(self, attrs):
        unit_price = attrs.get('unit_price', Decimal('0'))
        quantity = attrs.get('quantity', 0)
        attrs['total_amount'] = unit_price * quantity
        return attrs


# ---------------------------------------------------------------------------
# PurchaseRequest 序列化器
# ---------------------------------------------------------------------------

class PurchaseRequestSerializer(serializers.ModelSerializer):
    """采购申请详情（嵌套 items、budget 信息、申请人信息）"""

    items = PurchaseItemSerializer(many=True, read_only=True)
    budget_no = serializers.CharField(source='budget.budget_no', read_only=True)
    budget_name = serializers.CharField(source='budget.name', read_only=True)
    department_name = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    urgency_level_display = serializers.CharField(source='get_urgency_level_display', read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'request_no', 'applicant_id', 'applicant_name',
            'department_id', 'department_name',
            'budget', 'budget_no', 'budget_name', 'budget_item_id',
            'total_amount', 'purpose', 'urgency_level', 'urgency_level_display',
            'status', 'status_display', 'current_step',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'request_no', 'applicant_id', 'department_id',
            'total_amount', 'status', 'current_step',
            'created_at', 'updated_at',
        ]

    def get_department_name(self, obj):
        from apps.department.models import Department
        try:
            dept = Department.objects.get(pk=obj.department_id)
            return dept.name
        except Department.DoesNotExist:
            return None

    def get_applicant_name(self, obj):
        from apps.auth_user.models import User
        try:
            user = User.objects.get(pk=obj.applicant_id)
            return user.name
        except User.DoesNotExist:
            return None


class PurchaseRequestListSerializer(serializers.ModelSerializer):
    """采购申请列表（含 budget_no、department_name、applicant_name）"""

    budget_no = serializers.CharField(source='budget.budget_no', read_only=True)
    budget_name = serializers.CharField(source='budget.name', read_only=True)
    department_name = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    urgency_level_display = serializers.CharField(source='get_urgency_level_display', read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'request_no', 'applicant_id', 'applicant_name',
            'department_id', 'department_name',
            'budget', 'budget_no', 'budget_name', 'budget_item_id',
            'total_amount', 'purpose', 'urgency_level', 'urgency_level_display',
            'status', 'status_display', 'current_step',
            'created_at', 'updated_at',
        ]

    def get_department_name(self, obj):
        from apps.department.models import Department
        try:
            dept = Department.objects.get(pk=obj.department_id)
            return dept.name
        except Department.DoesNotExist:
            return None

    def get_applicant_name(self, obj):
        from apps.auth_user.models import User
        try:
            user = User.objects.get(pk=obj.applicant_id)
            return user.name
        except User.DoesNotExist:
            return None


class PurchaseRequestCreateSerializer(serializers.ModelSerializer):
    """创建采购申请（含 items 嵌套创建）"""

    items = PurchaseItemCreateSerializer(many=True, write_only=True)
    budgetId = serializers.UUIDField(write_only=True)
    budgetItemId = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = PurchaseRequest
        fields = [
            'budgetId', 'budgetItemId', 'purpose', 'urgency_level', 'items',
        ]

    def validate_budgetId(self, value):
        from apps.budget.models import Budget, BudgetStatus
        try:
            budget = Budget.objects.get(pk=value)
        except Budget.DoesNotExist:
            raise serializers.ValidationError('关联预算不存在')
        if budget.status != BudgetStatus.APPROVED:
            raise serializers.ValidationError('只能关联已审批通过的预算')
        return value

    def validate_urgency_level(self, value):
        valid = [c[0] for c in UrgencyLevel.choices]
        if value not in valid:
            raise serializers.ValidationError(f'无效的紧急程度，可选: {valid}')
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('至少需要一条采购明细')
        return value

    def create(self, validated_data):
        from common.utils import generate_purchase_no

        items_data = validated_data.pop('items')
        budget_id = validated_data.pop('budgetId')
        budget_item_id = validated_data.pop('budgetItemId', None)

        request = self.context.get('request')

        # 自动生成 request_no
        from datetime import datetime
        year = datetime.now().year
        request_no = generate_purchase_no(year)

        # 自动计算 total_amount
        total_amount = sum(item['total_amount'] for item in items_data)

        # 设置 applicant_id / department_id
        applicant_id = str(request.user.id) if request else ''
        department_id = str(request.user.department_id) if request and request.user.department_id else ''

        purchase = PurchaseRequest.objects.create(
            request_no=request_no,
            budget_id=budget_id,
            budget_item_id=str(budget_item_id) if budget_item_id else None,
            total_amount=total_amount,
            applicant_id=applicant_id,
            department_id=department_id,
            **validated_data,
        )

        # 嵌套创建 PurchaseItem
        for item_data in items_data:
            PurchaseItem.objects.create(request=purchase, **item_data)

        return purchase


class PurchaseRequestUpdateSerializer(serializers.ModelSerializer):
    """更新采购申请（仅 DRAFT 状态可编辑）"""

    items = PurchaseItemCreateSerializer(many=True, required=False)

    class Meta:
        model = PurchaseRequest
        fields = [
            'purpose', 'urgency_level', 'budget_item_id', 'items',
        ]
        extra_kwargs = {
            'purpose': {'required': False},
            'urgency_level': {'required': False},
            'budget_item_id': {'required': False},
        }

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.status != PurchaseStatus.DRAFT:
            raise serializers.ValidationError('只有草稿状态的采购申请可以编辑')
        return attrs

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        # 更新基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 如果传了 items，先删旧的再创建新的
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseItem.objects.create(request=instance, **item_data)

            # 重新计算 total_amount
            instance.total_amount = sum(item['total_amount'] for item in items_data)

        instance.save()
        return instance
