import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // 1. 创建默认部门
  const defaultDept = await prisma.department.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: '默认部门',
      code: 'DEFAULT',
      level: 1,
      status: 'ACTIVE',
    },
  });
  console.log('创建默认部门:', defaultDept.name);

  // 2. 创建角色
  const roles = [
    { name: 'admin', displayName: '系统管理员', description: '拥有所有权限', isSystem: true },
    { name: 'budget_manager', displayName: '预算管理员', description: '预算管理权限', isSystem: true },
    { name: 'dept_head', displayName: '部门负责人', description: '部门管理权限', isSystem: true },
    { name: 'finance', displayName: '财务人员', description: '财务审批权限', isSystem: true },
    { name: 'purchaser', displayName: '采购员', description: '采购申请权限', isSystem: true },
    { name: 'viewer', displayName: '普通用户', description: '查看权限', isSystem: true },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`创建角色：${roleData.displayName}`);
  }

  // 3. 创建权限
  const permissions = [
    // 预算权限
    { module: 'budget', action: 'create', name: 'budget.create' },
    { module: 'budget', action: 'read', name: 'budget.read' },
    { module: 'budget', action: 'update', name: 'budget.update' },
    { module: 'budget', action: 'delete', name: 'budget.delete' },
    { module: 'budget', action: 'approve', name: 'budget.approve' },
    { module: 'budget', action: 'export', name: 'budget.export' },
    
    // 采购权限
    { module: 'purchase', action: 'create', name: 'purchase.create' },
    { module: 'purchase', action: 'read', name: 'purchase.read' },
    { module: 'purchase', action: 'update', name: 'purchase.update' },
    { module: 'purchase', action: 'delete', name: 'purchase.delete' },
    { module: 'purchase', action: 'approve', name: 'purchase.approve' },
    { module: 'purchase', action: 'export', name: 'purchase.export' },
    
    // 审批权限
    { module: 'approval', action: 'read', name: 'approval.read' },
    { module: 'approval', action: 'approve', name: 'approval.approve' },
    
    // 报表权限
    { module: 'report', action: 'read', name: 'report.read' },
    { module: 'report', action: 'export', name: 'report.export' },
    
    // 系统权限
    { module: 'system', action: 'user.manage', name: 'system.user.manage' },
    { module: 'system', action: 'role.manage', name: 'system.role.manage' },
    { module: 'system', action: 'config', name: 'system.config' },
    { module: 'system', action: 'audit', name: 'system.audit' },
  ];

  for (const permData of permissions) {
    await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: permData,
    });
  }
  console.log(`创建 ${permissions.length} 个权限`);

  // 4. 为角色分配权限
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
    include: { permissions: true },
  });

  if (adminRole && adminRole.permissions.length === 0) {
    const allPermissions = await prisma.permission.findMany();
    await Promise.all(
      allPermissions.map(p => 
        prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: p.id,
          },
        })
      )
    );
    console.log('为管理员角色分配所有权限');
  }

  // 5. 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      email: 'admin@example.com',
      departmentId: defaultDept.id,
      status: 'ACTIVE',
    },
  });

  // 6. 为管理员分配角色
  const adminRoleData = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (adminRoleData) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRoleData.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRoleData.id,
      },
    });
  }

  console.log('创建默认管理员用户：admin / admin123');
  console.log('种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
