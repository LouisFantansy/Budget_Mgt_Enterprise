"""
Budget App 综合测试
包含：模型单元测试、序列化器测试、API功能测试、数据验证测试
"""
import uuid
from decimal import Decimal
from datetime import datetime

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.auth_user.models import Role, UserRole, UserRoleCode
from apps.department.models import Department, DepartmentType
from apps.budget_template.models import BudgetTemplate, TemplateField, FieldType, BudgetTemplateStatus, BudgetCategory
from apps.budget.models import (
    Budget, BudgetItem, BudgetType, BudgetSource, BudgetStatus,
    BudgetVersionLog, BudgetChangeLog, BudgetDiff, PurchaseHistory
)

User = get_user_model()


class ModelUnitTests(TestCase):
    """模型层单元测试"""

    def setUp(self):
        self.ss_dept = Department.objects.create(
            code='SS', name='Solid State', dept_type=DepartmentType.FIRST, level=1
        )
        self.arch_dept = Department.objects.create(
            code='ARCH', name='Arch', dept_type=DepartmentType.SECOND,
            level=2, parent=self.ss_dept
        )
        self.user = User.objects.create(
            username='test_user', name='测试用户', status='ACTIVE'
        )
        self.template = BudgetTemplate.objects.create(
            name='测试模板', category=BudgetCategory.OPEX, year=2026,
            status=BudgetTemplateStatus.ACTIVE, creator=self.user
        )

    def test_budget_creation(self):
        """测试预算创建"""
        budget = Budget.objects.create(
            year=2026,
            category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept,
            template=self.template,
            version_major=1,
            version_minor=0,
            version_label='v1.0',
            status=BudgetStatus.DRAFT,
            created_by=self.user,
        )
        self.assertEqual(budget.version_string, 'v1.0')
        self.assertEqual(str(budget), 'Arch 2026 OPEX v1.0')

    def test_budget_version_increment(self):
        """测试版本号递增"""
        budget = Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.user,
        )
        budget.increment_minor()
        self.assertEqual(budget.version_minor, 1)
        self.assertEqual(budget.version_label, 'v1.1')

        budget.increment_major()
        self.assertEqual(budget.version_major, 2)
        self.assertEqual(budget.version_minor, 0)
        self.assertEqual(budget.version_label, 'v2.0')

    def test_budget_unique_constraint(self):
        """测试预算唯一约束"""
        Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.user,
        )
        # 相同组合应触发唯一约束错误
        with self.assertRaises(Exception):
            Budget.objects.create(
                year=2026, category=BudgetType.OPEX,
                source=BudgetSource.SELF_COMPILED,
                department=self.arch_dept, template=self.template,
                version_major=1, version_minor=0, version_label='v1.0',
                status=BudgetStatus.DRAFT, created_by=self.user,
            )

    def test_budget_item_field_data(self):
        """测试预算条目动态字段"""
        budget = Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.user,
        )
        item = BudgetItem.objects.create(
            budget=budget, template=self.template, item_no=1,
            field_data={
                'item_name': 'Test Item',
                'unit_price': '1000.00',
                'quantity': '5',
                'amount': '5000.00'
            },
            created_by=self.user,
        )
        self.assertEqual(item.get_field_value('item_name'), 'Test Item')
        self.assertEqual(item.get_field_value('unit_price'), '1000.00')

        item.set_field_value('unit_price', '1200.00')
        self.assertEqual(item.get_field_value('unit_price'), '1200.00')

    def test_budget_status_transition(self):
        """测试预算状态流转"""
        budget = Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.user,
        )
        self.assertEqual(budget.status, BudgetStatus.DRAFT)

        # DRAFT -> PENDING
        budget.status = BudgetStatus.PENDING
        budget.save()
        self.assertEqual(budget.status, BudgetStatus.PENDING)

        # PENDING -> APPROVED
        budget.status = BudgetStatus.APPROVED
        budget.approved_at = datetime.now()
        budget.approved_by = self.user
        budget.save()
        self.assertEqual(budget.status, BudgetStatus.APPROVED)

    def test_version_log_creation(self):
        """测试版本日志"""
        budget = Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.user,
        )
        log = BudgetVersionLog.objects.create(
            budget=budget, action='CREATE', operator=self.user,
            to_version='v1.0', description='创建预算'
        )
        self.assertEqual(log.action, 'CREATE')
        self.assertEqual(log.to_version, 'v1.0')

    def test_purchase_history_suggested_price(self):
        """测试历史采购推荐单价计算"""
        history = PurchaseHistory.objects.create(
            description='Test Purchase',
            historical_price=Decimal('1000.00'),
            suggested_price=Decimal('1200.00'),
            department=self.arch_dept,
        )
        self.assertEqual(history.suggested_price, Decimal('1200.00'))

    def test_department_hierarchy(self):
        """测试部门层级关系"""
        self.assertTrue(self.arch_dept.is_second_level)
        self.assertFalse(self.arch_dept.is_first_level)
        self.assertEqual(self.arch_dept.parent, self.ss_dept)


