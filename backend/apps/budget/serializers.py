from decimal import Decimal

from rest_framework import serializers

from .models import Budget, BudgetItem, BudgetAdjustment, BudgetType, BudgetStatus


# ---------------------------------------------------------------------------
# BudgetItem 序列化器
# ---------------------------------------------------------------------------

class BudgetItemSerializer(serializers.ModelSerializer):
    """预算明细 - 完整信息"""

    class Meta:
        model = BudgetItem
        fields = [
            'id', 'name', 'category', 'specification', 'function',
            'unit_price', 'quantity', 'total_amount',
            'used_amount', 'frozen_amount',
            'payment_entity', 'group', 'account_code',
            'monthly_plan', 'project', 'purpose', 'supplier',
            'delivery_date', 'sort_order',
        ]
        read_only_fields = ['id', 'used_amount', 'frozen_amount']


class BudgetItemCreateSerializer(serializers.ModelSerializer):
    """创建/更新预算明细（嵌套在预算创建/更新中使用）"""

    class Meta:
        model = BudgetItem
        fields = [
            'name', 'category', 'specification', 'function',
            'unit_price', 'quantity', 'total_amount',
            'payment_entity', 'group', 'account_code',
            'monthly_plan', 'project', 'purpose', 'supplier',
            'delivery_date', 'sort_order',
        ]

    def validate(self, attrs):
        # 自动计算 total_amount = unit_price * quantity
        unit_price = attrs.get('unit_price', Decimal('0'))
        quantity = attrs.get('quantity', 0)
        attrs['total_amount'] = unit_price * quantity
        return attrs


# ---------------------------------------------------------------------------
# Budget 序列化器
# ---------------------------------------------------------------------------

class BudgetSerializer(serializers.ModelSerializer):
    """预算完整信息（含 items, department 信息）"""

    items = BudgetItemSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    available_amount = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'budget_no', 'name', 'department', 'department_name',
            'type', 'type_display', 'year', 'version', 'parent_id',
            'total_amount', 'used_amount', 'frozen_amount', 'available_amount',
            'payment_entity', 'group', 'account_code',
            'status', 'status_display', 'creator_id', 'remark',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'budget_no', 'used_amount', 'frozen_amount',
            'version', 'parent_id', 'creator_id', 'created_at', 'updated_at',
        ]

    def get_available_amount(self, obj):
        return obj.total_amount - obj.used_amount - obj.frozen_amount


class BudgetListSerializer(serializers.ModelSerializer):
    """预算列表简要信息（不含 items 详情）"""

    department_name = serializers.CharField(source='department.name', read_only=True)
    available_amount = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'budget_no', 'name', 'department', 'department_name',
            'type', 'type_display', 'year', 'version',
            'total_amount', 'used_amount', 'frozen_amount', 'available_amount',
            'status', 'status_display', 'creator_id', 'created_at', 'updated_at',
        ]

    def get_available_amount(self, obj):
        return obj.total_amount - obj.used_amount - obj.frozen_amount


class BudgetCreateSerializer(serializers.ModelSerializer):
    """创建预算（含 items 嵌套创建）"""

    items = BudgetItemCreateSerializer(many=True, write_only=True)
    departmentId = serializers.UUIDField(write_only=True)

    class Meta:
        model = Budget
        fields = [
            'name', 'departmentId', 'type', 'year',
            'payment_entity', 'group', 'account_code', 'remark',
            'items',
        ]

    def validate_departmentId(self, value):
        from apps.department.models import Department
        try:
            Department.objects.get(pk=value)
        except Department.DoesNotExist:
            raise serializers.ValidationError('部门不存在')
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('至少需要一条预算明细')
        return value

    def validate_type(self, value):
        valid = [c[0] for c in BudgetType.choices]
        if value not in valid:
            raise serializers.ValidationError(f'无效的预算类型，可选: {valid}')
        return value

    def create(self, validated_data):
        from common.utils import generate_budget_no
        from apps.department.models import Department

        items_data = validated_data.pop('items')
        department_id = validated_data.pop('departmentId')
        department = Department.objects.get(pk=department_id)

        # 自动生成 budget_no
        year = validated_data['year']
        budget_no = generate_budget_no(year)

        # 自动计算 total_amount
        total_amount = sum(item['total_amount'] for item in items_data)

        # 设置 creator_id
        request = self.context.get('request')
        creator_id = str(request.user.id) if request else ''

        budget = Budget.objects.create(
            budget_no=budget_no,
            total_amount=total_amount,
            creator_id=creator_id,
            department=department,
            **validated_data,
        )

        # 嵌套创建 BudgetItem
        for idx, item_data in enumerate(items_data):
            BudgetItem.objects.create(budget=budget, sort_order=idx, **item_data)

        return budget


class BudgetUpdateSerializer(serializers.ModelSerializer):
    """更新预算（仅 DRAFT 状态可编辑）"""

    items = BudgetItemCreateSerializer(many=True, required=False)

    class Meta:
        model = Budget
        fields = [
            'name', 'type', 'year', 'payment_entity',
            'group', 'account_code', 'remark', 'items',
        ]
        extra_kwargs = {
            'name': {'required': False},
            'type': {'required': False},
            'year': {'required': False},
        }

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.status != BudgetStatus.DRAFT:
            raise serializers.ValidationError('只有草稿状态的预算可以编辑')
        return attrs

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        # 更新预算基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 如果传了 items，先删旧的再创建新的
        if items_data is not None:
            instance.items.all().delete()
            for idx, item_data in enumerate(items_data):
                BudgetItem.objects.create(budget=instance, sort_order=idx, **item_data)

            # 重新计算 total_amount
            instance.total_amount = sum(item['total_amount'] for item in items_data)

        instance.save()
        return instance


# ---------------------------------------------------------------------------
# BudgetAdjustment 序列化器
# ---------------------------------------------------------------------------

class BudgetAdjustSerializer(serializers.Serializer):
    """预算调整请求"""

    adjusted_amount = serializers.DecimalField(max_digits=18, decimal_places=2)
    reason = serializers.CharField()
    items = serializers.ListField(required=False, allow_null=True)

    def validate_adjusted_amount(self, value):
        if value < 0:
            raise serializers.ValidationError('调整金额不能为负数')
        return value


class BudgetAdjustmentSerializer(serializers.ModelSerializer):
    """调整记录"""

    budget_no = serializers.CharField(source='budget.budget_no', read_only=True)

    class Meta:
        model = BudgetAdjustment
        fields = [
            'id', 'budget', 'budget_no', 'adjust_no',
            'original_amount', 'adjusted_amount',
            'reason', 'items', 'status', 'creator_id', 'created_at',
        ]
        read_only_fields = ['id', 'adjust_no', 'creator_id', 'created_at']
