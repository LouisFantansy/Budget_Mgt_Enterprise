#!/usr/bin/env python
"""
生成测试数据命令
为9个二级部门生成真实预算数据，每个部门至少100条预算
"""
import random
import uuid
from decimal import Decimal
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction, models

from apps.auth_user.models import User, Role, UserRole, Permission, RolePermission, UserRoleCode
from apps.department.models import Department, DepartmentType, DepartmentBudgetAdmin
from apps.budget_template.models import (
    BudgetTemplate, TemplateField, TemplateFieldOption,
    BudgetCategory, FieldType, BudgetTemplateStatus
)
from apps.budget.models import (
    Budget, BudgetItem, BudgetType, BudgetSource, BudgetStatus,
    BudgetVersionLog, PurchaseHistory
)


# ========== 常量定义 ==========
SECONDARY_DEPTS = [
    'Arch', 'PHE', 'PVE', 'STE', 'PE', 'PDT',
    'cSSD FW', 'eSSD FW', 'Embedded FW'
]

# 预算条目名称（按部门分类）
BUDGET_ITEMS_BY_DEPT = {
    'Arch': [
        'CPU Architecture Research', 'Memory Controller IP', 'PCIe Gen5 Bridge',
        'SoC Floorplan Design', 'Power Architecture Study', 'Thermal Simulation Tool',
        'Architecture Validation Board', 'FPGA Prototyping Platform', 'Logic Analyzer',
        'High-speed Oscilloscope', 'Signal Integrity Simulation License',
        'EDA Tool License (Architecture)', 'Reference Design Platform',
        'Benchmark Software License', 'Cloud Compute Instance (Arch)',
        'Technical Book Subscription', 'Conference Registration (ISSCC)',
        'Conference Registration (HotChips)', 'Patent Filing Fee',
        'Architecture White Paper Translation', 'University Collaboration Fund',
        'Intern Stipend (Architecture)', 'Training Course (ARMv9)',
        'Training Course (RISC-V)', 'Workstation Upgrade (Arch Team)',
        'Server Rack Expansion', 'NVMe Controller Study', 'DDR5 PHY Research',
        'Chiplet Interconnect Study', 'AI Accelerator Architecture',
    ],
    'PHE': [
        'Product Handling Equipment', 'Automated Tester Handler',
        'Wafer Prober Upgrade', 'Pick and Place Machine',
        'Reflow Oven Maintenance', 'X-Ray Inspection System',
        'AOI Visual Inspector', 'Test Socket Replacement',
        'Load Board Fabrication', 'Interface Board Design',
        'Thermal Chamber Rental', 'Vibration Test System',
        'ESD Protection Equipment', 'Cleanroom Supply Restock',
        'Glove Replacement Batch', 'Wafer Cassette Order',
        'Shipping Box (Anti-static)', 'Label Printer Ribbon',
        'Barcode Scanner Battery', 'Tool Calibration Service',
        'Equipment Transport Fee', 'Facility Rent (Test Floor)',
        'Utility Bill (Test Floor)', 'Safety Equipment Inspection',
        'Fire Extinguisher Refill', 'Emergency Lighting Check',
        'Waste Disposal Contract', 'Pest Control Service',
        'Security Guard Service', 'CCTV Maintenance',
    ],
    'PVE': [
        'Product Validation Equipment', 'Protocol Analyzer (PCIe)',
        'Protocol Analyzer (NVMe)', 'Protocol Analyzer (SATA)',
        'BERT Tester', 'Eye Diagram Analyzer',
        'Power Supply (Precision)', 'Electronic Load',
        'Temperature Chamber', 'Humidity Chamber',
        'Shock Test Machine', 'Drop Test Machine',
        'EMI Pre-compliance Kit', 'ESD Gun (Contact)',
        'ESD Gun (Air)', 'Surge Tester',
        'Voltage Dip Generator', 'Data Retention Oven',
        'Endurance Test System', 'Read Disturb Tester',
        'Firmware Validation Rig', 'Regression Test Server',
        'CI/CD Runner License', 'Test Automation Software',
        'Bug Tracking License', 'JIRA Subscription',
        'Confluence Subscription', 'Test Case Management Tool',
        'Virtual Machine License', 'Cloud Validation Environment',
    ],
    'STE': [
        'System Test Equipment', 'System-Level Test Platform',
        'Motherboard (Test Vehicle)', 'BIOS/UEFI Debug Tool',
        'OS Image License (Windows)', 'OS Image License (Linux)',
        'Driver Certification Test', 'Compatibility Test Suite',
        'Performance Benchmark Tool', 'PCMark License',
        'CrystalDiskMark License', 'IOmeter License',
        'FIO Benchmark License', 'Stress Test Software',
        'Burn-in Test Chamber', 'System Thermal Test',
        'Acoustic Noise Meter', 'Power Consumption Meter',
        'Sleep/Wake Test Fixture', 'Hot Plug Test Fixture',
        'Rapid Hot Swap Tester', 'System Reboot Cycle Tester',
        'Longevity Test SSD', 'Reference SSD (Competitor)',
        'Test PC Assembly', 'GPU Card (Test)',
        'Network Switch (10GbE)', 'KVM Switch',
        'UPS Battery Replacement', 'PDU Power Strip',
    ],
    'PE': [
        'Process Engineering Equipment', 'Photolithography Simulation',
        'Etch Process Development', 'Thin Film Deposition Tool',
        'CMP Slurry Supply', 'Cleaning Chemical Order',
        'Metrology SEM Service', 'AFM Probe Replacement',
        'Ellipsometer Calibration', 'Four-point Probe',
        'Wafer Thickness Gauge', 'Particle Counter',
        'Oxygen Analyzer', 'Moisture Analyzer',
        'Process Control Software', 'SPC Chart License',
        'DOE Software License', 'Yield Management System',
        'Defect Review SEM Time', 'Warranty Extension (Tool)',
        'Spare Parts Inventory', 'Technician Overtime Pay',
        'Process Documentation Print', 'Safety Training Material',
        'Cleanroom Suit Laundry', 'Shoe Cover Batch',
        'Chemical Waste Handling', 'Environmental Monitoring',
        'Air Filter Replacement', 'DI Water System Maintenance',
    ],
    'PDT': [
        'Product Development Tool', 'Project Management Software',
        'Gantt Chart License', 'Resource Planning Tool',
        'Requirement Management Tool', 'Design Review Meeting Cost',
        'Prototype Material Order', '3D Printing Service',
        'CNC Machining Service', 'Injection Mold Trial',
        'PCB Fabrication (Quick)', 'PCB Assembly (Prototype)',
        'Component Sourcing Fee', 'BOM Management Tool',
        'ECR/ECN System License', 'Change Control Software',
        'Vendor Audit Travel', 'Supplier Quality Review',
        'PPAP Documentation', 'FAI Report Preparation',
        'Reliability Test Plan', 'DFM Analysis Service',
        'DFT Analysis Service', 'Signal Integrity Consultation',
        'Thermal Simulation Service', 'Mechanical Simulation Service',
        'Patent Search Service', 'Competitive Analysis Report',
        'Market Research Survey', 'Customer Visit Expense',
    ],
    'cSSD FW': [
        'cSSD Firmware Development', 'Firmware Compiler License',
        'Static Analysis Tool', 'Code Coverage Tool',
        'Debug Emulator (JTAG)', 'Logic Analyzer (FW)',
        'Protocol Analyzer (SATA)', 'Protocol Analyzer (NVMe)',
        'Reference Drive (cSSD)', 'Test NAND Flash',
        'Controller Evaluation Board', 'Firmware Regression Rig',
        'Nightly Build Server', 'GitLab CI Runner',
        'Code Review Tool License', 'Static Checker License',
        'Unit Test Framework', 'Mock Hardware Simulator',
        'Flash Translation Layer Dev', 'Wear Leveling Algorithm Study',
        'Garbage Collection Optimize', 'Bad Block Management',
        'Power Loss Protection Test', 'Thermal Throttle Algorithm',
        'S.M.A.R.T. Implementation', 'Secure Erase Feature',
        'Encryption Module License', 'TCG Opal Certification',
        'FIPS 140-2 Validation', 'Common Criteria Evaluation',
    ],
    'eSSD FW': [
        'eSSD Firmware Development', 'Enterprise Compiler License',
        'Enterprise Debug Tool', 'Multi-Channel Analyzer',
        'Performance Profiler', 'Memory Leak Detector',
        'Race Condition Checker', 'Reference Drive (eSSD)',
        'Enterprise NAND Sample', 'eTLC NAND Evaluation',
        'PLP Capacitor Bank', 'Supercapacitor Test',
        'Dual-port Controller Dev', 'Multipath IO Testing',
        'NVMe-oF Development', 'RDMA Integration Test',
        'Persistent Memory Support', 'ZNS Development',
        'Key-Value SSD Support', 'Open-Channel SSD Dev',
        'Firmware Update Mechanism', 'In-band Management',
        'Out-of-band Management', 'Telemetry Collection',
        'Predictive Failure Analysis', 'End-to-End Data Protection',
        'DIF/DIX Support', 'T10 DIF Implementation',
        'Namespace Management', 'SR-IOV Virtualization',
    ],
    'Embedded FW': [
        'Embedded Firmware Development', 'ARM Compiler License',
        'RTOS License (FreeRTOS)', 'RTOS License (ThreadX)',
        'BSP Development Board', 'Evaluation Kit (MCU)',
        'J-Link Debugger', 'ULINK Debugger',
        ' oscilloscope (Embedded)', 'Logic Analyzer (Embedded)',
        'Power Profiler', 'Current Measurement Tool',
        'Temperature Logger', 'Humidity Logger',
        'Wireless Module (WiFi)', 'Wireless Module (BLE)',
        'Wireless Module (Zigbee)', 'Antenna Design Service',
        'RF Certification Test', 'EMC Pre-test',
        'Safety Certification (UL)', 'Safety Certification (CE)',
        'Bootloader Development', 'OTA Update Mechanism',
        'Secure Boot Implementation', 'Trusted Execution Env',
        'Cryptographic Library', 'Hardware Abstraction Layer',
        'Driver Development (SPI)', 'Driver Development (I2C)',
    ],
}

