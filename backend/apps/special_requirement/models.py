import uuid
from django.db import models


class RequirementTemplate(models.Model):
    """
    专题需求收集表模板
    一级部门预算管理员可自定义表单模板
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text='模板名称，如：人力外包需求收集表')
    # 模板类型
    template_type = models.CharField(max_length=50, help_text='模板类型，如：OUTSOURCING/PROCUREMENT/OTHER')
    # 模板说明
    description = models.TextField(null=True, blank=True)
    # 创建人
    creator = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='created_requirement_templates')
    # 是否启用
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'requirement_templates'
        ordering = ['-created_at']


class RequirementTemplateField(models.Model):
    """专题收集表字段定义"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(RequirementTemplate, on_delete=models.CASCADE, related_name='fields')
    field_code = models.CharField(max_length=50, help_text='字段编码')
    field_name = models.CharField(max_length=100, help_text='字段显示名称')
    field_type = models.CharField(max_length=20, help_text='TEXT/NUMBER/SELECT/DATE/BOOLEAN')
    # 是否为隐藏字段（保密字段）
    is_hidden = models.BooleanField(default=False, help_text='是否为隐藏字段（仅一级预算管理员可见）')
    # 是否为公开字段
    is_public = models.BooleanField(default=True, help_text='是否对二级部门预算管理员可见')
    # 是否必填
    is_required = models.BooleanField(default=False)
    # 默认值
    default_value = models.CharField(max_length=500, null=True, blank=True)
    # 排序
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'requirement_template_fields'
        ordering = ['sort_order']


class RequirementTemplateOption(models.Model):
    """专题收集表下拉选项"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    field = models.ForeignKey(RequirementTemplateField, on_delete=models.CASCADE, related_name='options')
    option_value = models.CharField(max_length=200)
    option_label = models.CharField(max_length=200)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'requirement_template_options'
        ordering = ['sort_order']


class SpecialRequirement(models.Model):
    """
    专题需求收集表实例
    二级部门预算管理员填写的数据
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 关联模板
    template = models.ForeignKey(RequirementTemplate, on_delete=models.PROTECT, related_name='requirements')
    # 填写部门
    department = models.ForeignKey('department.Department', on_delete=models.CASCADE, related_name='special_requirements')
    # 预算年度
    year = models.IntegerField()
    # 表单数据（JSON格式）
    form_data = models.JSONField(default=dict, help_text='表单填写的数据')
    # 关联的预算（一级部门确认后自动关联）
    linked_budget = models.ForeignKey('budget.Budget', on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='special_requirements')
    # 状态
    status = models.CharField(max_length=20, default='DRAFT', help_text='DRAFT/SUBMITTED/APPROVED')
    # 填写人
    filled_by = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='filled_requirements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'special_requirements'
        ordering = ['-created_at']
