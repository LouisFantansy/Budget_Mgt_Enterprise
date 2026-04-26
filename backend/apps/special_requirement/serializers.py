from rest_framework import serializers
from .models import RequirementTemplate, RequirementTemplateField, RequirementTemplateOption, SpecialRequirement


class RequirementTemplateOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequirementTemplateOption
        fields = ['id', 'option_value', 'option_label', 'sort_order']


class RequirementTemplateFieldSerializer(serializers.ModelSerializer):
    options = RequirementTemplateOptionSerializer(many=True, read_only=True)

    class Meta:
        model = RequirementTemplateField
        fields = [
            'id', 'field_code', 'field_name', 'field_type',
            'is_hidden', 'is_public', 'is_required',
            'default_value', 'sort_order', 'options'
        ]


class RequirementTemplateListSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    field_count = serializers.IntegerField(source='fields.count', read_only=True)

    class Meta:
        model = RequirementTemplate
        fields = ['id', 'name', 'template_type', 'description', 'is_active', 'creator_name', 'field_count', 'created_at']


class RequirementTemplateDetailSerializer(serializers.ModelSerializer):
    fields = RequirementTemplateFieldSerializer(many=True, read_only=True)
    creator_name = serializers.CharField(source='creator.name', read_only=True)

    class Meta:
        model = RequirementTemplate
        fields = [
            'id', 'name', 'template_type', 'description',
            'is_active', 'creator_name', 'fields', 'created_at', 'updated_at'
        ]


class RequirementTemplateCreateSerializer(serializers.ModelSerializer):
    fields = RequirementTemplateFieldSerializer(many=True, required=False)

    class Meta:
        model = RequirementTemplate
        fields = ['name', 'template_type', 'description', 'fields']

    def create(self, validated_data):
        fields_data = validated_data.pop('fields', [])
        template = RequirementTemplate.objects.create(**validated_data)
        for field_data in fields_data:
            options_data = field_data.pop('options', [])
            field = RequirementTemplateField.objects.create(template=template, **field_data)
            for option_data in options_data:
                RequirementTemplateOption.objects.create(field=field, **option_data)
        return template


class SpecialRequirementListSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    filled_by_name = serializers.CharField(source='filled_by.name', read_only=True)

    class Meta:
        model = SpecialRequirement
        fields = [
            'id', 'template_name', 'department_name', 'year',
            'status', 'filled_by_name', 'created_at', 'updated_at'
        ]


class SpecialRequirementDetailSerializer(serializers.ModelSerializer):
    template = RequirementTemplateDetailSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    filled_by_name = serializers.CharField(source='filled_by.name', read_only=True)

    class Meta:
        model = SpecialRequirement
        fields = [
            'id', 'template', 'department_name', 'year',
            'form_data', 'status', 'filled_by_name',
            'linked_budget', 'created_at', 'updated_at'
        ]


class SpecialRequirementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpecialRequirement
        fields = ['template', 'department', 'year', 'form_data']


class SpecialRequirementSubmitSerializer(serializers.Serializer):
    """提交专题需求收集表"""
    pass


class SpecialRequirementApproveSerializer(serializers.Serializer):
    """审批专题需求收集表"""
    action = serializers.ChoiceField(choices=[('APPROVE', '通过'), ('REJECT', '驳回')])
    comment = serializers.CharField(required=False, allow_blank=True)
