#!/usr/bin/env python
"""
数据质量验证命令
验证生成的测试数据是否符合预期
"""
import sys
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.auth_user.models import User, Role, UserRoleCode
from apps.department.models import Department, DepartmentType
from apps.budget_template.models import BudgetTemplate, TemplateField
from apps.budget.models import (
    Budget, BudgetItem, BudgetType, BudgetSource, BudgetStatus, PurchaseHistory
)


class Command(BaseCommand):
    help = 'Validate generated test data quality'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('开始数据质量验证...\n'))
        errors = []
        warnings = []

        # 1. 验证部门数量
        dept_count = Department.objects.filter(dept_type=DepartmentType.SECOND).count()
        if dept_count == 9:
            self.stdout.write(self.style.SUCCESS(f'[PASS] 二级部门数量: {dept_count}'))
        else:
            errors.append(f'二级部门数量错误: 期望 9, 实际 {dept_count}')

        # 2. 验证每个部门预算数量 >= 100
        for dept in Department.objects.filter(dept_type=DepartmentType.SECOND):
            count = Budget.objects.filter(department=dept).count()
            if count >= 100:
                self.stdout.write(self.style.SUCCESS(f'[PASS] {dept.name}: {count} 条预算'))
            else:
                errors.append(f'{dept.name} 预算数量不足: {count} < 100')

        # 3. 验证预算有明细条目
        budgets_without_items = Budget.objects.filter(items__isnull=True).count()
        if budgets_without_items == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有预算都有明细条目'))
        else:
            errors.append(f'{budgets_without_items} 条预算没有明细条目')

        # 4. 验证预算金额为正
        negative_amounts = Budget.objects.filter(total_amount__lt=0).count()
        if negative_amounts == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有预算金额非负'))
        else:
            errors.append(f'{negative_amounts} 条预算金额为负')

        # 5. 验证预算状态值合法
        valid_statuses = [s[0] for s in BudgetStatus.choices]
        invalid_status = Budget.objects.exclude(status__in=valid_statuses).count()
        if invalid_status == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有预算状态值合法'))
        else:
            errors.append(f'{invalid_status} 条预算状态值非法')

        # 6. 验证预算年份范围
        invalid_years = Budget.objects.exclude(year__in=[2023, 2024, 2025, 2026, 2027]).count()
        if invalid_years == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有预算年份在有效范围内'))
        else:
            errors.append(f'{invalid_years} 条预算年份超出范围')

        # 7. 验证预算来源值合法
        valid_sources = [s[0] for s in BudgetSource.choices]
        invalid_source = Budget.objects.exclude(source__in=valid_sources).count()
        if invalid_source == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有预算来源值合法'))
        else:
            errors.append(f'{invalid_source} 条预算来源值非法')

        # 8. 验证预算类别值合法
        valid_categories = [c[0] for c in BudgetType.choices]
        invalid_category = Budget.objects.exclude(category__in=valid_categories).count()
        if invalid_category == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有预算类别值合法'))
        else:
            errors.append(f'{invalid_category} 条预算类别值非法')

        # 9. 验证历史采购推荐单价（考虑decimal精度截断到2位）
        invalid_suggested = 0
        for history in PurchaseHistory.objects.all():
            expected = (history.historical_price * Decimal('1.2')).quantize(Decimal('0.01'))
            if history.suggested_price != expected:
                invalid_suggested += 1
        if invalid_suggested == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有历史采购推荐单价计算正确'))
        else:
            errors.append(f'{invalid_suggested} 条历史采购推荐单价计算错误')

        # 10. 验证系统角色
        for code, _ in UserRoleCode.choices:
            if Role.objects.filter(code=code).exists():
                self.stdout.write(self.style.SUCCESS(f'[PASS] 角色 {code} 已创建'))
            else:
                errors.append(f'角色 {code} 不存在')

        # 11. 验证用户有角色
        users_without_roles = 0
        for user in User.objects.all():
            if not user.roles.exists():
                users_without_roles += 1
        if users_without_roles == 0:
            self.stdout.write(self.style.SUCCESS('[PASS] 所有用户都有角色'))
        else:
            warnings.append(f'{users_without_roles} 个用户没有角色')

        # 12. 验证模板存在
        if BudgetTemplate.objects.exists() and TemplateField.objects.exists():
            self.stdout.write(self.style.SUCCESS('[PASS] 预算模板和字段已创建'))
        else:
            errors.append('预算模板或字段未创建')

        # 13. 统计汇总
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.NOTICE('数据统计'))
        self.stdout.write('=' * 50)
        self.stdout.write(f'总预算数: {Budget.objects.count()}')
        self.stdout.write(f'总明细数: {BudgetItem.objects.count()}')
        self.stdout.write(f'总用户数: {User.objects.count()}')
        self.stdout.write(f'总角色数: {Role.objects.count()}')
        self.stdout.write(f'历史采购: {PurchaseHistory.objects.count()}')

        # 14. 输出结果
        self.stdout.write('\n' + '=' * 50)
        if errors:
            self.stdout.write(self.style.ERROR(f'验证失败: {len(errors)} 个错误'))
            for err in errors:
                self.stdout.write(self.style.ERROR(f'  [ERROR] {err}'))
            sys.exit(1)
        else:
            self.stdout.write(self.style.SUCCESS('所有验证通过！'))
            if warnings:
                for w in warnings:
                    self.stdout.write(self.style.WARNING(f'  [WARN] {w}'))
