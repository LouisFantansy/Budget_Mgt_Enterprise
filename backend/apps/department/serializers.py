from rest_framework import serializers

from .models import Department, DepartmentStatus


class DepartmentSerializer(serializers.ModelSerializer):
    """部门基本信息"""

    parent_name = serializers.CharField(source='parent.name', read_only=True, default=None)

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'level', 'parent', 'parent_name',
            'manager_id', 'primary_budget_admin_id', 'sort_order', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DepartmentTreeSerializer(serializers.ModelSerializer):
    """部门树形结构（递归序列化，含 children）"""

    children = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'level', 'parent',
            'manager_id', 'primary_budget_admin_id', 'sort_order', 'status', 'children',
        ]

    def get_children(self, obj):
        children = obj.children.filter(status='ACTIVE').order_by('sort_order', 'code')
        return DepartmentTreeSerializer(children, many=True).data


class DepartmentCreateSerializer(serializers.ModelSerializer):
    """创建部门"""

    class Meta:
        model = Department
        fields = ['name', 'code', 'level', 'parent', 'manager_id', 'primary_budget_admin_id', 'sort_order']

    def validate_code(self, value):
        if Department.objects.filter(code=value).exists():
            raise serializers.ValidationError('部门编码已存在')
        return value

    def validate_parent(self, value):
        if value and value.status != DepartmentStatus.ACTIVE:
            raise serializers.ValidationError('父级部门未启用')
        return value

    def validate(self, attrs):
        level = attrs.get('level', 1)
        parent = attrs.get('parent')
        # 如果有父部门，level 应为父部门 level + 1
        if parent and level != parent.level + 1:
            attrs['level'] = parent.level + 1
        # 如果没有父部门，level 应为 1
        if not parent and level != 1:
            attrs['level'] = 1
        return attrs


class DepartmentUpdateSerializer(serializers.ModelSerializer):
    """更新部门"""

    class Meta:
        model = Department
        fields = ['name', 'code', 'level', 'parent', 'manager_id', 'primary_budget_admin_id', 'sort_order', 'status']
        extra_kwargs = {
            'name': {'required': False},
            'code': {'required': False},
            'level': {'required': False},
            'parent': {'required': False, 'allow_null': True},
            'sort_order': {'required': False},
            'status': {'required': False},
        }

    def validate_code(self, value):
        instance = self.instance
        if Department.objects.filter(code=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError('部门编码已存在')
        return value