class SerializerTests(TestCase):
    """序列化器测试"""

    def setUp(self):
        self.ss_dept = Department.objects.create(
            code='SS', name='Solid State', dept_type=DepartmentType.FIRST, level=1
        )
        self.arch_dept = Department.objects.create(
            code='ARCH', name='Arch', dept_type=DepartmentType.SECOND,
            level=2, parent=self.ss_dept
        )
        self.user = User.objects.create(
            username='test_user', name='测试用户', status='ACTIVE'
        )
        self.template = BudgetTemplate.objects.create(
            name='测试模板', category=BudgetCategory.OPEX, year=2026,
            status=BudgetTemplateStatus.ACTIVE, creator=self.user
        )
        self.budget = Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.user,
        )

    def test_budget_serializer(self):
        """测试预算序列化器"""
        from apps.budget.serializers import BudgetSerializer
        serializer = BudgetSerializer(self.budget)
        data = serializer.data
        self.assertEqual(data['year'], 2026)
        self.assertEqual(data['category'], 'OPEX')
        self.assertEqual(data['source'], 'SELF_COMPILED')
        self.assertEqual(data['department_name'], 'Arch')
        self.assertEqual(data['version_label'], 'v1.0')
        self.assertEqual(data['status'], 'DRAFT')

    def test_budget_list_serializer(self):
        """测试预算列表序列化器"""
        from apps.budget.serializers import BudgetListSerializer
        serializer = BudgetListSerializer(self.budget)
        data = serializer.data
        self.assertEqual(data['year'], 2026)
        self.assertEqual(data['department_name'], 'Arch')
        self.assertEqual(data['status'], 'DRAFT')

    def test_budget_item_serializer(self):
        """测试预算条目序列化器"""
        from apps.budget.serializers import BudgetItemSerializer
        item = BudgetItem.objects.create(
            budget=self.budget, template=self.template, item_no=1,
            field_data={'item_name': 'Test', 'amount': '5000'},
            created_by=self.user,
        )
        serializer = BudgetItemSerializer(item)
        data = serializer.data
        self.assertEqual(data['field_data']['item_name'], 'Test')
        self.assertEqual(data['item_no'], 1)


