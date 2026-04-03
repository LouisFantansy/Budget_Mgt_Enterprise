import { PrismaClient, BudgetType, BudgetStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // ========== 1. 创建部门（树形结构）==========
  console.log('\n📁 创建部门...');

  const headquarters = await prisma.department.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      id: 'dept-headquarters',
      name: '总公司',
      code: 'HQ',
      level: 1,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ 总公司');

  const rdDept = await prisma.department.upsert({
    where: { code: 'RD' },
    update: {},
    create: {
      id: 'dept-rd',
      name: '研发部',
      code: 'RD',
      level: 2,
      parentId: headquarters.id,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ 研发部');

  const productDept = await prisma.department.upsert({
    where: { code: 'PD' },
    update: {},
    create: {
      id: 'dept-product',
      name: '产品部',
      code: 'PD',
      level: 2,
      parentId: headquarters.id,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ 产品部');

  const opsDept = await prisma.department.upsert({
    where: { code: 'OPS' },
    update: {},
    create: {
      id: 'dept-ops',
      name: '运营部',
      code: 'OPS',
      level: 2,
      parentId: headquarters.id,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ 运营部');

  const financeDept = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: {
      id: 'dept-finance',
      name: '财务部',
      code: 'FIN',
      level: 2,
      parentId: headquarters.id,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ 财务部');

  // ========== 2. 创建角色 ==========
  console.log('\n👤 创建角色...');

  const roles = [
    { id: 'role-admin', name: 'admin', displayName: '系统管理员', description: '拥有所有权限', isSystem: true },
    { id: 'role-budget-manager', name: 'budget_manager', displayName: '预算管理员', description: '预算全部 + 采购查看', isSystem: true },
    { id: 'role-dept-head', name: 'dept_head', displayName: '部门负责人', description: '本部门预算和采购 + 审批', isSystem: true },
    { id: 'role-finance', name: 'finance', displayName: '财务人员', description: '报表 + 预算查看 + 结算', isSystem: true },
    { id: 'role-purchaser', name: 'purchaser', displayName: '采购员', description: '采购全部 + 预算查看', isSystem: true },
    { id: 'role-viewer', name: 'viewer', displayName: '普通用户', description: '只读权限', isSystem: true },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`  ✓ ${roleData.displayName}`);
  }

  // ========== 3. 创建权限 ==========
  console.log('\n🔐 创建权限...');

  const permissions = [
    // 预算权限
    { module: 'budget', action: 'create', name: 'budget.create' },
    { module: 'budget', action: 'read', name: 'budget.read' },
    { module: 'budget', action: 'update', name: 'budget.update' },
    { module: 'budget', action: 'delete', name: 'budget.delete' },
    { module: 'budget', action: 'approve', name: 'budget.approve' },
    
    // 采购权限
    { module: 'purchase', action: 'create', name: 'purchase.create' },
    { module: 'purchase', action: 'read', name: 'purchase.read' },
    { module: 'purchase', action: 'update', name: 'purchase.update' },
    { module: 'purchase', action: 'delete', name: 'purchase.delete' },
    { module: 'purchase', action: 'approve', name: 'purchase.approve' },
    
    // 审批权限
    { module: 'approval', action: 'read', name: 'approval.read' },
    { module: 'approval', action: 'approve', name: 'approval.approve' },
    
    // 报表权限
    { module: 'report', action: 'read', name: 'report.read' },
    { module: 'report', action: 'export', name: 'report.export' },
    
    // 导入权限
    { module: 'import', action: 'create', name: 'import.create' },
    { module: 'import', action: 'read', name: 'import.read' },
    
    // 审计权限
    { module: 'audit', action: 'read', name: 'audit.read' },
    { module: 'audit', action: 'export', name: 'audit.export' },
    
    // 系统权限
    { module: 'system', action: 'read', name: 'system.read' },
    { module: 'system', action: 'update', name: 'system.update' },
    
    // 用户权限
    { module: 'user', action: 'create', name: 'user.create' },
    { module: 'user', action: 'read', name: 'user.read' },
    { module: 'user', action: 'update', name: 'user.update' },
    { module: 'user', action: 'delete', name: 'user.delete' },
  ];

  for (const permData of permissions) {
    await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: permData,
    });
  }
  console.log(`  ✓ 创建 ${permissions.length} 个权限`);

  // ========== 4. 为角色分配权限 ==========
  console.log('\n🔗 分配角色权限...');

  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map(p => [p.name, p.id]));

  // admin - 全部权限
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    await prisma.rolePermission.createMany({
      data: allPermissions.map(p => ({ roleId: adminRole.id, permissionId: p.id })),
    });
    console.log('  ✓ admin: 全部权限');
  }

  // budget_manager - 预算全部 + 采购查看 + 报表查看
  const budgetManagerRole = await prisma.role.findUnique({ where: { name: 'budget_manager' } });
  if (budgetManagerRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: budgetManagerRole.id } });
    const budgetManagerPerms = [
      'budget.create', 'budget.read', 'budget.update', 'budget.delete', 'budget.approve',
      'purchase.read',
      'report.read', 'report.export',
      'approval.read', 'approval.approve',
    ];
    await prisma.rolePermission.createMany({
      data: budgetManagerPerms
        .filter(name => permMap.has(name))
        .map(name => ({ roleId: budgetManagerRole.id, permissionId: permMap.get(name)! })),
    });
    console.log('  ✓ budget_manager: 预算全部 + 采购查看 + 报表');
  }

  // dept_head - 本部门预算和采购 + 审批
  const deptHeadRole = await prisma.role.findUnique({ where: { name: 'dept_head' } });
  if (deptHeadRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: deptHeadRole.id } });
    const deptHeadPerms = [
      'budget.read', 'budget.create', 'budget.update',
      'purchase.read', 'purchase.create', 'purchase.update',
      'approval.read', 'approval.approve',
      'report.read',
    ];
    await prisma.rolePermission.createMany({
      data: deptHeadPerms
        .filter(name => permMap.has(name))
        .map(name => ({ roleId: deptHeadRole.id, permissionId: permMap.get(name)! })),
    });
    console.log('  ✓ dept_head: 本部门预算和采购 + 审批');
  }

  // finance - 报表 + 预算查看 + 审计
  const financeRole = await prisma.role.findUnique({ where: { name: 'finance' } });
  if (financeRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: financeRole.id } });
    const financePerms = [
      'budget.read',
      'purchase.read',
      'report.read', 'report.export',
      'audit.read', 'audit.export',
      'import.read',
      'approval.read',
    ];
    await prisma.rolePermission.createMany({
      data: financePerms
        .filter(name => permMap.has(name))
        .map(name => ({ roleId: financeRole.id, permissionId: permMap.get(name)! })),
    });
    console.log('  ✓ finance: 报表 + 预算查看 + 审计');
  }

  // purchaser - 采购全部 + 预算查看
  const purchaserRole = await prisma.role.findUnique({ where: { name: 'purchaser' } });
  if (purchaserRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: purchaserRole.id } });
    const purchaserPerms = [
      'budget.read',
      'purchase.create', 'purchase.read', 'purchase.update', 'purchase.delete',
      'approval.read',
    ];
    await prisma.rolePermission.createMany({
      data: purchaserPerms
        .filter(name => permMap.has(name))
        .map(name => ({ roleId: purchaserRole.id, permissionId: permMap.get(name)! })),
    });
    console.log('  ✓ purchaser: 采购全部 + 预算查看');
  }

  // viewer - 只读
  const viewerRole = await prisma.role.findUnique({ where: { name: 'viewer' } });
  if (viewerRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: viewerRole.id } });
    const viewerPerms = [
      'budget.read',
      'purchase.read',
      'report.read',
    ];
    await prisma.rolePermission.createMany({
      data: viewerPerms
        .filter(name => permMap.has(name))
        .map(name => ({ roleId: viewerRole.id, permissionId: permMap.get(name)! })),
    });
    console.log('  ✓ viewer: 只读权限');
  }

  // ========== 5. 创建用户 ==========
  console.log('\n👥 创建用户...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // admin / 系统管理员 / admin角色 / 总公司
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'user-admin',
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      email: 'admin@company.com',
      departmentId: headquarters.id,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole!.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole!.id },
  });
  console.log('  ✓ admin / 系统管理员');

  // zhangsan / 张三 / dept_head / 研发部
  const zhangsan = await prisma.user.upsert({
    where: { username: 'zhangsan' },
    update: {},
    create: {
      id: 'user-zhangsan',
      username: 'zhangsan',
      password: hashedPassword,
      name: '张三',
      email: 'zhangsan@company.com',
      departmentId: rdDept.id,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: zhangsan.id, roleId: deptHeadRole!.id } },
    update: {},
    create: { userId: zhangsan.id, roleId: deptHeadRole!.id },
  });
  console.log('  ✓ zhangsan / 张三 / 研发部负责人');

  // lisi / 李四 / budget_manager / 财务部
  const lisi = await prisma.user.upsert({
    where: { username: 'lisi' },
    update: {},
    create: {
      id: 'user-lisi',
      username: 'lisi',
      password: hashedPassword,
      name: '李四',
      email: 'lisi@company.com',
      departmentId: financeDept.id,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: lisi.id, roleId: budgetManagerRole!.id } },
    update: {},
    create: { userId: lisi.id, roleId: budgetManagerRole!.id },
  });
  console.log('  ✓ lisi / 李四 / 预算管理员');

  // wangwu / 王五 / purchaser / 研发部
  const wangwu = await prisma.user.upsert({
    where: { username: 'wangwu' },
    update: {},
    create: {
      id: 'user-wangwu',
      username: 'wangwu',
      password: hashedPassword,
      name: '王五',
      email: 'wangwu@company.com',
      departmentId: rdDept.id,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: wangwu.id, roleId: purchaserRole!.id } },
    update: {},
    create: { userId: wangwu.id, roleId: purchaserRole!.id },
  });
  console.log('  ✓ wangwu / 王五 / 采购员');

  // zhaoliu / 赵六 / viewer / 产品部
  const zhaoliu = await prisma.user.upsert({
    where: { username: 'zhaoliu' },
    update: {},
    create: {
      id: 'user-zhaoliu',
      username: 'zhaoliu',
      password: hashedPassword,
      name: '赵六',
      email: 'zhaoliu@company.com',
      departmentId: productDept.id,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: zhaoliu.id, roleId: viewerRole!.id } },
    update: {},
    create: { userId: zhaoliu.id, roleId: viewerRole!.id },
  });
  console.log('  ✓ zhaoliu / 赵六 / 普通用户');

  // ========== 6. 创建示例预算（2026年）==========
  console.log('\n💰 创建示例预算...');

  // 研发部 CAPEX 预算 500万（APPROVED状态）
  const rdCapexBudget = await prisma.budget.upsert({
    where: { budgetNo: 'BG-2026-RD-CAPEX' },
    update: {},
    create: {
      id: 'budget-rd-capex-2026',
      budgetNo: 'BG-2026-RD-CAPEX',
      name: '2026年研发部资本支出预算',
      departmentId: rdDept.id,
      type: BudgetType.CAPEX,
      year: 2026,
      totalAmount: 5000000,
      usedAmount: 1200000,
      frozenAmount: 800000,
      status: BudgetStatus.APPROVED,
      creatorId: zhangsan.id,
      remark: '用于研发设备采购、软件授权等资本性支出',
    },
  });

  // 研发部 CAPEX 预算明细
  const rdCapexItems = [
    { name: '开发服务器', category: '服务器设备', specification: 'Dell R750', quantity: 5, unitPrice: 80000 },
    { name: '测试服务器', category: '服务器设备', specification: 'Dell R650', quantity: 3, unitPrice: 60000 },
    { name: '开发工作站', category: '计算机设备', specification: 'Dell Precision 7865', quantity: 10, unitPrice: 35000 },
    { name: '软件授权', category: '软件许可', specification: 'JetBrains全家桶', quantity: 20, unitPrice: 5000 },
    { name: '网络设备', category: '网络设备', specification: 'Cisco交换机', quantity: 2, unitPrice: 45000 },
  ];

  await prisma.budgetItem.deleteMany({ where: { budgetId: rdCapexBudget.id } });
  for (let i = 0; i < rdCapexItems.length; i++) {
    const item = rdCapexItems[i];
    await prisma.budgetItem.create({
      data: {
        budgetId: rdCapexBudget.id,
        name: item.name,
        category: item.category,
        specification: item.specification,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
        usedAmount: i < 2 ? item.quantity * item.unitPrice * 0.5 : 0,
        frozenAmount: i === 2 ? item.quantity * item.unitPrice * 0.3 : 0,
        sortOrder: i,
      },
    });
  }
  console.log('  ✓ 研发部 CAPEX 预算 500万（已批准）');

  // 研发部 OPEX 预算 200万（APPROVED状态）
  const rdOpexBudget = await prisma.budget.upsert({
    where: { budgetNo: 'BG-2026-RD-OPEX' },
    update: {},
    create: {
      id: 'budget-rd-opex-2026',
      budgetNo: 'BG-2026-RD-OPEX',
      name: '2026年研发部运营支出预算',
      departmentId: rdDept.id,
      type: BudgetType.OPEX,
      year: 2026,
      totalAmount: 2000000,
      usedAmount: 450000,
      frozenAmount: 200000,
      status: BudgetStatus.APPROVED,
      creatorId: zhangsan.id,
      remark: '用于云服务、办公用品、培训等运营支出',
    },
  });

  // 研发部 OPEX 预算明细
  const rdOpexItems = [
    { name: '云服务器租赁', category: '云服务', specification: '阿里云ECS', quantity: 12, unitPrice: 15000 },
    { name: '云数据库服务', category: '云服务', specification: '阿里云RDS', quantity: 12, unitPrice: 8000 },
    { name: '技术培训', category: '培训费', specification: '技术大会门票', quantity: 30, unitPrice: 3000 },
    { name: '办公用品', category: '办公用品', specification: '文具耗材', quantity: 1, unitPrice: 50000 },
  ];

  await prisma.budgetItem.deleteMany({ where: { budgetId: rdOpexBudget.id } });
  for (let i = 0; i < rdOpexItems.length; i++) {
    const item = rdOpexItems[i];
    await prisma.budgetItem.create({
      data: {
        budgetId: rdOpexBudget.id,
        name: item.name,
        category: item.category,
        specification: item.specification,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
        usedAmount: i < 2 ? item.quantity * item.unitPrice * 0.4 : 0,
        frozenAmount: i === 2 ? item.quantity * item.unitPrice * 0.2 : 0,
        sortOrder: i,
      },
    });
  }
  console.log('  ✓ 研发部 OPEX 预算 200万（已批准）');

  // 产品部 CAPEX 预算 300万（PENDING状态）
  const productCapexBudget = await prisma.budget.upsert({
    where: { budgetNo: 'BG-2026-PD-CAPEX' },
    update: {},
    create: {
      id: 'budget-pd-capex-2026',
      budgetNo: 'BG-2026-PD-CAPEX',
      name: '2026年产品部资本支出预算',
      departmentId: productDept.id,
      type: BudgetType.CAPEX,
      year: 2026,
      totalAmount: 3000000,
      usedAmount: 0,
      frozenAmount: 0,
      status: BudgetStatus.PENDING,
      creatorId: zhaoliu.id,
      remark: '用于产品设计工具、原型设备等',
    },
  });

  // 产品部 CAPEX 预算明细
  const productCapexItems = [
    { name: '设计工作站', category: '计算机设备', specification: 'Mac Studio', quantity: 8, unitPrice: 45000 },
    { name: '显示器', category: '显示设备', specification: 'Apple Studio Display', quantity: 8, unitPrice: 12000 },
    { name: '设计软件', category: '软件许可', specification: 'Adobe Creative Cloud', quantity: 10, unitPrice: 6000 },
    { name: '原型设备', category: '测试设备', specification: '手机平板测试机', quantity: 20, unitPrice: 8000 },
    { name: '用户研究设备', category: '研究设备', specification: '眼动仪等', quantity: 1, unitPrice: 150000 },
  ];

  await prisma.budgetItem.deleteMany({ where: { budgetId: productCapexBudget.id } });
  for (let i = 0; i < productCapexItems.length; i++) {
    const item = productCapexItems[i];
    await prisma.budgetItem.create({
      data: {
        budgetId: productCapexBudget.id,
        name: item.name,
        category: item.category,
        specification: item.specification,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
        usedAmount: 0,
        frozenAmount: 0,
        sortOrder: i,
      },
    });
  }
  console.log('  ✓ 产品部 CAPEX 预算 300万（审批中）');

  // ========== 7. 创建审批流程模板 ==========
  console.log('\n📋 创建审批流程模板...');

  // 预算审批流程
  await prisma.workflowTemplate.upsert({
    where: { id: 'wf-budget-approval' },
    update: {
      steps: {
        steps: [
          { order: 1, name: '部门负责人审批', role: 'dept_head', parallel: false },
          { order: 2, name: '预算管理员审批', role: 'budget_manager', parallel: false },
          { order: 3, name: '财务审批', role: 'finance', parallel: false, condition: { minAmount: 1000000 } },
          { order: 4, name: '总经理审批', role: 'admin', parallel: false, condition: { minAmount: 5000000 } },
        ],
      },
    },
    create: {
      id: 'wf-budget-approval',
      name: '预算审批流程',
      type: 'BUDGET_APPROVAL',
      steps: {
        steps: [
          { order: 1, name: '部门负责人审批', role: 'dept_head', parallel: false },
          { order: 2, name: '预算管理员审批', role: 'budget_manager', parallel: false },
          { order: 3, name: '财务审批', role: 'finance', parallel: false, condition: { minAmount: 1000000 } },
          { order: 4, name: '总经理审批', role: 'admin', parallel: false, condition: { minAmount: 5000000 } },
        ],
      },
      conditions: {
        autoApprove: { maxAmount: 10000 },
        requireFinance: { minAmount: 1000000 },
        requireCEO: { minAmount: 5000000 },
      },
      isActive: true,
      version: 1,
    },
  });
  console.log('  ✓ 预算审批流程');

  // 采购审批流程
  await prisma.workflowTemplate.upsert({
    where: { id: 'wf-purchase-approval' },
    update: {
      steps: {
        steps: [
          { order: 1, name: '部门负责人审批', role: 'dept_head', parallel: false },
          { order: 2, name: '预算管理员审批', role: 'budget_manager', parallel: false },
          { order: 3, name: '财务审批', role: 'finance', parallel: false, condition: { minAmount: 50000 } },
          { order: 4, name: '总经理审批', role: 'admin', parallel: false, condition: { minAmount: 500000 } },
        ],
      },
    },
    create: {
      id: 'wf-purchase-approval',
      name: '采购审批流程',
      type: 'PURCHASE_APPROVAL',
      steps: {
        steps: [
          { order: 1, name: '部门负责人审批', role: 'dept_head', parallel: false },
          { order: 2, name: '预算管理员审批', role: 'budget_manager', parallel: false },
          { order: 3, name: '财务审批', role: 'finance', parallel: false, condition: { minAmount: 50000 } },
          { order: 4, name: '总经理审批', role: 'admin', parallel: false, condition: { minAmount: 500000 } },
        ],
      },
      conditions: {
        autoApprove: { maxAmount: 5000 },
        requireFinance: { minAmount: 50000 },
        requireCEO: { minAmount: 500000 },
      },
      isActive: true,
      version: 1,
    },
  });
  console.log('  ✓ 采购审批流程');

  // 调整审批流程
  await prisma.workflowTemplate.upsert({
    where: { id: 'wf-adjustment-approval' },
    update: {
      steps: {
        steps: [
          { order: 1, name: '部门负责人审批', role: 'dept_head', parallel: false },
          { order: 2, name: '预算管理员审批', role: 'budget_manager', parallel: false },
          { order: 3, name: '财务审批', role: 'finance', parallel: false },
          { order: 4, name: '总经理审批', role: 'admin', parallel: false, condition: { minAmount: 1000000 } },
        ],
      },
    },
    create: {
      id: 'wf-adjustment-approval',
      name: '预算调整审批流程',
      type: 'ADJUSTMENT_APPROVAL',
      steps: {
        steps: [
          { order: 1, name: '部门负责人审批', role: 'dept_head', parallel: false },
          { order: 2, name: '预算管理员审批', role: 'budget_manager', parallel: false },
          { order: 3, name: '财务审批', role: 'finance', parallel: false },
          { order: 4, name: '总经理审批', role: 'admin', parallel: false, condition: { minAmount: 1000000 } },
        ],
      },
      conditions: {
        requireFinance: true,
        requireCEO: { minAmount: 1000000 },
      },
      isActive: true,
      version: 1,
    },
  });
  console.log('  ✓ 预算调整审批流程');

  // ========== 完成 ==========
  console.log('\n' + '='.repeat(50));
  console.log('✅ 种子数据初始化完成！');
  console.log('='.repeat(50));
  console.log('\n📊 默认账号（密码统一: password123）：');
  console.log('  ┌─────────────┬─────────────┬─────────────────┐');
  console.log('  │ 用户名      │ 姓名        │ 角色            │');
  console.log('  ├─────────────┼─────────────┼─────────────────┤');
  console.log('  │ admin       │ 系统管理员  │ admin           │');
  console.log('  │ zhangsan    │ 张三        │ dept_head       │');
  console.log('  │ lisi        │ 李四        │ budget_manager  │');
  console.log('  │ wangwu      │ 王五        │ purchaser       │');
  console.log('  │ zhaoliu     │ 赵六        │ viewer          │');
  console.log('  └─────────────┴─────────────┴─────────────────┘');
  console.log('\n💰 示例预算：');
  console.log('  • 研发部 CAPEX 预算 500万（已批准）');
  console.log('  • 研发部 OPEX 预算 200万（已批准）');
  console.log('  • 产品部 CAPEX 预算 300万（审批中）');
  console.log('\n📋 审批流程模板：');
  console.log('  • 预算审批流程');
  console.log('  • 采购审批流程');
  console.log('  • 预算调整审批流程');
  console.log('');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
