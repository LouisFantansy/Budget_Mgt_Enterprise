import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Organization } from '../../master/entities/organization.entity';
import { BudgetAccount } from '../../master/entities/budget-account.entity';
import { IpdProject } from '../../master/entities/ipd-project.entity';
import { Budget, BudgetItem } from '../../budget/entities/budget.entity';

// ID映射：逻辑名 -> UUID
const idMap: Record<string, string> = {};
function getId(key: string): string {
  if (!idMap[key]) idMap[key] = uuidv4();
  return idMap[key];
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(BudgetAccount)
    private accountRepository: Repository<BudgetAccount>,
    @InjectRepository(IpdProject)
    private projectRepository: Repository<IpdProject>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
  ) {}

  async onModuleInit() {
    const userCount = await this.userRepository.count();
    const budgetCount = await this.budgetRepository.count();
    if (userCount > 1 && budgetCount > 0) {
      this.logger.log('数据已存在，跳过种子初始化');
      return;
    }
    await this.seed();
  }

  private async seed() {
    this.logger.log('开始种子数据初始化...');
    const passwordHash = await bcrypt.hash('123456', 10);

    try {
      await this.seedOrganizations();
      await this.seedBudgetAccounts();
      await this.seedProjects();
      await this.seedUsers(passwordHash);
      await this.seedBudgets();

      this.logger.log('种子数据初始化完成！');
    } catch (error) {
      this.logger.error('种子数据初始化失败:', error);
    }
  }

  private async seedOrganizations() {
    const orgs = [
      { key: 'org-root', code: 'ORG000', name: '半导体研发集团', parentKey: null, orgLevel: 1, costCenter: 'CC000' },
      { key: 'org-rd', code: 'ORG100', name: '研发中心', parentKey: 'org-root', orgLevel: 2, costCenter: 'CC100' },
      { key: 'org-ops', code: 'ORG200', name: '运营中心', parentKey: 'org-root', orgLevel: 2, costCenter: 'CC200' },
      { key: 'org-finance', code: 'ORG300', name: '财务中心', parentKey: 'org-root', orgLevel: 2, costCenter: 'CC300' },
      { key: 'org-hr', code: 'ORG400', name: '人力资源部', parentKey: 'org-root', orgLevel: 2, costCenter: 'CC400' },
      { key: 'org-proc', code: 'ORG500', name: '采购中心', parentKey: 'org-root', orgLevel: 2, costCenter: 'CC500' },
      { key: 'org-rd-chip', code: 'ORG110', name: '芯片设计部', parentKey: 'org-rd', orgLevel: 3, costCenter: 'CC110' },
      { key: 'org-rd-soft', code: 'ORG120', name: '软件研发部', parentKey: 'org-rd', orgLevel: 3, costCenter: 'CC120' },
      { key: 'org-rd-test', code: 'ORG130', name: '测试验证部', parentKey: 'org-rd', orgLevel: 3, costCenter: 'CC130' },
      { key: 'org-rd-arch', code: 'ORG140', name: '架构设计部', parentKey: 'org-rd', orgLevel: 3, costCenter: 'CC140' },
      { key: 'org-ops-fab', code: 'ORG210', name: '制造运营部', parentKey: 'org-ops', orgLevel: 3, costCenter: 'CC210' },
      { key: 'org-ops-qual', code: 'ORG220', name: '质量管理部', parentKey: 'org-ops', orgLevel: 3, costCenter: 'CC220' },
      { key: 'org-finance-gl', code: 'ORG310', name: '总账组', parentKey: 'org-finance', orgLevel: 3, costCenter: 'CC310' },
      { key: 'org-finance-bp', code: 'ORG320', name: '业务伙伴组', parentKey: 'org-finance', orgLevel: 3, costCenter: 'CC320' },
      { key: 'org-proc-direct', code: 'ORG510', name: '直接采购组', parentKey: 'org-proc', orgLevel: 3, costCenter: 'CC510' },
      { key: 'org-proc-indirect', code: 'ORG520', name: '间接采购组', parentKey: 'org-proc', orgLevel: 3, costCenter: 'CC520' },
    ];

    for (const org of orgs) {
      const id = getId(org.key);
      const parentId = org.parentKey ? getId(org.parentKey) : null;
      await this.dataSource.query(
        `INSERT INTO organizations (id, code, name, "parentId", parent_id, "orgLevel", "costCenter", status) 
         VALUES ($1, $2, $3, $4, $4, $5, $6, 'active') ON CONFLICT (code) DO NOTHING`,
        [id, org.code, org.name, parentId, org.orgLevel, org.costCenter],
      );
    }
    this.logger.log(`组织架构: ${orgs.length}条`);
  }

  private async seedBudgetAccounts() {
    const accounts = [
      { key: 'acc-cap', code: 'CAP', name: '资本性支出', type: 'CAPEX', parentKey: null, level: 1, leaf: false },
      { key: 'acc-cap-equip', code: 'CAP-01', name: '设备采购', type: 'CAPEX', parentKey: 'acc-cap', level: 2, leaf: false },
      { key: 'acc-cap-equip-prod', code: 'CAP-01-01', name: '生产设备', type: 'CAPEX', parentKey: 'acc-cap-equip', level: 3, leaf: true },
      { key: 'acc-cap-equip-test', code: 'CAP-01-02', name: '测试设备', type: 'CAPEX', parentKey: 'acc-cap-equip', level: 3, leaf: true },
      { key: 'acc-cap-equip-rd', code: 'CAP-01-03', name: '研发设备', type: 'CAPEX', parentKey: 'acc-cap-equip', level: 3, leaf: true },
      { key: 'acc-cap-equip-office', code: 'CAP-01-04', name: '办公设备', type: 'CAPEX', parentKey: 'acc-cap-equip', level: 3, leaf: true },
      { key: 'acc-cap-soft', code: 'CAP-02', name: '软件采购', type: 'CAPEX', parentKey: 'acc-cap', level: 2, leaf: false },
      { key: 'acc-cap-soft-license', code: 'CAP-02-01', name: '软件许可', type: 'CAPEX', parentKey: 'acc-cap-soft', level: 3, leaf: true },
      { key: 'acc-cap-soft-dev', code: 'CAP-02-02', name: '定制开发', type: 'CAPEX', parentKey: 'acc-cap-soft', level: 3, leaf: true },
      { key: 'acc-cap-construct', code: 'CAP-03', name: '工程建设', type: 'CAPEX', parentKey: 'acc-cap', level: 2, leaf: false },
      { key: 'acc-cap-construct-fab', code: 'CAP-03-01', name: '厂房建设', type: 'CAPEX', parentKey: 'acc-cap-construct', level: 3, leaf: true },
      { key: 'acc-cap-construct-deco', code: 'CAP-03-02', name: '装修改造', type: 'CAPEX', parentKey: 'acc-cap-construct', level: 3, leaf: true },
      { key: 'acc-ope', code: 'OPE', name: '运营性支出', type: 'OPEX', parentKey: null, level: 1, leaf: false },
      { key: 'acc-ope-salary', code: 'OPE-01', name: '人员成本', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: false },
      { key: 'acc-ope-salary-base', code: 'OPE-01-01', name: '基本工资', type: 'OPEX', parentKey: 'acc-ope-salary', level: 3, leaf: true },
      { key: 'acc-ope-salary-bonus', code: 'OPE-01-02', name: '绩效奖金', type: 'OPEX', parentKey: 'acc-ope-salary', level: 3, leaf: true },
      { key: 'acc-ope-salary-benefit', code: 'OPE-01-03', name: '福利社保', type: 'OPEX', parentKey: 'acc-ope-salary', level: 3, leaf: true },
      { key: 'acc-ope-mat', code: 'OPE-02', name: '材料成本', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: false },
      { key: 'acc-ope-mat-wafer', code: 'OPE-02-01', name: '晶圆材料', type: 'OPEX', parentKey: 'acc-ope-mat', level: 3, leaf: true },
      { key: 'acc-ope-mat-pack', code: 'OPE-02-02', name: '封装材料', type: 'OPEX', parentKey: 'acc-ope-mat', level: 3, leaf: true },
      { key: 'acc-ope-mat-consum', code: 'OPE-02-03', name: '耗材', type: 'OPEX', parentKey: 'acc-ope-mat', level: 3, leaf: true },
      { key: 'acc-ope-outsrc', code: 'OPE-03', name: '外包服务', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: false },
      { key: 'acc-ope-outsrc-design', code: 'OPE-03-01', name: '设计外包', type: 'OPEX', parentKey: 'acc-ope-outsrc', level: 3, leaf: true },
      { key: 'acc-ope-outsrc-test', code: 'OPE-03-02', name: '测试外包', type: 'OPEX', parentKey: 'acc-ope-outsrc', level: 3, leaf: true },
      { key: 'acc-ope-travel', code: 'OPE-04', name: '差旅费', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: true },
      { key: 'acc-ope-office', code: 'OPE-05', name: '办公费', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: true },
      { key: 'acc-ope-depreciation', code: 'OPE-06', name: '折旧摊销', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: true },
      { key: 'acc-ope-maint', code: 'OPE-07', name: '维修维护', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: true },
      { key: 'acc-ope-train', code: 'OPE-08', name: '培训费', type: 'OPEX', parentKey: 'acc-ope', level: 2, leaf: true },
    ];

    for (const acc of accounts) {
      const id = getId(acc.key);
      const parentId = acc.parentKey ? getId(acc.parentKey) : null;
      await this.dataSource.query(
        `INSERT INTO budget_accounts (id, "accountCode", "accountName", "accountType", "parentId", parent_id, "accountLevel", "isLeaf", status)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'active') ON CONFLICT ("accountCode") DO NOTHING`,
        [id, acc.code, acc.name, acc.type, parentId, acc.level, acc.leaf],
      );
    }
    this.logger.log(`预算科目: ${accounts.length}条`);
  }

  private async seedProjects() {
    const projects = [
      { key: 'proj-7nm', code: 'IPD-001', name: '7nm先进工艺开发', type: '研发', status: 'ongoing', start: '2024-01-01', end: '2026-12-31', budget: 15000000 },
      { key: 'proj-5nm', code: 'IPD-002', name: '5nm工艺预研', type: '研发', status: 'planning', start: '2025-06-01', end: '2027-12-31', budget: 20000000 },
      { key: 'proj-ai-chip', code: 'IPD-003', name: 'AI加速芯片设计', type: '研发', status: 'ongoing', start: '2024-06-01', end: '2026-06-30', budget: 8000000 },
      { key: 'proj-riscv', code: 'IPD-004', name: 'RISC-V处理器', type: '研发', status: 'ongoing', start: '2024-03-01', end: '2026-03-31', budget: 6000000 },
      { key: 'proj-eda', code: 'IPD-005', name: 'EDA工具升级', type: 'IT', status: 'ongoing', start: '2025-01-01', end: '2025-12-31', budget: 3000000 },
      { key: 'proj-fab-ext', code: 'IPD-006', name: '产线扩产项目', type: '基建', status: 'ongoing', start: '2024-06-01', end: '2025-12-31', budget: 25000000 },
      { key: 'proj-qual', code: 'IPD-007', name: '质量体系升级', type: '管理', status: 'planning', start: '2025-03-01', end: '2025-12-31', budget: 2000000 },
      { key: 'proj-digital', code: 'IPD-008', name: '数字化转型', type: 'IT', status: 'ongoing', start: '2025-01-01', end: '2026-06-30', budget: 5000000 },
      { key: 'proj-auto', code: 'IPD-009', name: '自动化测试平台', type: '研发', status: 'ongoing', start: '2024-09-01', end: '2025-09-30', budget: 3500000 },
      { key: 'proj-pkg', code: 'IPD-010', name: '先进封装研发', type: '研发', status: 'planning', start: '2025-06-01', end: '2027-06-30', budget: 12000000 },
    ];

    for (const p of projects) {
      const id = getId(p.key);
      await this.dataSource.query(
        `INSERT INTO ipd_projects (id, "projectCode", "projectName", "projectType", status, "startDate", "endDate", "budgetAmount")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT ("projectCode") DO NOTHING`,
        [id, p.code, p.name, p.type, p.status, p.start, p.end, p.budget],
      );
    }
    this.logger.log(`IPD项目: ${projects.length}条`);
  }

  private async seedUsers(passwordHash: string) {
    const users = [
      { key: 'user-sysadmin1', username: 'sysadmin', realName: '张建国', email: 'zhang.jianguo@semi.com', phone: '13800000001', deptKey: 'org-finance', roleCode: 'ADMIN' },
      { key: 'user-sysadmin2', username: 'sysadmin2', realName: '李明辉', email: 'li.minghui@semi.com', phone: '13800000002', deptKey: 'org-finance', roleCode: 'ADMIN' },
      { key: 'user-sysadmin3', username: 'sysadmin3', realName: '王志强', email: 'wang.zhiqiang@semi.com', phone: '13800000003', deptKey: 'org-finance', roleCode: 'ADMIN' },
      { key: 'user-budgetadmin1', username: 'budgetadmin', realName: '陈预算', email: 'chen.yusuan@semi.com', phone: '13800000010', deptKey: 'org-finance-bp', roleCode: 'BUDGET_ADMIN' },
      { key: 'user-budgetadmin2', username: 'budgetadmin2', realName: '刘规划', email: 'liu.guihua@semi.com', phone: '13800000011', deptKey: 'org-finance-bp', roleCode: 'BUDGET_ADMIN' },
      { key: 'user-budgetadmin3', username: 'budgetadmin3', realName: '赵分析', email: 'zhao.fenxi@semi.com', phone: '13800000012', deptKey: 'org-finance-bp', roleCode: 'BUDGET_ADMIN' },
      { key: 'user-depthead1', username: 'depthead', realName: '孙部长', email: 'sun.buzhang@semi.com', phone: '13800000020', deptKey: 'org-rd', roleCode: 'DEPT_HEAD' },
      { key: 'user-depthead2', username: 'depthead2', realName: '周主任', email: 'zhou.zhuren@semi.com', phone: '13800000021', deptKey: 'org-rd-chip', roleCode: 'DEPT_HEAD' },
      { key: 'user-depthead3', username: 'depthead3', realName: '吴经理', email: 'wu.jingli@semi.com', phone: '13800000022', deptKey: 'org-ops', roleCode: 'DEPT_HEAD' },
      { key: 'user-finance1', username: 'finance', realName: '郑财务', email: 'zheng.caiwu@semi.com', phone: '13800000030', deptKey: 'org-finance-gl', roleCode: 'FINANCE' },
      { key: 'user-finance2', username: 'finance2', realName: '冯会计', email: 'feng.kuaiji@semi.com', phone: '13800000031', deptKey: 'org-finance-gl', roleCode: 'FINANCE' },
      { key: 'user-finance3', username: 'finance3', realName: '蒋出纳', email: 'jiang.chuna@semi.com', phone: '13800000032', deptKey: 'org-finance-bp', roleCode: 'FINANCE' },
      { key: 'user-user1', username: 'user01', realName: '钱研发', email: 'qian.yanfa@semi.com', phone: '13800000040', deptKey: 'org-rd-chip', roleCode: 'USER' },
      { key: 'user-user2', username: 'user02', realName: '韩测试', email: 'han.ceshi@semi.com', phone: '13800000041', deptKey: 'org-rd-test', roleCode: 'USER' },
      { key: 'user-user3', username: 'user03', realName: '杨运营', email: 'yang.yunying@semi.com', phone: '13800000042', deptKey: 'org-ops-fab', roleCode: 'USER' },
    ];

    for (const u of users) {
      const id = getId(u.key);
      const deptId = getId(u.deptKey);
      await this.dataSource.query(
        `INSERT INTO users (id, username, password, real_name, email, phone, department_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') ON CONFLICT (username) DO NOTHING`,
        [id, u.username, passwordHash, u.realName, u.email, u.phone, deptId],
      );
      await this.dataSource.query(
        `INSERT INTO user_roles (user_id, role_id) 
         SELECT $1, r.id FROM roles r WHERE r.role_code = $2
         ON CONFLICT DO NOTHING`,
        [id, u.roleCode],
      );
    }

    // 创建admin用户（如果不存在）
    const adminId = getId('user-admin');
    const adminDeptId = getId('org-finance');
    await this.dataSource.query(
      `INSERT INTO users (id, username, password, real_name, email, phone, department_id, status)
       VALUES ($1, 'admin', $2, '超级管理员', 'admin@semi.com', '13800000000', $3, 'active') ON CONFLICT (username) DO UPDATE SET password = $2, real_name = '超级管理员', email = 'admin@semi.com'`,
      [adminId, passwordHash, adminDeptId],
    );
    await this.dataSource.query(
      `INSERT INTO user_roles (user_id, role_id) 
       SELECT $1, r.id FROM roles r WHERE r.role_code = 'ADMIN'
       ON CONFLICT DO NOTHING`,
      [adminId],
    );

    this.logger.log(`用户: ${users.length + 1}个 (含admin, 密码: 123456)`);
  }

  private async seedBudgets() {
    const budgets = [
      { key: 'bud-2025-cap-rd', year: 2025, type: 'CAPEX', orgKey: 'org-rd', status: 'approved', desc: '2025年度研发中心CAPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2025-ope-rd', year: 2025, type: 'OPEX', orgKey: 'org-rd', status: 'approved', desc: '2025年度研发中心OPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2025-cap-ops', year: 2025, type: 'CAPEX', orgKey: 'org-ops', status: 'approved', desc: '2025年度运营中心CAPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2025-ope-ops', year: 2025, type: 'OPEX', orgKey: 'org-ops', status: 'approved', desc: '2025年度运营中心OPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2025-cap-fin', year: 2025, type: 'CAPEX', orgKey: 'org-finance', status: 'approved', desc: '2025年度财务中心CAPEX预算', creatorKey: 'user-budgetadmin2' },
      { key: 'bud-2025-ope-fin', year: 2025, type: 'OPEX', orgKey: 'org-finance', status: 'approved', desc: '2025年度财务中心OPEX预算', creatorKey: 'user-budgetadmin2' },
      { key: 'bud-2025-cap-proc', year: 2025, type: 'CAPEX', orgKey: 'org-proc', status: 'submitted', desc: '2025年度采购中心CAPEX预算', creatorKey: 'user-budgetadmin2' },
      { key: 'bud-2025-ope-proc', year: 2025, type: 'OPEX', orgKey: 'org-proc', status: 'draft', desc: '2025年度采购中心OPEX预算', creatorKey: 'user-budgetadmin2' },
      { key: 'bud-2026-cap-rd', year: 2026, type: 'CAPEX', orgKey: 'org-rd', status: 'approved', desc: '2026年度研发中心CAPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2026-ope-rd', year: 2026, type: 'OPEX', orgKey: 'org-rd', status: 'submitted', desc: '2026年度研发中心OPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2026-cap-ops', year: 2026, type: 'CAPEX', orgKey: 'org-ops', status: 'draft', desc: '2026年度运营中心CAPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2026-ope-ops', year: 2026, type: 'OPEX', orgKey: 'org-ops', status: 'approved', desc: '2026年度运营中心OPEX预算', creatorKey: 'user-budgetadmin1' },
      { key: 'bud-2026-cap-hr', year: 2026, type: 'CAPEX', orgKey: 'org-hr', status: 'draft', desc: '2026年度人力资源部CAPEX预算', creatorKey: 'user-budgetadmin3' },
      { key: 'bud-2026-ope-hr', year: 2026, type: 'OPEX', orgKey: 'org-hr', status: 'approved', desc: '2026年度人力资源部OPEX预算', creatorKey: 'user-budgetadmin3' },
    ];

    for (const b of budgets) {
      const id = getId(b.key);
      const orgId = getId(b.orgKey);
      const createdBy = getId(b.creatorKey);
      await this.dataSource.query(
        `INSERT INTO budgets (id, "budgetYear", "budgetType", "organizationId", organization_id, status, version, "totalAmount", description, "createdBy")
         VALUES ($1, $2, $3, $4, $4, $5, 'V1.0', 0, $6, $7) ON CONFLICT DO NOTHING`,
        [id, b.year, b.type, orgId, b.status, b.desc, createdBy],
      );
    }

    // 预算明细 (100条)
    const items = this.generateBudgetItems();
    for (const item of items) {
      const id = uuidv4();
      const budgetId = getId(item.budgetKey);
      const accountId = getId(item.accountKey);
      const deptId = getId(item.deptKey);
      const projectId = item.projectKey ? getId(item.projectKey) : null;
      await this.dataSource.query(
        `INSERT INTO budget_items (id, "budgetId", budget_id, "accountId", "departmentId", department_id, "projectId", "budgetAmount", "prCommittedAmount", "poCommittedAmount", "actualSettledAmount", "executedAmount", "remainingAmount", remark)
         VALUES ($1, $2, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT DO NOTHING`,
        [id, budgetId, accountId, deptId, projectId, item.budgetAmount, item.prAmount, item.poAmount, item.actualAmount, item.executedAmount, item.remainingAmount, item.remark],
      );
    }

    // 更新预算总额
    await this.dataSource.query(
      `UPDATE budgets b SET "totalAmount" = (SELECT COALESCE(SUM(bi."budgetAmount"), 0) FROM budget_items bi WHERE bi."budgetId" = b.id)`,
    );

    // 更新审批信息
    const approverId = getId('user-depthead1');
    await this.dataSource.query(
      `UPDATE budgets SET "approvedBy" = $1, "approvedAt" = NOW() WHERE status = 'approved'`,
      [approverId],
    );

    this.logger.log(`预算: ${budgets.length}个主表, ${items.length}条明细`);
  }

  private generateBudgetItems() {
    return [
      // 2025 CAPEX 研发中心 (10条)
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-prod', deptKey: 'org-rd-chip', projectKey: 'proj-7nm', budgetAmount: 3000000, prAmount: 2400000, poAmount: 2200000, actualAmount: 1800000, executedAmount: 2400000, remainingAmount: 600000, remark: '7nm工艺生产设备' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-test', deptKey: 'org-rd-test', projectKey: 'proj-7nm', budgetAmount: 1500000, prAmount: 1200000, poAmount: 1100000, actualAmount: 900000, executedAmount: 1200000, remainingAmount: 300000, remark: '7nm测试设备采购' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-rd', deptKey: 'org-rd-chip', projectKey: 'proj-ai-chip', budgetAmount: 2000000, prAmount: 1600000, poAmount: 1500000, actualAmount: 1200000, executedAmount: 1600000, remainingAmount: 400000, remark: 'AI芯片研发设备' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-rd', deptKey: 'org-rd-soft', projectKey: 'proj-riscv', budgetAmount: 800000, prAmount: 600000, poAmount: 550000, actualAmount: 400000, executedAmount: 600000, remainingAmount: 200000, remark: 'RISC-V开发设备' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-soft-license', deptKey: 'org-rd-chip', projectKey: 'proj-eda', budgetAmount: 2500000, prAmount: 2500000, poAmount: 2500000, actualAmount: 2500000, executedAmount: 2500000, remainingAmount: 0, remark: 'EDA工具许可' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-soft-dev', deptKey: 'org-rd-soft', projectKey: 'proj-digital', budgetAmount: 500000, prAmount: 300000, poAmount: 250000, actualAmount: 150000, executedAmount: 300000, remainingAmount: 200000, remark: '定制软件开发' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-prod', deptKey: 'org-rd-chip', projectKey: 'proj-5nm', budgetAmount: 4000000, prAmount: 1000000, poAmount: 800000, actualAmount: 500000, executedAmount: 1000000, remainingAmount: 3000000, remark: '5nm预研设备' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-test', deptKey: 'org-rd-test', projectKey: 'proj-auto', budgetAmount: 1200000, prAmount: 900000, poAmount: 850000, actualAmount: 700000, executedAmount: 900000, remainingAmount: 300000, remark: '自动化测试设备' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-equip-office', deptKey: 'org-rd-arch', projectKey: null, budgetAmount: 300000, prAmount: 250000, poAmount: 230000, actualAmount: 200000, executedAmount: 250000, remainingAmount: 50000, remark: '架构部办公设备' },
      { budgetKey: 'bud-2025-cap-rd', accountKey: 'acc-cap-soft-license', deptKey: 'org-rd-soft', projectKey: null, budgetAmount: 200000, prAmount: 200000, poAmount: 200000, actualAmount: 200000, executedAmount: 200000, remainingAmount: 0, remark: '开发工具许可' },
      // 2025 OPEX 研发中心 (12条)
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-chip', projectKey: null, budgetAmount: 5000000, prAmount: 5000000, poAmount: 5000000, actualAmount: 5000000, executedAmount: 5000000, remainingAmount: 0, remark: '芯片设计部基本工资' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-soft', projectKey: null, budgetAmount: 3500000, prAmount: 3500000, poAmount: 3500000, actualAmount: 3500000, executedAmount: 3500000, remainingAmount: 0, remark: '软件研发部基本工资' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-test', projectKey: null, budgetAmount: 2500000, prAmount: 2500000, poAmount: 2500000, actualAmount: 2500000, executedAmount: 2500000, remainingAmount: 0, remark: '测试验证部基本工资' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-rd', projectKey: null, budgetAmount: 2000000, prAmount: 1500000, poAmount: 1400000, actualAmount: 1200000, executedAmount: 1500000, remainingAmount: 500000, remark: '研发中心绩效奖金' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-rd', projectKey: null, budgetAmount: 3000000, prAmount: 3000000, poAmount: 3000000, actualAmount: 3000000, executedAmount: 3000000, remainingAmount: 0, remark: '研发中心福利社保' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-mat-wafer', deptKey: 'org-rd-chip', projectKey: 'proj-7nm', budgetAmount: 4000000, prAmount: 3200000, poAmount: 3000000, actualAmount: 2500000, executedAmount: 3200000, remainingAmount: 800000, remark: '7nm晶圆材料' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-mat-consum', deptKey: 'org-rd-test', projectKey: null, budgetAmount: 800000, prAmount: 600000, poAmount: 550000, actualAmount: 450000, executedAmount: 600000, remainingAmount: 200000, remark: '测试耗材' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-outsrc-design', deptKey: 'org-rd-chip', projectKey: 'proj-5nm', budgetAmount: 1500000, prAmount: 1000000, poAmount: 900000, actualAmount: 700000, executedAmount: 1000000, remainingAmount: 500000, remark: '5nm设计外包' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-outsrc-test', deptKey: 'org-rd-test', projectKey: 'proj-auto', budgetAmount: 600000, prAmount: 400000, poAmount: 350000, actualAmount: 250000, executedAmount: 400000, remainingAmount: 200000, remark: '测试外包' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-travel', deptKey: 'org-rd', projectKey: null, budgetAmount: 500000, prAmount: 350000, poAmount: 320000, actualAmount: 280000, executedAmount: 350000, remainingAmount: 150000, remark: '研发差旅费' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-office', deptKey: 'org-rd', projectKey: null, budgetAmount: 300000, prAmount: 250000, poAmount: 240000, actualAmount: 200000, executedAmount: 250000, remainingAmount: 50000, remark: '研发办公费' },
      { budgetKey: 'bud-2025-ope-rd', accountKey: 'acc-ope-depreciation', deptKey: 'org-rd', projectKey: null, budgetAmount: 1800000, prAmount: 1800000, poAmount: 1800000, actualAmount: 1800000, executedAmount: 1800000, remainingAmount: 0, remark: '研发设备折旧' },
      // 2025 CAPEX 运营中心 (8条)
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-equip-prod', deptKey: 'org-ops-fab', projectKey: 'proj-fab-ext', budgetAmount: 8000000, prAmount: 6000000, poAmount: 5500000, actualAmount: 4000000, executedAmount: 6000000, remainingAmount: 2000000, remark: '产线扩产设备' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-equip-test', deptKey: 'org-ops-qual', projectKey: null, budgetAmount: 1000000, prAmount: 800000, poAmount: 750000, actualAmount: 600000, executedAmount: 800000, remainingAmount: 200000, remark: '质量检测设备' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-construct-fab', deptKey: 'org-ops-fab', projectKey: 'proj-fab-ext', budgetAmount: 5000000, prAmount: 4000000, poAmount: 3800000, actualAmount: 3000000, executedAmount: 4000000, remainingAmount: 1000000, remark: '厂房建设' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-construct-deco', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 500000, prAmount: 400000, poAmount: 380000, actualAmount: 300000, executedAmount: 400000, remainingAmount: 100000, remark: '车间改造' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-equip-rd', deptKey: 'org-ops-fab', projectKey: 'proj-7nm', budgetAmount: 2000000, prAmount: 1500000, poAmount: 1400000, actualAmount: 1000000, executedAmount: 1500000, remainingAmount: 500000, remark: '制程研发设备' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-soft-license', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 800000, prAmount: 800000, poAmount: 800000, actualAmount: 800000, executedAmount: 800000, remainingAmount: 0, remark: 'MES系统许可' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-equip-prod', deptKey: 'org-ops-fab', projectKey: 'proj-pkg', budgetAmount: 3000000, prAmount: 500000, poAmount: 400000, actualAmount: 200000, executedAmount: 500000, remainingAmount: 2500000, remark: '封装产线设备' },
      { budgetKey: 'bud-2025-cap-ops', accountKey: 'acc-cap-equip-office', deptKey: 'org-ops-qual', projectKey: null, budgetAmount: 200000, prAmount: 150000, poAmount: 140000, actualAmount: 100000, executedAmount: 150000, remainingAmount: 50000, remark: '质量部办公设备' },
      // 2025 OPEX 运营中心 (10条)
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-salary-base', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 4000000, prAmount: 4000000, poAmount: 4000000, actualAmount: 4000000, executedAmount: 4000000, remainingAmount: 0, remark: '制造运营部工资' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-salary-base', deptKey: 'org-ops-qual', projectKey: null, budgetAmount: 1500000, prAmount: 1500000, poAmount: 1500000, actualAmount: 1500000, executedAmount: 1500000, remainingAmount: 0, remark: '质量管理部工资' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-ops', projectKey: null, budgetAmount: 1200000, prAmount: 900000, poAmount: 850000, actualAmount: 700000, executedAmount: 900000, remainingAmount: 300000, remark: '运营中心奖金' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-ops', projectKey: null, budgetAmount: 2000000, prAmount: 2000000, poAmount: 2000000, actualAmount: 2000000, executedAmount: 2000000, remainingAmount: 0, remark: '运营中心福利' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-mat-wafer', deptKey: 'org-ops-fab', projectKey: 'proj-7nm', budgetAmount: 6000000, prAmount: 5000000, poAmount: 4800000, actualAmount: 4000000, executedAmount: 5000000, remainingAmount: 1000000, remark: '生产晶圆材料' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-mat-pack', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 2000000, prAmount: 1600000, poAmount: 1500000, actualAmount: 1200000, executedAmount: 1600000, remainingAmount: 400000, remark: '封装材料' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-mat-consum', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 1000000, prAmount: 800000, poAmount: 750000, actualAmount: 600000, executedAmount: 800000, remainingAmount: 200000, remark: '生产耗材' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-depreciation', deptKey: 'org-ops', projectKey: null, budgetAmount: 3000000, prAmount: 3000000, poAmount: 3000000, actualAmount: 3000000, executedAmount: 3000000, remainingAmount: 0, remark: '运营设备折旧' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-maint', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 1500000, prAmount: 1200000, poAmount: 1100000, actualAmount: 900000, executedAmount: 1200000, remainingAmount: 300000, remark: '设备维修维护' },
      { budgetKey: 'bud-2025-ope-ops', accountKey: 'acc-ope-office', deptKey: 'org-ops', projectKey: null, budgetAmount: 300000, prAmount: 250000, poAmount: 240000, actualAmount: 200000, executedAmount: 250000, remainingAmount: 50000, remark: '运营办公费' },
      // 2025 CAPEX 财务中心 (3条)
      { budgetKey: 'bud-2025-cap-fin', accountKey: 'acc-cap-equip-office', deptKey: 'org-finance', projectKey: null, budgetAmount: 200000, prAmount: 150000, poAmount: 140000, actualAmount: 100000, executedAmount: 150000, remainingAmount: 50000, remark: '财务办公设备' },
      { budgetKey: 'bud-2025-cap-fin', accountKey: 'acc-cap-soft-license', deptKey: 'org-finance', projectKey: 'proj-digital', budgetAmount: 500000, prAmount: 400000, poAmount: 380000, actualAmount: 300000, executedAmount: 400000, remainingAmount: 100000, remark: 'ERP系统许可' },
      { budgetKey: 'bud-2025-cap-fin', accountKey: 'acc-cap-soft-dev', deptKey: 'org-finance', projectKey: 'proj-digital', budgetAmount: 300000, prAmount: 200000, poAmount: 180000, actualAmount: 120000, executedAmount: 200000, remainingAmount: 100000, remark: '财务系统开发' },
      // 2025 OPEX 财务中心 (5条)
      { budgetKey: 'bud-2025-ope-fin', accountKey: 'acc-ope-salary-base', deptKey: 'org-finance', projectKey: null, budgetAmount: 1800000, prAmount: 1800000, poAmount: 1800000, actualAmount: 1800000, executedAmount: 1800000, remainingAmount: 0, remark: '财务中心工资' },
      { budgetKey: 'bud-2025-ope-fin', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-finance', projectKey: null, budgetAmount: 400000, prAmount: 300000, poAmount: 280000, actualAmount: 200000, executedAmount: 300000, remainingAmount: 100000, remark: '财务中心奖金' },
      { budgetKey: 'bud-2025-ope-fin', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-finance', projectKey: null, budgetAmount: 600000, prAmount: 600000, poAmount: 600000, actualAmount: 600000, executedAmount: 600000, remainingAmount: 0, remark: '财务中心福利' },
      { budgetKey: 'bud-2025-ope-fin', accountKey: 'acc-ope-office', deptKey: 'org-finance', projectKey: null, budgetAmount: 150000, prAmount: 120000, poAmount: 110000, actualAmount: 90000, executedAmount: 120000, remainingAmount: 30000, remark: '财务办公费' },
      { budgetKey: 'bud-2025-ope-fin', accountKey: 'acc-ope-travel', deptKey: 'org-finance', projectKey: null, budgetAmount: 100000, prAmount: 60000, poAmount: 55000, actualAmount: 40000, executedAmount: 60000, remainingAmount: 40000, remark: '财务差旅费' },
      // 2025 CAPEX 采购中心 (3条)
      { budgetKey: 'bud-2025-cap-proc', accountKey: 'acc-cap-equip-office', deptKey: 'org-proc', projectKey: null, budgetAmount: 150000, prAmount: 100000, poAmount: 90000, actualAmount: 60000, executedAmount: 100000, remainingAmount: 50000, remark: '采购办公设备' },
      { budgetKey: 'bud-2025-cap-proc', accountKey: 'acc-cap-soft-license', deptKey: 'org-proc', projectKey: 'proj-digital', budgetAmount: 300000, prAmount: 200000, poAmount: 180000, actualAmount: 120000, executedAmount: 200000, remainingAmount: 100000, remark: 'SRM系统许可' },
      { budgetKey: 'bud-2025-cap-proc', accountKey: 'acc-cap-soft-dev', deptKey: 'org-proc', projectKey: 'proj-digital', budgetAmount: 200000, prAmount: 100000, poAmount: 80000, actualAmount: 50000, executedAmount: 100000, remainingAmount: 100000, remark: '采购系统开发' },
      // 2025 OPEX 采购中心 (4条)
      { budgetKey: 'bud-2025-ope-proc', accountKey: 'acc-ope-salary-base', deptKey: 'org-proc', projectKey: null, budgetAmount: 1200000, prAmount: 1200000, poAmount: 1200000, actualAmount: 1200000, executedAmount: 1200000, remainingAmount: 0, remark: '采购中心工资' },
      { budgetKey: 'bud-2025-ope-proc', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-proc', projectKey: null, budgetAmount: 300000, prAmount: 200000, poAmount: 180000, actualAmount: 150000, executedAmount: 200000, remainingAmount: 100000, remark: '采购中心奖金' },
      { budgetKey: 'bud-2025-ope-proc', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-proc', projectKey: null, budgetAmount: 400000, prAmount: 400000, poAmount: 400000, actualAmount: 400000, executedAmount: 400000, remainingAmount: 0, remark: '采购中心福利' },
      { budgetKey: 'bud-2025-ope-proc', accountKey: 'acc-ope-office', deptKey: 'org-proc', projectKey: null, budgetAmount: 100000, prAmount: 80000, poAmount: 75000, actualAmount: 60000, executedAmount: 80000, remainingAmount: 20000, remark: '采购办公费' },
      // 2026 CAPEX 研发中心 (10条)
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-prod', deptKey: 'org-rd-chip', projectKey: 'proj-5nm', budgetAmount: 6000000, prAmount: 500000, poAmount: 400000, actualAmount: 200000, executedAmount: 500000, remainingAmount: 5500000, remark: '5nm工艺设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-test', deptKey: 'org-rd-test', projectKey: 'proj-5nm', budgetAmount: 2500000, prAmount: 200000, poAmount: 150000, actualAmount: 80000, executedAmount: 200000, remainingAmount: 2300000, remark: '5nm测试设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-rd', deptKey: 'org-rd-chip', projectKey: 'proj-ai-chip', budgetAmount: 2500000, prAmount: 1800000, poAmount: 1700000, actualAmount: 1200000, executedAmount: 1800000, remainingAmount: 700000, remark: 'AI芯片研发设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-rd', deptKey: 'org-rd-soft', projectKey: 'proj-riscv', budgetAmount: 1000000, prAmount: 700000, poAmount: 650000, actualAmount: 500000, executedAmount: 700000, remainingAmount: 300000, remark: 'RISC-V开发设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-soft-license', deptKey: 'org-rd-chip', projectKey: 'proj-eda', budgetAmount: 3000000, prAmount: 3000000, poAmount: 3000000, actualAmount: 1500000, executedAmount: 3000000, remainingAmount: 0, remark: 'EDA工具许可续期' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-soft-dev', deptKey: 'org-rd-soft', projectKey: 'proj-digital', budgetAmount: 800000, prAmount: 400000, poAmount: 350000, actualAmount: 200000, executedAmount: 400000, remainingAmount: 400000, remark: '数字化开发' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-prod', deptKey: 'org-rd-chip', projectKey: 'proj-pkg', budgetAmount: 3500000, prAmount: 1000000, poAmount: 800000, actualAmount: 400000, executedAmount: 1000000, remainingAmount: 2500000, remark: '封装研发设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-test', deptKey: 'org-rd-test', projectKey: 'proj-auto', budgetAmount: 1500000, prAmount: 1000000, poAmount: 950000, actualAmount: 700000, executedAmount: 1000000, remainingAmount: 500000, remark: '自动化测试设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-equip-office', deptKey: 'org-rd-arch', projectKey: null, budgetAmount: 400000, prAmount: 300000, poAmount: 280000, actualAmount: 200000, executedAmount: 300000, remainingAmount: 100000, remark: '架构部设备' },
      { budgetKey: 'bud-2026-cap-rd', accountKey: 'acc-cap-soft-license', deptKey: 'org-rd-soft', projectKey: null, budgetAmount: 300000, prAmount: 250000, poAmount: 230000, actualAmount: 150000, executedAmount: 250000, remainingAmount: 50000, remark: '开发工具许可' },
      // 2026 OPEX 研发中心 (12条)
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-chip', projectKey: null, budgetAmount: 5500000, prAmount: 5500000, poAmount: 5500000, actualAmount: 2750000, executedAmount: 5500000, remainingAmount: 0, remark: '芯片设计部工资' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-soft', projectKey: null, budgetAmount: 4000000, prAmount: 4000000, poAmount: 4000000, actualAmount: 2000000, executedAmount: 4000000, remainingAmount: 0, remark: '软件研发部工资' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-test', projectKey: null, budgetAmount: 2800000, prAmount: 2800000, poAmount: 2800000, actualAmount: 1400000, executedAmount: 2800000, remainingAmount: 0, remark: '测试验证部工资' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-salary-base', deptKey: 'org-rd-arch', projectKey: null, budgetAmount: 1500000, prAmount: 1500000, poAmount: 1500000, actualAmount: 750000, executedAmount: 1500000, remainingAmount: 0, remark: '架构设计部工资' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-rd', projectKey: null, budgetAmount: 2500000, prAmount: 1800000, poAmount: 1700000, actualAmount: 850000, executedAmount: 1800000, remainingAmount: 700000, remark: '研发中心奖金' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-rd', projectKey: null, budgetAmount: 3500000, prAmount: 3500000, poAmount: 3500000, actualAmount: 1750000, executedAmount: 3500000, remainingAmount: 0, remark: '研发中心福利' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-mat-wafer', deptKey: 'org-rd-chip', projectKey: 'proj-5nm', budgetAmount: 5000000, prAmount: 2000000, poAmount: 1800000, actualAmount: 900000, executedAmount: 2000000, remainingAmount: 3000000, remark: '5nm晶圆材料' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-mat-wafer', deptKey: 'org-rd-chip', projectKey: 'proj-7nm', budgetAmount: 3000000, prAmount: 2500000, poAmount: 2400000, actualAmount: 1200000, executedAmount: 2500000, remainingAmount: 500000, remark: '7nm晶圆材料' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-outsrc-design', deptKey: 'org-rd-chip', projectKey: 'proj-5nm', budgetAmount: 2000000, prAmount: 800000, poAmount: 700000, actualAmount: 350000, executedAmount: 800000, remainingAmount: 1200000, remark: '5nm设计外包' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-outsrc-test', deptKey: 'org-rd-test', projectKey: null, budgetAmount: 800000, prAmount: 500000, poAmount: 450000, actualAmount: 225000, executedAmount: 500000, remainingAmount: 300000, remark: '测试外包' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-travel', deptKey: 'org-rd', projectKey: null, budgetAmount: 600000, prAmount: 400000, poAmount: 380000, actualAmount: 190000, executedAmount: 400000, remainingAmount: 200000, remark: '研发差旅费' },
      { budgetKey: 'bud-2026-ope-rd', accountKey: 'acc-ope-depreciation', deptKey: 'org-rd', projectKey: null, budgetAmount: 2000000, prAmount: 2000000, poAmount: 2000000, actualAmount: 1000000, executedAmount: 2000000, remainingAmount: 0, remark: '研发设备折旧' },
      // 2026 CAPEX 运营中心 (6条)
      { budgetKey: 'bud-2026-cap-ops', accountKey: 'acc-cap-equip-prod', deptKey: 'org-ops-fab', projectKey: 'proj-fab-ext', budgetAmount: 10000000, prAmount: 3000000, poAmount: 2500000, actualAmount: 1200000, executedAmount: 3000000, remainingAmount: 7000000, remark: '产线扩产设备' },
      { budgetKey: 'bud-2026-cap-ops', accountKey: 'acc-cap-equip-test', deptKey: 'org-ops-qual', projectKey: null, budgetAmount: 1200000, prAmount: 600000, poAmount: 550000, actualAmount: 250000, executedAmount: 600000, remainingAmount: 600000, remark: '质检设备' },
      { budgetKey: 'bud-2026-cap-ops', accountKey: 'acc-cap-construct-fab', deptKey: 'org-ops-fab', projectKey: 'proj-fab-ext', budgetAmount: 3000000, prAmount: 2000000, poAmount: 1800000, actualAmount: 900000, executedAmount: 2000000, remainingAmount: 1000000, remark: '厂房建设续' },
      { budgetKey: 'bud-2026-cap-ops', accountKey: 'acc-cap-equip-prod', deptKey: 'org-ops-fab', projectKey: 'proj-pkg', budgetAmount: 5000000, prAmount: 1000000, poAmount: 800000, actualAmount: 300000, executedAmount: 1000000, remainingAmount: 4000000, remark: '封装产线设备' },
      { budgetKey: 'bud-2026-cap-ops', accountKey: 'acc-cap-soft-license', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 1000000, prAmount: 800000, poAmount: 750000, actualAmount: 375000, executedAmount: 800000, remainingAmount: 200000, remark: 'MES系统续期' },
      { budgetKey: 'bud-2026-cap-ops', accountKey: 'acc-cap-equip-office', deptKey: 'org-ops-qual', projectKey: null, budgetAmount: 300000, prAmount: 200000, poAmount: 180000, actualAmount: 90000, executedAmount: 200000, remainingAmount: 100000, remark: '质量部设备' },
      // 2026 OPEX 运营中心 (10条)
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-salary-base', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 4500000, prAmount: 4500000, poAmount: 4500000, actualAmount: 2250000, executedAmount: 4500000, remainingAmount: 0, remark: '制造运营部工资' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-salary-base', deptKey: 'org-ops-qual', projectKey: null, budgetAmount: 1800000, prAmount: 1800000, poAmount: 1800000, actualAmount: 900000, executedAmount: 1800000, remainingAmount: 0, remark: '质量管理部工资' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-ops', projectKey: null, budgetAmount: 1500000, prAmount: 1000000, poAmount: 950000, actualAmount: 475000, executedAmount: 1000000, remainingAmount: 500000, remark: '运营中心奖金' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-ops', projectKey: null, budgetAmount: 2500000, prAmount: 2500000, poAmount: 2500000, actualAmount: 1250000, executedAmount: 2500000, remainingAmount: 0, remark: '运营中心福利' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-mat-wafer', deptKey: 'org-ops-fab', projectKey: 'proj-7nm', budgetAmount: 7000000, prAmount: 5000000, poAmount: 4800000, actualAmount: 2400000, executedAmount: 5000000, remainingAmount: 2000000, remark: '生产晶圆材料' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-mat-pack', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 2500000, prAmount: 1800000, poAmount: 1700000, actualAmount: 850000, executedAmount: 1800000, remainingAmount: 700000, remark: '封装材料' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-mat-consum', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 1200000, prAmount: 900000, poAmount: 850000, actualAmount: 425000, executedAmount: 900000, remainingAmount: 300000, remark: '生产耗材' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-depreciation', deptKey: 'org-ops', projectKey: null, budgetAmount: 3500000, prAmount: 3500000, poAmount: 3500000, actualAmount: 1750000, executedAmount: 3500000, remainingAmount: 0, remark: '运营设备折旧' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-maint', deptKey: 'org-ops-fab', projectKey: null, budgetAmount: 1800000, prAmount: 1200000, poAmount: 1100000, actualAmount: 550000, executedAmount: 1200000, remainingAmount: 600000, remark: '设备维修维护' },
      { budgetKey: 'bud-2026-ope-ops', accountKey: 'acc-ope-office', deptKey: 'org-ops', projectKey: null, budgetAmount: 400000, prAmount: 300000, poAmount: 280000, actualAmount: 140000, executedAmount: 300000, remainingAmount: 100000, remark: '运营办公费' },
      // 2026 CAPEX 人力资源部 (2条)
      { budgetKey: 'bud-2026-cap-hr', accountKey: 'acc-cap-equip-office', deptKey: 'org-hr', projectKey: null, budgetAmount: 200000, prAmount: 150000, poAmount: 140000, actualAmount: 70000, executedAmount: 150000, remainingAmount: 50000, remark: 'HR办公设备' },
      { budgetKey: 'bud-2026-cap-hr', accountKey: 'acc-cap-soft-license', deptKey: 'org-hr', projectKey: 'proj-digital', budgetAmount: 400000, prAmount: 300000, poAmount: 280000, actualAmount: 140000, executedAmount: 300000, remainingAmount: 100000, remark: 'HR系统许可' },
      // 2026 OPEX 人力资源部 (5条)
      { budgetKey: 'bud-2026-ope-hr', accountKey: 'acc-ope-salary-base', deptKey: 'org-hr', projectKey: null, budgetAmount: 1500000, prAmount: 1500000, poAmount: 1500000, actualAmount: 750000, executedAmount: 1500000, remainingAmount: 0, remark: 'HR工资' },
      { budgetKey: 'bud-2026-ope-hr', accountKey: 'acc-ope-salary-bonus', deptKey: 'org-hr', projectKey: null, budgetAmount: 300000, prAmount: 200000, poAmount: 180000, actualAmount: 90000, executedAmount: 200000, remainingAmount: 100000, remark: 'HR奖金' },
      { budgetKey: 'bud-2026-ope-hr', accountKey: 'acc-ope-salary-benefit', deptKey: 'org-hr', projectKey: null, budgetAmount: 500000, prAmount: 500000, poAmount: 500000, actualAmount: 250000, executedAmount: 500000, remainingAmount: 0, remark: 'HR福利' },
      { budgetKey: 'bud-2026-ope-hr', accountKey: 'acc-ope-train', deptKey: 'org-hr', projectKey: null, budgetAmount: 800000, prAmount: 500000, poAmount: 450000, actualAmount: 225000, executedAmount: 500000, remainingAmount: 300000, remark: '培训费' },
      { budgetKey: 'bud-2026-ope-hr', accountKey: 'acc-ope-office', deptKey: 'org-hr', projectKey: null, budgetAmount: 150000, prAmount: 100000, poAmount: 90000, actualAmount: 45000, executedAmount: 100000, remainingAmount: 50000, remark: 'HR办公费' },
    ];
  }
}
