from rest_framework import serializers
from .models import BudgetTemplate, TemplateField, TemplateFieldOption, BudgetTask


class TemplateFieldOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateFieldOption
        fields = ['id', 'option_value', 'option_label', 'sort_order']


class TemplateFieldSerializer(serializers.ModelSerializer):
    options = TemplateFieldOptionSerializer(many=True, read_only=True)

    class Meta:
        model = TemplateField
        fields = [
            'id', 'field_code', 'field_name', 'field_type',
            'is_visible', 'is_editable', 'is_required',
            'default_value', 'width', 'formula',
            'is_system', 'is_extension', 'sort_order', 'options'
        ]


class BudgetTemplateSerializer(serializers.ModelSerializer):
    fields = TemplateFieldSerializer(many=True, read_only=True)
    creator_name = serializers.CharField(source='creator.name', read_only=True)

    class Meta:
        model = BudgetTemplate
        fields = [
            'id', 'name', 'category', 'is_group_allocation',
            'year', 'version', 'status', 'description',
            'creator', 'creator_name', 'task_triggered', 'triggered_at',
            'fields', 'created_at', 'updated_at'
        ]
        read_only_fields = ['version', 'task_triggered', 'triggered_at']


class BudgetTemplateListSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    field_count = serializers.IntegerField(source='fields.count', read_only=True)

    class Meta:
        model = BudgetTemplate
        fields = [
            'id', 'name', 'category', 'is_group_allocation',
            'year', 'version', 'status', 'creator_name',
            'field_count', 'task_triggered', 'created_at'
        ]


class BudgetTaskSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = BudgetTask
        fields = [
            'id', 'template', 'template_name', 'department', 'department_name',
            'status', 'assigned_to', 'assigned_to_name',
            'assigned_at', 'started_at', 'submitted_at', 'approved_at'
        ]
