import uuid
from django.db import models


class BudgetType(models.TextChoices):
    """预算类型"""
    OPEX = 'OPEX', '运营支出'
    CAPEX = 'CAPEX', '资本支出'


class BudgetSource(models.TextChoices):
    """预算来源"""
    SELF_COMPILED = 'SELF_COMPILED', '自编'
    GROUP_ALLOCATION = 'GROUP_ALLOCATION', '集团分摊'
    SS_PUBLIC = 'SS_PUBLIC', 'SS Public'


class BudgetStatus(models.TextChoices):
    """预算状态"""
    DRAFT = 'DRAFT', '草稿'
    PENDING = 'PENDING', '待审批'
    APPROVED = 'APPROVED', '审批通过'
    REJECTED = 'REJECTED', '审批驳回'


class BudgetItem(models.Model):
    """
    预算条目（支持动态字段）
    根据预算模板动态生成字段，数据以JSON格式存储
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 所属预算
    budget = models.ForeignKey('Budget', on_delete=models.CASCADE, related_name='items')
    # 模板（用于确定字段结构）
    template = models.ForeignKey('budget_template.BudgetTemplate', on_delete=models.PROTECT, related_name='budget_items')
    # 条目编号（行号）
    item_no = models.IntegerField(default=0, help_text='条目序号')
    # 动态字段数据（核心：所有字段值存储在这里）
    field_data = models.JSONField(default=dict, help_text='动态字段数据，key为field_code')
    # 计算字段缓存（公式计算结果）
    computed_fields = models.JSONField(default=dict, help_text='公式计算结果缓存')
    # 内部评论（二级部门预算管理员使用，不进入审批）
    internal_comment = models.TextField(null=True, blank=True, help_text='内部管理评论，不带入审批')
    # 是否删除（软删除）
    is_deleted = models.BooleanField(default=False)
    # 创建信息
    created_by = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='created_budget_items')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budget_items'
        ordering = ['item_no', 'created_at']

    def get_field_value(self, field_code):
        """获取指定字段的值"""
        return self.field_data.get(field_code)

    def set_field_value(self, field_code, value):
        """设置指定字段的值"""
        self.field_data[field_code] = value


class Budget(models.Model):
    """
    预算主表（Git模式版本管理）
    支持：二级部门自编、集团分摊、SS Public
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 预算编号（一级预算管理员赋予的最终编号）
    budget_no = models.CharField(max_length=50, null=True, blank=True, db_index=True, help_text='最终预算编号')
    # 预算年度
    year = models.IntegerField(db_index=True, help_text='预算年度')
    # 预算类别
    category = models.CharField(max_length=10, choices=BudgetType.choices, help_text='OPEX/CAPEX')
    # 预算来源
    source = models.CharField(max_length=20, choices=BudgetSource.choices, default=BudgetSource.SELF_COMPILED,
                              help_text='自编/集团分摊/SS Public')
    # 所属部门
    department = models.ForeignKey('department.Department', on_delete=models.PROTECT, related_name='budgets')
    # 关联模板
    template = models.ForeignKey('budget_template.BudgetTemplate', on_delete=models.PROTECT, related_name='budgets')
    # 关联任务
    task = models.ForeignKey('budget_template.BudgetTask', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='budget_versions')

    # ========== Git模式版本管理 ==========
    # 版本号：v{major}.{minor}
    version_major = models.IntegerField(default=1, help_text='主版本号（审批通过后+1）')
    version_minor = models.IntegerField(default=0, help_text='次版本号（每次修订+1）')
    # 版本标签
    version_label = models.CharField(max_length=20, default='v1.0', help_text='版本标签，如 v1.0')
    # 父版本（上一个审批通过的版本）
    parent_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='child_versions', help_text='父版本')
    # 分支来源（用于记录从哪个版本分支出来）
    branched_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='branches', help_text='分支来源版本')
    # 是否为分支
    is_branch = models.BooleanField(default=False)
    # 分支名称
    branch_name = models.CharField(max_length=100, null=True, blank=True)

    # ========== 状态管理 ==========
    status = models.CharField(max_length=15, choices=BudgetStatus.choices, default=BudgetStatus.DRAFT, db_index=True)
    # 审批通过时间
    approved_at = models.DateTimeField(null=True, blank=True)
    # 审批人
    approved_by = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='approved_budgets')
    # 提交时间
    submitted_at = models.DateTimeField(null=True, blank=True)
    # 提交人
    submitted_by = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='submitted_budgets')

    # ========== 金额汇总（冗余存储，提高查询性能） ==========
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0, help_text='预算总额')
    total_quantity = models.DecimalField(max_digits=18, decimal_places=2, default=0, help_text='总数量')

    # ========== 元数据 ==========
    # 编制说明
    remark = models.TextField(null=True, blank=True)
    # 创建人
    created_by = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='created_budgets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets'
        ordering = ['-year', '-version_major', '-version_minor']
        unique_together = [
            # 同一部门同一年度同一类别同一版本只能有一个审批通过的预算
            ['department', 'year', 'category', 'source', 'version_major', 'version_minor'],
        ]

    def __str__(self):
        return f"{self.department.name} {self.year} {self.category} {self.version_label}"

    @property
    def version_string(self):
        return f"v{self.version_major}.{self.version_minor}"

    def increment_minor(self):
        """增加次版本号"""
        self.version_minor += 1
        self.version_label = self.version_string

    def increment_major(self):
        """增加主版本号（审批通过时）"""
        self.version_major += 1
        self.version_minor = 0
        self.version_label = self.version_string

    def get_previous_approved_version(self):
        """获取上一个审批通过的版本"""
        return Budget.objects.filter(
            department=self.department,
            year=self.year,
            category=self.category,
            source=self.source,
            status=BudgetStatus.APPROVED
        ).exclude(id=self.id).order_by('-version_major', '-version_minor').first()


