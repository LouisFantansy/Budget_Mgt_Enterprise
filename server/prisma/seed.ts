import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // 创建测试部门
  const headquarters = await prisma.department.upsert({
    where: { id: 'dept-headquarters' },
    update: {},
    create: {
      id: 'dept-headquarters',
      name: '总部',
      code: 'HQ',
      level: 1,
      status: 'ACTIVE',
    },
  });

  const itDept = await prisma.department.upsert({
    where: { id: 'dept-it' },
    update: {},
    create: {
      id: 'dept-it',
      name: '信息技术部',
      code: 'IT',
      level: 2,
      parentId: headquarters.id,
      status: 'ACTIVE',
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { id: 'dept-finance' },
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

  console.log('✓ 部门数据创建完成');

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      email: 'admin@example.com',
      departmentId: headquarters.id,
      status: 'ACTIVE',
    },
  });

  console.log('✓ 管理员账号创建完成');

  // 创建测试预算
  const budget = await prisma.budget.upsert({
    where: { budgetNo: 'BG-2026-001' },
    update: {},
    create: {
      budgetNo: 'BG-2026-001',
      name: '2026 年度 IT 设备采购预算',
      departmentId: itDept.id,
      type: 'CAPEX',
      year: 2026,
      totalAmount: 500000,
      usedAmount: 0,
      frozenAmount: 0,
      status: 'APPROVED',
      creatorId: admin.id,
    },
  });

  console.log('✓ 测试预算创建完成');

  console.log('\n种子数据初始化完成！');
  console.log('\n默认管理员账号:');
  console.log('  用户名：admin');
  console.log('  密码：admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