# 通用供应商列表
SUPPLIERS = [
    'Intel Corporation', 'Samsung Electronics', 'SK Hynix', 'Micron Technology',
    'Western Digital', 'Kioxia Corporation', 'Phison Electronics', 'Silicon Motion',
    'Marvell Technology', 'Broadcom Inc.', 'Texas Instruments', 'Analog Devices',
    'NXP Semiconductors', 'STMicroelectronics', 'Renesas Electronics', 'ON Semiconductor',
    'Vanguard International', 'UMC', 'GlobalFoundries', 'TSMC',
    'ASE Technology', 'Amkor Technology', 'JCET', 'ChipMOS',
    'Advantest Corporation', 'Teradyne Inc.', 'Cohu Inc.', 'Xcerra Corporation',
]

# 通用规格型号
SPECIFICATIONS = [
    'Gen5 x4, 128L TLC, 15.36TB',
    'Gen4 x4, 176L TLC, 7.68TB',
    'Gen3 x4, 128L QLC, 30.72TB',
    'Gen5 x4, 200L TLC, 3.84TB',
    'SATA III, 96L TLC, 1.92TB',
    'Gen4 x4, 176L QLC, 15.36TB',
    'Gen5 x4, 232L TLC, 7.68TB',
    'Gen3 x2, 128L TLC, 960GB',
    'Gen4 x4, 200L TLC, 1.92TB',
    'SATA III, 128L QLC, 3.84TB',
]