class BudgetVersionLog(models.Model):
    """
    预算版本操作日志（记录版本演进历史）
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='version_logs')
    # 操作类型
    action = models.CharField(max_length=20, help_text='CREATE/EDIT/SUBMIT/APPROVE/REJECT/BRANCH/MERGE')
    # 操作人
    operator = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True)
    # 操作说明
    description = models.TextField(null=True, blank=True)
    # 来源版本
    from_version = models.CharField(max_length=20, null=True, blank=True)
    # 目标版本
    to_version = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'budget_version_logs'
        ordering = ['-created_at']


class BudgetChangeLog(models.Model):
    """
    预算修改留痕记录
    记录每一次修改的详细信息（谁、何时、改了什么、从什么改成什么）
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 关联预算
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='change_logs')
    # 关联条目（如果是条目级别的修改）
    budget_item = models.ForeignKey(BudgetItem, on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='change_logs')
    # 修改人
    operator = models.ForeignKey('auth_user.User', on_delete=models.SET_NULL, null=True, related_name='budget_changes')
    # 修改人角色
    operator_role = models.CharField(max_length=50, null=True, blank=True, help_text='修改时的角色')
    # 修改类型
    change_type = models.CharField(max_length=20, help_text='CREATE/UPDATE/DELETE')
    # 修改的字段
    field_code = models.CharField(max_length=50, null=True, blank=True, help_text='修改的字段编码')
    field_name = models.CharField(max_length=100, null=True, blank=True, help_text='修改的字段名称')
    # 修改前值
    old_value = models.TextField(null=True, blank=True)
    # 修改后值
    new_value = models.TextField(null=True, blank=True)
    # 修改原因
    reason = models.TextField(null=True, blank=True, help_text='修改原因，如：统一价格、规范描述、赋予编号')
    # IP地址
    ip_address = models.CharField(max_length=50, null=True, blank=True)
    # 用户代理
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'budget_change_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['budget', '-created_at']),
            models.Index(fields=['operator', '-created_at']),
        ]


class BudgetDiff(models.Model):
    """
    预算版本差异记录
    存储两个版本之间的差异，用于送审时自动展示
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 当前版本
    current_budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='current_diffs')
    # 对比版本（上一个审批通过的版本）
    compared_budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='compared_diffs')
    # 差异统计
    added_count = models.IntegerField(default=0, help_text='新增条目数')
    deleted_count = models.IntegerField(default=0, help_text='删除条目数')
    modified_count = models.IntegerField(default=0, help_text='修改条目数')
    # 差异详情（JSON格式）
    diff_details = models.JSONField(default=dict, help_text='差异详情')
    # 生成时间
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'budget_diffs'
        ordering = ['-generated_at']


class PurchaseHistory(models.Model):
    """
    历史采购记录
    用于智能补全和推荐单价
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 采购描述（用于模糊匹配）
    description = models.CharField(max_length=500, db_index=True, help_text='采购描述/名称')
    # 规格型号
    specification = models.CharField(max_length=500, null=True, blank=True)
    # 历史成交价
    historical_price = models.DecimalField(max_digits=18, decimal_places=2, help_text='历史成交价')
    # 推荐单价（历史成交价 * 1.2）
    suggested_price = models.DecimalField(max_digits=18, decimal_places=2, help_text='推荐单价')
    # 供应商
    supplier = models.CharField(max_length=200, null=True, blank=True)
    # 采购日期
    purchase_date = models.DateField(null=True, blank=True)
    # 所属部门
    department = models.ForeignKey('department.Department', on_delete=models.SET_NULL, null=True, blank=True)
    # 数据来源：历史导入/手动录入/预算归档
    source = models.CharField(max_length=50, default='MANUAL')
    # 使用次数（用于排序）
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_history'
        ordering = ['-usage_count', '-updated_at']
        indexes = [
            models.Index(fields=['description']),
            models.Index(fields=['department', 'description']),
        ]

    def calculate_suggested_price(self):
        """计算推荐单价"""
        if self.historical_price:
            self.suggested_price = self.historical_price * 1.2
        return self.suggested_price
