import uuid
from django.db import models


class FieldType(models.TextChoices):
    """字段类型"""
    TEXT = 'TEXT', '文本输入'
    NUMBER = 'NUMBER', '数值输入'
    SELECT = 'SELECT', '下拉选择'
    FORMULA = 'FORMULA', '公式计算'
    DATE = 'DATE', '日期选择'
    MONTH_QTY = 'MONTH_QTY', '月度数量（1-12月）'
    MONTH_AMT = 'MONTH_AMT', '月度金额（1-12月）'


class BudgetTemplateStatus(models.TextChoices):
    """模板状态"""
    DRAFT = 'DRAFT', '草稿'
    ACTIVE = 'ACTIVE', '已启用'
    ARCHIVED = 'ARCHIVED', '已归档'


class BudgetCategory(models.TextChoices):
    """预算类别"""
    OPEX = 'OPEX', '运营支出'
    CAPEX = 'CAPEX', '资本支出'


class BudgetTemplate(models.Model):
    """预算编制表单模板"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text='模板名称，如：2026年OPEX自编预算模板')
    category = models.CharField(max_length=10, choices=BudgetCategory.choices, help_text='OPEX/CAPEX')
    # 是否为集团分摊模板
    is_group_allocation = models.BooleanField(default=False, help_text='是否为集团分摊模板')
    year = models.IntegerField(help_text='预算年度')
    version = models.IntegerField(default=1, help_text='模板版本号')
    status = models.CharField(max_length=10, choices=BudgetTemplateStatus.choices, default=BudgetTemplateStatus.DRAFT)
    # 模板说明
    description = models.TextField(null=True, blank=True)
    # 创建人（一级部门预算管理员）
    creator = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='created_templates')
    # 是否已触发编制任务
    task_triggered = models.BooleanField(default=False)
    triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budget_templates'
        ordering = ['-year', '-created_at']

    def __str__(self):
        return f"{self.name} v{self.version}"


class TemplateField(models.Model):
    """模板字段定义"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(BudgetTemplate, on_delete=models.CASCADE, related_name='fields')
    # 字段标识（英文，用于代码）
    field_code = models.CharField(max_length=50, db_index=True, help_text='字段编码，如：budget_no, dept_name')
    # 字段显示名称（中文）
    field_name = models.CharField(max_length=100, help_text='字段显示名称，如：预算编号')
    # 字段类型
    field_type = models.CharField(max_length=15, choices=FieldType.choices)
    # 排序号
    sort_order = models.IntegerField(default=0)
    # 是否可见
    is_visible = models.BooleanField(default=True)
    # 是否可编辑
    is_editable = models.BooleanField(default=True)
    # 是否必填
    is_required = models.BooleanField(default=False)
    # 默认值
    default_value = models.CharField(max_length=500, null=True, blank=True)
    # 字段宽度（像素或百分比）
    width = models.CharField(max_length=20, default='120', help_text='列宽，如：120 或 15%')
    # 公式表达式（当field_type=FORMULA时）
    formula = models.CharField(max_length=500, null=True, blank=True,
                               help_text='公式表达式，如：sum(qty_month_1~12)')
    # 是否为系统预设字段（不可删除）
    is_system = models.BooleanField(default=False)
    # 是否为扩展列（一级预算管理员可增删）
    is_extension = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'template_fields'
        ordering = ['sort_order']
        unique_together = ('template', 'field_code')


class TemplateFieldOption(models.Model):
    """下拉字段选项"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    field = models.ForeignKey(TemplateField, on_delete=models.CASCADE, related_name='options')
    option_value = models.CharField(max_length=200, help_text='选项值')
    option_label = models.CharField(max_length=200, help_text='选项显示文本')
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'template_field_options'
        ordering = ['sort_order']


class BudgetTask(models.Model):
    """预算编制任务"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(BudgetTemplate, on_delete=models.CASCADE, related_name='tasks')
    # 目标部门
    department = models.ForeignKey('department.Department', on_delete=models.CASCADE, related_name='budget_tasks')
    # 任务状态
    status = models.CharField(max_length=20, default='PENDING', help_text='PENDING/IN_PROGRESS/SUBMITTED/APPROVED')
    # 分配给的预算管理员
    assigned_to = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='assigned_tasks')
    # 任务下发时间
    assigned_at = models.DateTimeField(auto_now_add=True)
    # 实际开始编制时间
    started_at = models.DateTimeField(null=True, blank=True)
    # 提交时间
    submitted_at = models.DateTimeField(null=True, blank=True)
    # 审批通过时间
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budget_tasks'
        ordering = ['-created_at']