UNITS = ['pcs', 'set', 'license', 'hour', 'month', 'GB', 'TB', 'slot']

MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

YEARS = [2023, 2024, 2025, 2026, 2027]


class Command(BaseCommand):
    help = 'Generate realistic test budget data for 9 secondary departments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--min-per-dept',
            type=int,
            default=100,
            help='Minimum number of budgets per department (default: 100)'
        )

    def handle(self, *args, **options):
        min_per_dept = options['min_per_dept']
        self.stdout.write(self.style.NOTICE(f'开始生成测试数据，目标：每个部门至少 {min_per_dept} 条预算'))

        with transaction.atomic():
            self.create_roles()
            self.create_users()
            self.create_departments()
            self.create_templates()
            self.create_budgets(min_per_dept)
            self.create_purchase_history()

        self.stdout.write(self.style.SUCCESS('测试数据生成完成！'))
        self.print_summary()

    def create_roles(self):
        """创建系统角色"""
        self.stdout.write('创建角色...')
        roles_data = [
            (UserRoleCode.FIRST_BUDGET_ADMIN, '一级部门预算管理员', '负责SS一级部门预算编制与审批'),
            (UserRoleCode.FIRST_BUDGET_HOST, '一级部门预算管理员主办', '主办一级部门预算事务'),
            (UserRoleCode.FIRST_DEPT_HEAD, '一级部门负责人', 'SS一级部门最终审批人'),
            (UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY, '主二级部门预算管理员', '二级部门主要预算编制人'),
            (UserRoleCode.SECOND_BUDGET_ADMIN_SECONDARY, '次二级部门预算管理员', '协助编制二级部门预算'),
            (UserRoleCode.SECOND_DEPT_HEAD, '二级部门负责人', '二级部门预算审批人'),
            (UserRoleCode.ENGINEER, '一线工程师', '提出预算需求'),
            (UserRoleCode.ADMIN, '系统管理员', '系统维护与管理'),
        ]

        for code, name, desc in roles_data:
            Role.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'display_name': name,
                    'description': desc,
                    'is_system': True,
                }
            )

        # 创建基本权限
        permissions = [
            ('budget', 'create', 'budget_create'),
            ('budget', 'read', 'budget_read'),
            ('budget', 'update', 'budget_update'),
            ('budget', 'delete', 'budget_delete'),
            ('budget', 'approve', 'budget_approve'),
            ('budget', 'export', 'budget_export'),
        ]
        for module, action, name in permissions:
            Permission.objects.get_or_create(
                name=name,
                defaults={'module': module, 'action': action}
            )

        self.stdout.write(self.style.SUCCESS(f'  已创建 {Role.objects.count()} 个角色'))

    def create_users(self):
        """创建测试用户"""
        self.stdout.write('创建用户...')
        users_data = [
            ('admin', '系统管理员', [UserRoleCode.ADMIN]),
            ('ss_budget', '张三', [UserRoleCode.FIRST_BUDGET_ADMIN]),
            ('ss_host', '李四', [UserRoleCode.FIRST_BUDGET_HOST]),
            ('ss_head', '王五', [UserRoleCode.FIRST_DEPT_HEAD]),
            ('arch_admin', 'Arch预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('arch_head', 'Arch负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('phe_admin', 'PHE预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('phe_head', 'PHE负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('pve_admin', 'PVE预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('pve_head', 'PVE负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('ste_admin', 'STE预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('ste_head', 'STE负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('pe_admin', 'PE预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('pe_head', 'PE负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('pdt_admin', 'PDT预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('pdt_head', 'PDT负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('cssd_admin', 'cSSD预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('cssd_head', 'cSSD负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('essd_admin', 'eSSD预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('essd_head', 'eSSD负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('emb_admin', 'Embedded预算员', [UserRoleCode.SECOND_BUDGET_ADMIN_PRIMARY]),
            ('emb_head', 'Embedded负责人', [UserRoleCode.SECOND_DEPT_HEAD]),
            ('engineer1', '工程师A', [UserRoleCode.ENGINEER]),
            ('engineer2', '工程师B', [UserRoleCode.ENGINEER]),
        ]

        for username, name, role_codes in users_data:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'name': name,
                    'email': f'{username}@ss-corp.com',
                    'status': 'ACTIVE',
                }
            )
            user.set_password('123456')
            user.save()

            for code in role_codes:
                role = Role.objects.get(code=code)
                UserRole.objects.get_or_create(user=user, role=role)

        self.stdout.write(self.style.SUCCESS(f'  已创建 {User.objects.count()} 个用户'))

    def create_departments(self):
        """创建部门结构"""
        self.stdout.write('创建部门...')

        # 一级部门 SS
        ss_dept, _ = Department.objects.get_or_create(
            code='SS',
            defaults={
                'name': 'Solid State 事业部',
                'dept_type': DepartmentType.FIRST,
                'short_name': 'SS',
                'level': 1,
                'sort_order': 1,
                'status': 'ACTIVE',
            }
        )

        self.first_dept = ss_dept

        # 二级部门
        self.secondary_depts = []
        for i, dept_name in enumerate(SECONDARY_DEPTS):
            code = dept_name.replace(' ', '_').replace('/', '_').upper()
            dept, _ = Department.objects.get_or_create(
                code=code,
                defaults={
                    'name': dept_name,
                    'dept_type': DepartmentType.SECOND,
                    'level': 2,
                    'parent': ss_dept,
                    'sort_order': i + 10,
                    'status': 'ACTIVE',
                }
            )
            self.secondary_depts.append(dept)

        self.stdout.write(self.style.SUCCESS(f'  已创建 1 个一级部门 + {len(self.secondary_depts)} 个二级部门'))

    def create_templates(self):
        """创建预算模板和字段"""
        self.stdout.write('创建预算模板...')

        templates_data = [
            ('2026年度OPEX自编预算模板', BudgetCategory.OPEX, False, 2026),
            ('2026年度CAPEX自编预算模板', BudgetCategory.CAPEX, False, 2026),
            ('2026年度集团分摊预算模板', BudgetCategory.OPEX, True, 2026),
        ]

        admin_user = User.objects.get(username='ss_budget')
        self.templates = []

        for name, category, is_group, year in templates_data:
            tpl, _ = BudgetTemplate.objects.get_or_create(
                name=name,
                defaults={
                    'category': category,
                    'is_group_allocation': is_group,
                    'year': year,
                    'version': 1,
                    'status': BudgetTemplateStatus.ACTIVE,
                    'creator': admin_user,
                    'task_triggered': True,
                    'triggered_at': datetime.now(),
                }
            )
            self.templates.append(tpl)
            self.create_template_fields(tpl)

        self.stdout.write(self.style.SUCCESS(f'  已创建 {len(self.templates)} 个模板'))

    def create_template_fields(self, template):
        """为模板创建字段定义"""
        fields = [
            ('item_name', '项目名称', FieldType.TEXT, True, True, '200'),
            ('specification', '规格型号', FieldType.TEXT, True, False, '200'),
            ('supplier', '供应商', FieldType.SELECT, True, False, '150'),
            ('unit', '单位', FieldType.SELECT, True, False, '80'),
            ('unit_price', '单价', FieldType.NUMBER, True, True, '120'),
            ('quantity', '数量', FieldType.NUMBER, True, True, '100'),
            ('amount', '金额', FieldType.FORMULA, True, False, '120'),
            ('purpose', '用途说明', FieldType.TEXT, False, False, '250'),
            ('month_1', '1月', FieldType.NUMBER, False, False, '80'),
            ('month_2', '2月', FieldType.NUMBER, False, False, '80'),
            ('month_3', '3月', FieldType.NUMBER, False, False, '80'),
            ('month_4', '4月', FieldType.NUMBER, False, False, '80'),
            ('month_5', '5月', FieldType.NUMBER, False, False, '80'),
            ('month_6', '6月', FieldType.NUMBER, False, False, '80'),
            ('month_7', '7月', FieldType.NUMBER, False, False, '80'),
            ('month_8', '8月', FieldType.NUMBER, False, False, '80'),
            ('month_9', '9月', FieldType.NUMBER, False, False, '80'),
            ('month_10', '10月', FieldType.NUMBER, False, False, '80'),
            ('month_11', '11月', FieldType.NUMBER, False, False, '80'),
            ('month_12', '12月', FieldType.NUMBER, False, False, '80'),
        ]

        for i, (code, name, ftype, required, editable, width) in enumerate(fields):
            field, _ = TemplateField.objects.get_or_create(
                template=template,
                field_code=code,
                defaults={
                    'field_name': name,
                    'field_type': ftype,
                    'sort_order': i,
                    'is_visible': True,
                    'is_editable': editable,
                    'is_required': required,
                    'width': width,
                    'formula': 'unit_price * quantity' if code == 'amount' else None,
                }
            )

            # 为SELECT类型创建选项
            if code == 'supplier':
                for j, sup in enumerate(SUPPLIERS[:10]):
                    TemplateFieldOption.objects.get_or_create(
                        field=field,
                        option_value=sup,
                        defaults={'option_label': sup, 'sort_order': j}
                    )
            elif code == 'unit':
                for j, unit in enumerate(UNITS):
                    TemplateFieldOption.objects.get_or_create(
                        field=field,
                        option_value=unit,
                        defaults={'option_label': unit, 'sort_order': j}
                    )

    def create_budgets(self, min_per_dept):
        """为每个部门生成预算数据"""
        self.stdout.write(f'生成预算数据（每部门至少 {min_per_dept} 条）...')

        total_budgets = 0
        total_items = 0

        for dept in self.secondary_depts:
            dept_budgets = 0
            dept_name = dept.name

            # 为不同年份、类型、来源、版本生成预算
            for year in YEARS:
                for category in [BudgetType.OPEX, BudgetType.CAPEX]:
                    for source in [BudgetSource.SELF_COMPILED, BudgetSource.GROUP_ALLOCATION, BudgetSource.SS_PUBLIC]:
                        # 每个组合生成 2-4 个版本
                        num_versions = random.randint(2, 4)
                        for v in range(num_versions):
                            # 根据版本确定状态
                            if v == num_versions - 1:
                                status = random.choice([
                                    BudgetStatus.DRAFT,
                                    BudgetStatus.PENDING,
                                    BudgetStatus.APPROVED
                                ])
                            else:
                                status = BudgetStatus.APPROVED

                            template = random.choice(self.templates)
                            budget = self.create_single_budget(
                                dept, year, category, source, v + 1, 0,
                                status, template
                            )
                            dept_budgets += 1
                            total_budgets += 1

                            # 为每个预算创建条目
                            num_items = random.randint(3, 8)
                            for _ in range(num_items):
                                self.create_budget_item(budget, template, dept_name)
                                total_items += 1

            self.stdout.write(f'  {dept_name}: {dept_budgets} 条预算')

        self.stdout.write(self.style.SUCCESS(
            f'  总计: {total_budgets} 条预算, {total_items} 条明细'
        ))

    def create_single_budget(self, dept, year, category, source,
                             version_major, version_minor, status, template):
        """创建单个预算"""
        budget_no = None
        approved_at = None
        approved_by = None
        submitted_at = None
        submitted_by = None

        admin_user = User.objects.get(username='ss_budget')

        if status == BudgetStatus.APPROVED:
            budget_no = f"BG-{dept.code}-{year}-{category[:1]}-{version_major}"
            approved_at = datetime(year, random.randint(1, 12), random.randint(1, 28))
            approved_by = admin_user
            submitted_at = approved_at - timedelta(days=random.randint(3, 10))
            submitted_by = admin_user
        elif status == BudgetStatus.PENDING:
            submitted_at = datetime.now() - timedelta(days=random.randint(1, 30))
            submitted_by = admin_user

        budget = Budget.objects.create(
            budget_no=budget_no,
            year=year,
            category=category,
            source=source,
            department=dept,
            template=template,
            version_major=version_major,
            version_minor=version_minor,
            version_label=f'v{version_major}.{version_minor}',
            status=status,
            approved_at=approved_at,
            approved_by=approved_by,
            submitted_at=submitted_at,
            submitted_by=submitted_by,
            total_amount=0,  # 稍后更新
            total_quantity=0,
            remark=f'{year}年{category}预算 - {source}',
            created_by=admin_user,
        )

        # 创建版本日志
        BudgetVersionLog.objects.create(
            budget=budget,
            action='CREATE' if version_major == 1 else 'EDIT',
            operator=admin_user,
            description=f'创建预算 v{version_major}.{version_minor}',
            from_version=None,
            to_version=budget.version_label,
        )

        return budget

    def create_budget_item(self, budget, template, dept_name):
        """创建预算条目"""
        item_names = BUDGET_ITEMS_BY_DEPT.get(dept_name, BUDGET_ITEMS_BY_DEPT['Arch'])
        item_name = random.choice(item_names)
        spec = random.choice(SPECIFICATIONS)
        supplier = random.choice(SUPPLIERS)
        unit = random.choice(UNITS)
        unit_price = Decimal(str(round(random.uniform(100, 500000), 2)))
        quantity = Decimal(str(random.randint(1, 100)))
        amount = unit_price * quantity

        # 月度分布
        month_data = {}
        for m in range(1, 13):
            month_data[f'month_{m}'] = random.randint(0, int(quantity))

        field_data = {
            'item_name': item_name,
            'specification': spec,
            'supplier': supplier,
            'unit': unit,
            'unit_price': str(unit_price),
            'quantity': str(quantity),
            'amount': str(amount),
            'purpose': f'用于{dept_name}的{item_name}',
            **month_data,
        }

        admin_user = User.objects.get(username='ss_budget')

        BudgetItem.objects.create(
            budget=budget,
            template=template,
            item_no=BudgetItem.objects.filter(budget=budget).count() + 1,
            field_data=field_data,
            computed_fields={'amount': str(amount)},
            internal_comment=None,
            created_by=admin_user,
        )

        # 更新预算汇总
        budget.total_amount += amount
        budget.total_quantity += quantity
        budget.save()

    def create_purchase_history(self):
        """创建历史采购记录"""
        self.stdout.write('创建历史采购记录...')

        for dept in self.secondary_depts:
            item_names = BUDGET_ITEMS_BY_DEPT.get(dept.name, [])
            for item_name in item_names[:15]:
                price = Decimal(str(round(random.uniform(500, 200000), 2)))
                PurchaseHistory.objects.get_or_create(
                    description=f'{dept.name} - {item_name}',
                    defaults={
                        'specification': random.choice(SPECIFICATIONS),
                        'historical_price': price,
                        'suggested_price': price * Decimal('1.2'),
                        'supplier': random.choice(SUPPLIERS),
                        'purchase_date': datetime(
                            random.randint(2020, 2025),
                            random.randint(1, 12),
                            random.randint(1, 28)
                        ),
                        'department': dept,
                        'usage_count': random.randint(1, 50),
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'  已创建 {PurchaseHistory.objects.count()} 条历史记录'))

    def print_summary(self):
        """打印数据汇总"""
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.NOTICE('数据生成汇总'))
        self.stdout.write('=' * 50)
        self.stdout.write(f'角色数量: {Role.objects.count()}')
        self.stdout.write(f'用户数量: {User.objects.count()}')
        self.stdout.write(f'部门数量: {Department.objects.count()}')
        self.stdout.write(f'模板数量: {BudgetTemplate.objects.count()}')
        self.stdout.write(f'模板字段: {TemplateField.objects.count()}')
        self.stdout.write(f'预算数量: {Budget.objects.count()}')
        self.stdout.write(f'预算明细: {BudgetItem.objects.count()}')
        self.stdout.write(f'历史采购: {PurchaseHistory.objects.count()}')
        self.stdout.write(f'版本日志: {BudgetVersionLog.objects.count()}')

        self.stdout.write('\n各部门预算分布:')
        for dept in self.secondary_depts:
            count = Budget.objects.filter(department=dept).count()
            items = BudgetItem.objects.filter(budget__department=dept).count()
            total = Budget.objects.filter(department=dept).aggregate(
                total=models.Sum('total_amount')
            )['total'] or 0
            self.stdout.write(f'  {dept.name}: {count} 条预算, {items} 条明细, 总额 ¥{total:,.2f}')
