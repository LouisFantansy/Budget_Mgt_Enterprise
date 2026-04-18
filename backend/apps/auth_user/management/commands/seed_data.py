import uuid
from django.core.management.base import BaseCommand
from apps.auth_user.models import User, Role, Permission, UserRole, RolePermission
from apps.department.models import Department


class Command(BaseCommand):
    help = '初始化系统默认数据（角色、权限、部门、管理员）'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化系统数据...')

        # 1. 创建默认部门
        self.create_departments()

        # 2. 创建默认权限
        self.create_permissions()

        # 3. 创建默认角色
        self.create_roles()

        # 4. 为角色分配权限
        self.assign_permissions_to_roles()

        # 5. 创建管理员用户
        self.create_admin_user()

        self.stdout.write(self.style.SUCCESS('系统数据初始化完成！'))

    def create_departments(self):
        self.stdout.write('创建默认部门...')

        departments_data = [
            {'name': '总经办', 'code': 'GM', 'level': 1, 'sort_order': 1},
            {'name': '财务部', 'code': 'FIN', 'level': 1, 'sort_order': 2},
            {'name': '技术部', 'code': 'TECH', 'level': 1, 'sort_order': 3},
            {'name': '市场部', 'code': 'MKT', 'level': 1, 'sort_order': 4},
            {'name': '人力资源部', 'code': 'HR', 'level': 1, 'sort_order': 5},
            {'name': '运营部', 'code': 'OPS', 'level': 1, 'sort_order': 6},
        ]

        for dept_data in departments_data:
            Department.objects.get_or_create(
                code=dept_data['code'],
                defaults=dept_data
            )

        self.stdout.write(f'  已创建 {len(departments_data)} 个部门')

    def create_permissions(self):
        self.stdout.write('创建默认权限...')

        modules = ['budget', 'purchase', 'approval', 'report', 'system']
        actions = ['create', 'read', 'update', 'delete', 'approve', 'export']

        permissions_data = []
        for module in modules:
            for action in actions:
                permissions_data.append({
                    'module': module,
                    'action': action,
                    'name': f'{module}:{action}',
                    'description': f'{self.get_module_name(module)} - {self.get_action_name(action)}'
                })

        for perm_data in permissions_data:
            Permission.objects.get_or_create(
                name=perm_data['name'],
                defaults=perm_data
            )

        self.stdout.write(f'  已创建 {len(permissions_data)} 个权限')

    def get_module_name(self, module):
        names = {
            'budget': '预算管理',
            'purchase': '采购管理',
            'approval': '审批工作流',
            'report': '报表分析',
            'system': '系统管理',
        }
        return names.get(module, module)

    def get_action_name(self, action):
        names = {
            'create': '创建',
            'read': '查看',
            'update': '更新',
            'delete': '删除',
            'approve': '审批',
            'export': '导出',
        }
        return names.get(action, action)

    def create_roles(self):
        self.stdout.write('创建默认角色...')

        roles_data = [
            {
                'name': 'admin',
                'display_name': '系统管理员',
                'description': '拥有所有权限的系统管理员',
                'is_system': True,
            },
            {
                'name': 'budget_manager',
                'display_name': '预算管理员',
                'description': '负责预算的创建、调整和管理工作',
                'is_system': True,
            },
            {
                'name': 'dept_head',
                'display_name': '部门负责人',
                'description': '负责部门预算审批和采购审批',
                'is_system': True,
            },
            {
                'name': 'finance',
                'display_name': '财务人员',
                'description': '负责财务审批和报表查看',
                'is_system': True,
            },
            {
                'name': 'purchaser',
                'display_name': '采购人员',
                'description': '负责采购申请和采购执行',
                'is_system': True,
            },
            {
                'name': 'viewer',
                'display_name': '查看者',
                'description': '只读权限，可查看预算和采购信息',
                'is_system': True,
            },
        ]

        for role_data in roles_data:
            Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )

        self.stdout.write(f'  已创建 {len(roles_data)} 个角色')

    def assign_permissions_to_roles(self):
        self.stdout.write('为角色分配权限...')

        # 获取所有角色和权限
        admin_role = Role.objects.get(name='admin')
        budget_manager_role = Role.objects.get(name='budget_manager')
        dept_head_role = Role.objects.get(name='dept_head')
        finance_role = Role.objects.get(name='finance')
        purchaser_role = Role.objects.get(name='purchaser')
        viewer_role = Role.objects.get(name='viewer')

        all_permissions = list(Permission.objects.all())

        # admin: 所有权限
        for perm in all_permissions:
            RolePermission.objects.get_or_create(role=admin_role, permission=perm)

        # budget_manager: 预算管理全部权限 + 查看其他模块
        budget_perms = [p for p in all_permissions if p.module == 'budget']
        report_perms = [p for p in all_permissions if p.module == 'report']
        for perm in budget_perms + report_perms:
            RolePermission.objects.get_or_create(role=budget_manager_role, permission=perm)

        # dept_head: 审批权限 + 查看权限
        approval_perms = [p for p in all_permissions if p.module in ['approval', 'budget', 'purchase']]
        for perm in approval_perms:
            if perm.action in ['read', 'approve']:
                RolePermission.objects.get_or_create(role=dept_head_role, permission=perm)

        # finance: 财务相关权限
        finance_modules = ['budget', 'purchase', 'report']
        finance_perms = [p for p in all_permissions if p.module in finance_modules]
        for perm in finance_perms:
            if perm.action in ['read', 'approve', 'export']:
                RolePermission.objects.get_or_create(role=finance_role, permission=perm)

        # purchaser: 采购管理权限
        purchase_perms = [p for p in all_permissions if p.module in ['purchase', 'budget']]
        for perm in purchase_perms:
            if perm.action in ['create', 'read', 'update']:
                RolePermission.objects.get_or_create(role=purchaser_role, permission=perm)

        # viewer: 只读权限
        for perm in all_permissions:
            if perm.action == 'read':
                RolePermission.objects.get_or_create(role=viewer_role, permission=perm)

        self.stdout.write('  权限分配完成')

    def create_admin_user(self):
        self.stdout.write('创建管理员用户...')

        admin_role = Role.objects.get(name='admin')
        gm_dept = Department.objects.get(code='GM')

        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'name': '系统管理员',
                'email': 'admin@company.com',
                'status': 'ACTIVE',
                'department': gm_dept,
            }
        )

        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            # 分配 admin 角色
            UserRole.objects.get_or_create(user=admin_user, role=admin_role)
            self.stdout.write('  已创建管理员用户: admin / admin123')
        else:
            self.stdout.write('  管理员用户已存在')