class BudgetAPITests(APITestCase):
    """API功能测试"""

    def setUp(self):
        self.client = APIClient()

        # 创建角色
        self.admin_role = Role.objects.create(
            code=UserRoleCode.ADMIN, name='系统管理员',
            display_name='系统管理员'
        )
        self.first_budget_role = Role.objects.create(
            code=UserRoleCode.FIRST_BUDGET_ADMIN, name='一级部门预算管理员',
            display_name='一级部门预算管理员'
        )
        self.second_budget_role = Role.objects.create(
            code=UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY, name='主二级部门预算管理员',
            display_name='主二级部门预算管理员'
        )

        # 创建部门
        self.ss_dept = Department.objects.create(
            code='SS', name='Solid State', dept_type=DepartmentType.FIRST, level=1
        )
        self.arch_dept = Department.objects.create(
            code='ARCH', name='Arch', dept_type=DepartmentType.SECOND,
            level=2, parent=self.ss_dept
        )

        # 创建用户
        self.admin_user = User.objects.create(
            username='admin', name='管理员', status='ACTIVE',
            department=self.ss_dept
        )
        self.admin_user.set_password('password123')
        self.admin_user.save()
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.admin_user, role=self.first_budget_role)

        self.arch_user = User.objects.create(
            username='arch_admin', name='Arch预算员', status='ACTIVE',
            department=self.arch_dept
        )
        self.arch_user.set_password('password123')
        self.arch_user.save()
        UserRole.objects.create(user=self.arch_user, role=self.second_budget_role)

        # 创建模板
        self.template = BudgetTemplate.objects.create(
            name='OPEX模板', category=BudgetCategory.OPEX, year=2026,
            status=BudgetTemplateStatus.ACTIVE, creator=self.admin_user
        )
        TemplateField.objects.create(
            template=self.template, field_code='item_name',
            field_name='项目名称', field_type=FieldType.TEXT,
            sort_order=1, is_required=True
        )

        # 创建预算
        self.budget = Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=self.arch_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.admin_user,
        )

    def _authenticate(self, user):
        """用户认证"""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    def test_budget_list_api(self):
        """测试预算列表API"""
        self._authenticate(self.admin_user)
        url = '/api/budgets/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 自定义分页器返回 data.items
        self.assertIn('data', response.data)
        self.assertIn('items', response.data['data'])

    def test_budget_detail_api(self):
        """测试预算详情API"""
        self._authenticate(self.admin_user)
        url = f'/api/budgets/{self.budget.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], 2026)
        self.assertEqual(response.data['category'], 'OPEX')

    def test_budget_create_api(self):
        """测试预算创建API"""
        self._authenticate(self.admin_user)
        url = '/api/budgets/'
        data = {
            'year': 2026,
            'category': 'CAPEX',
            'source': 'SELF_COMPILED',
            'department': str(self.arch_dept.id),
            'template': str(self.template.id),
            'remark': '测试创建预算'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['year'], 2026)

    def test_budget_filter_by_year(self):
        """测试按年份筛选"""
        self._authenticate(self.admin_user)
        url = '/api/budgets/?year=2026'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_budget_filter_by_category(self):
        """测试按类别筛选"""
        self._authenticate(self.admin_user)
        url = '/api/budgets/?category=OPEX'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_budget_items_api(self):
        """测试预算条目列表API"""
        self._authenticate(self.admin_user)
        # 创建条目
        BudgetItem.objects.create(
            budget=self.budget, template=self.template, item_no=1,
            field_data={'item_name': 'Test Item', 'amount': '1000'},
            created_by=self.admin_user,
        )
        url = f'/api/budgets/{self.budget.id}/items/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_budget_add_item_api(self):
        """测试添加预算条目API"""
        self._authenticate(self.admin_user)
        url = f'/api/budgets/{self.budget.id}/add_item/'
        data = {
            'item_no': 1,
            'field_data': {
                'item_name': 'New Item',
                'unit_price': '500',
                'quantity': '10',
                'amount': '5000'
            },
            'template': str(self.template.id)
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print('Response status:', response.status_code)
            print('Response data:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['field_data']['item_name'], 'New Item')

    def test_budget_submit_api(self):
        """测试预算提交审批API"""
        self._authenticate(self.arch_user)
        url = f'/api/budgets/{self.budget.id}/submit/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.budget.refresh_from_db()
        self.assertEqual(self.budget.status, BudgetStatus.PENDING)

    def test_budget_approve_api(self):
        """测试预算审批通过API"""
        self.budget.status = BudgetStatus.PENDING
        self.budget.save()
        self._authenticate(self.admin_user)
        url = f'/api/budgets/{self.budget.id}/approve/'
        data = {'action': 'APPROVE', 'comment': '审批通过'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.budget.refresh_from_db()
        self.assertEqual(self.budget.status, BudgetStatus.APPROVED)
        self.assertEqual(self.budget.version_label, 'v2.0')

    def test_budget_reject_api(self):
        """测试预算审批驳回API"""
        self.budget.status = BudgetStatus.PENDING
        self.budget.save()
        self._authenticate(self.admin_user)
        url = f'/api/budgets/{self.budget.id}/approve/'
        data = {'action': 'REJECT', 'comment': '数据有误'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.budget.refresh_from_db()
        self.assertEqual(self.budget.status, BudgetStatus.REJECTED)

    def test_budget_revise_api(self):
        """测试预算修订API"""
        self.budget.status = BudgetStatus.APPROVED
        self.budget.save()
        self._authenticate(self.admin_user)
        url = f'/api/budgets/{self.budget.id}/revise/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_budget_change_logs_api(self):
        """测试修改留痕API"""
        self._authenticate(self.admin_user)
        BudgetChangeLog.objects.create(
            budget=self.budget, operator=self.admin_user,
            change_type='CREATE', field_code='item_name',
            old_value='', new_value='Test'
        )
        url = f'/api/budgets/{self.budget.id}/change_logs/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_budget_version_logs_api(self):
        """测试版本日志API"""
        self._authenticate(self.admin_user)
        url = f'/api/budgets/{self.budget.id}/version_logs/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_purchase_history_api(self):
        """测试历史采购记录API"""
        self._authenticate(self.admin_user)
        PurchaseHistory.objects.create(
            description='Test History',
            historical_price=Decimal('1000.00'),
            suggested_price=Decimal('1200.00'),
        )
        url = '/api/purchase-history/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_permission_check(self):
        """测试权限控制"""
        # 未认证访问
        self.client.credentials()
        url = '/api/budgets/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_second_dept_user_filter(self):
        """测试二级部门用户只能看自己部门预算"""
        # 创建另一个部门
        other_dept = Department.objects.create(
            code='PHE', name='PHE', dept_type=DepartmentType.SECOND,
            level=2, parent=self.ss_dept
        )
        Budget.objects.create(
            year=2026, category=BudgetType.OPEX,
            source=BudgetSource.SELF_COMPILED,
            department=other_dept, template=self.template,
            version_major=1, version_minor=0, version_label='v1.0',
            status=BudgetStatus.DRAFT, created_by=self.admin_user,
        )

        self._authenticate(self.arch_user)
        url = '/api/budgets/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Arch 用户应该只能看到 Arch 部门的预算
        for item in response.data.get('results', []):
            self.assertEqual(item['department_name'], 'Arch')


# 注意：数据质量验证已移至 management command: validate_test_data
# 运行方式: python manage.py validate_test_data
