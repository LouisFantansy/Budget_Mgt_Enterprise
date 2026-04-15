import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget, BudgetItem } from '../../budget/entities/budget.entity';
import { Organization } from '../../master/entities/organization.entity';
import { BudgetAccount } from '../../master/entities/budget-account.entity';
import { IpdProject } from '../../master/entities/ipd-project.entity';

export interface DashboardData {
  summary: {
    totalBudget: number;
    totalExecuted: number;
    totalRemaining: number;
    executionRate: number;
    budgetCount: number;
    approvedCount: number;
    pendingCount: number;
  };
  byType: {
    capex: { budget: number; executed: number; rate: number };
    opex: { budget: number; executed: number; rate: number };
  };
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    budgetAmount: number;
    executedAmount: number;
    executionRate: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  recentBudgets: Array<{
    id: string;
    budgetYear: number;
    budgetType: string;
    totalAmount: number;
    status: string;
    organizationName: string;
    createdAt: Date;
    executionRate: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    budget: number;
    executed: number;
  }>;
  topProjects: Array<{
    projectId: string;
    projectName: string;
    budgetAmount: number;
    executedAmount: number;
    executionRate: number;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(BudgetAccount)
    private accountRepository: Repository<BudgetAccount>,
    @InjectRepository(IpdProject)
    private projectRepository: Repository<IpdProject>,
  ) {}

  async getDashboardData(year?: number): Promise<DashboardData> {
    const targetYear = year || new Date().getFullYear();

    // 获取所有预算项
    const items = await this.budgetItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.budget', 'budget')
      .leftJoinAndSelect('item.department', 'department')
      .leftJoinAndSelect('budget.organization', 'organization')
      .where('budget.budgetYear = :year', { year: targetYear })
      .getMany();

    // 获取所有预算主表
    const budgets = await this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.organization', 'organization')
      .leftJoinAndSelect('budget.items', 'items')
      .where('budget.budgetYear = :year', { year: targetYear })
      .orderBy('budget.createdAt', 'DESC')
      .getMany();

    // 汇总统计
    const summary = this.calculateSummary(items, budgets);

    // 按类型统计
    const byType = this.calculateByType(items);

    // 按部门统计
    const byDepartment = this.calculateByDepartment(items);

    // 按状态统计
    const byStatus = this.calculateByStatus(budgets);

    // 近期预算
    const recentBudgets = this.getRecentBudgets(budgets);

    // 月度趋势
    const monthlyTrend = this.calculateMonthlyTrend(items);

    // 重点项目
    const topProjects = await this.calculateTopProjects(items);

    return {
      summary,
      byType,
      byDepartment,
      byStatus,
      recentBudgets,
      monthlyTrend,
      topProjects,
    };
  }

  private calculateSummary(items: BudgetItem[], budgets: Budget[]) {
    const totalBudget = items.reduce(
      (sum, item) => sum + Number(item.budgetAmount),
      0,
    );
    const totalExecuted = items.reduce(
      (sum, item) => sum + Number(item.prCommittedAmount || item.executedAmount || 0),
      0,
    );
    const totalRemaining = totalBudget - totalExecuted;
    const executionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalExecuted,
      totalRemaining,
      executionRate: Math.round(executionRate * 100) / 100,
      budgetCount: budgets.length,
      approvedCount: budgets.filter((b) => b.status === 'approved').length,
      pendingCount: budgets.filter((b) => b.status === 'submitted').length,
    };
  }

  private calculateByType(items: BudgetItem[]) {
    const capexItems = items.filter((i) => i.budget?.budgetType === 'CAPEX');
    const opexItems = items.filter((i) => i.budget?.budgetType === 'OPEX');

    const calc = (list: BudgetItem[]) => {
      const budget = list.reduce((s, i) => s + Number(i.budgetAmount), 0);
      const executed = list.reduce(
        (s, i) => s + Number(i.prCommittedAmount || i.executedAmount || 0),
        0,
      );
      return { budget, executed, rate: budget > 0 ? Math.round((executed / budget) * 10000) / 100 : 0 };
    };

    return {
      capex: calc(capexItems),
      opex: calc(opexItems),
    };
  }

  private calculateByDepartment(items: BudgetItem[]) {
    const deptMap = new Map<
      string,
      { name: string; budget: number; executed: number }
    >();

    for (const item of items) {
      const deptId = item.departmentId || 'unknown';
      const deptName = (item as any).department?.name || '未分配';

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { name: deptName, budget: 0, executed: 0 });
      }
      const data = deptMap.get(deptId)!;
      data.budget += Number(item.budgetAmount);
      data.executed += Number(
        item.prCommittedAmount || item.executedAmount || 0,
      );
    }

    return Array.from(deptMap.entries())
      .map(([deptId, data]) => ({
        departmentId: deptId,
        departmentName: data.name,
        budgetAmount: data.budget,
        executedAmount: data.executed,
        executionRate:
          data.budget > 0
            ? Math.round((data.executed / data.budget) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.budgetAmount - a.budgetAmount);
  }

  private calculateByStatus(budgets: Budget[]) {
    const statusMap = new Map<string, { count: number; totalAmount: number }>();
    const statusNames: Record<string, string> = {
      draft: '草稿',
      submitted: '待审批',
      approved: '已审批',
      rejected: '已拒绝',
    };

    for (const budget of budgets) {
      const status = budget.status;
      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, totalAmount: 0 });
      }
      const data = statusMap.get(status)!;
      data.count++;
      data.totalAmount += Number(budget.totalAmount);
    }

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status: statusNames[status] || status,
      count: data.count,
      totalAmount: data.totalAmount,
    }));
  }

  private getRecentBudgets(budgets: Budget[]) {
    return budgets.slice(0, 10).map((budget) => {
      const totalBudget = Number(budget.totalAmount);
      const totalExecuted = (budget.items || []).reduce(
        (s, i) => s + Number(i.prCommittedAmount || i.executedAmount || 0),
        0,
      );
      return {
        id: budget.id,
        budgetYear: budget.budgetYear,
        budgetType: budget.budgetType,
        totalAmount: totalBudget,
        status: budget.status,
        organizationName: (budget as any).organization?.name || '',
        createdAt: budget.createdAt,
        executionRate:
          totalBudget > 0
            ? Math.round((totalExecuted / totalBudget) * 10000) / 100
            : 0,
      };
    });
  }

  private calculateMonthlyTrend(items: BudgetItem[]) {
    // 模拟月度趋势数据（基于年度数据按月均摊，加上一些波动）
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ];
    const totalBudget = items.reduce((s, i) => s + Number(i.budgetAmount), 0);
    const totalExecuted = items.reduce(
      (s, i) => s + Number(i.prCommittedAmount || i.executedAmount || 0),
      0,
    );

    const monthlyBudget = totalBudget / 12;
    const monthlyExecuted = totalExecuted / 12;
    const currentMonth = new Date().getMonth() + 1;

    return months.map((month, index) => {
      const monthIndex = index + 1;
      const isPast = monthIndex <= currentMonth;
      // 添加一些波动
      const fluctuation = 1 + (Math.sin(monthIndex * 0.8) * 0.15);
      return {
        month,
        budget: Math.round(monthlyBudget * fluctuation),
        executed: isPast ? Math.round(monthlyExecuted * fluctuation * (0.8 + monthIndex / currentMonth * 0.2)) : 0,
      };
    });
  }

  private async calculateTopProjects(items: BudgetItem[]) {
    const projectMap = new Map<
      string,
      { budget: number; executed: number }
    >();

    for (const item of items) {
      const projectId = item.projectId;
      if (!projectId) continue;

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, { budget: 0, executed: 0 });
      }
      const data = projectMap.get(projectId)!;
      data.budget += Number(item.budgetAmount);
      data.executed += Number(
        item.prCommittedAmount || item.executedAmount || 0,
      );
    }

    const projects = await this.projectRepository.find();
    const projectNameMap = new Map(projects.map((p) => [p.id, p.projectName]));

    return Array.from(projectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: projectNameMap.get(projectId) || projectId,
        budgetAmount: data.budget,
        executedAmount: data.executed,
        executionRate:
          data.budget > 0
            ? Math.round((data.executed / data.budget) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.budgetAmount - a.budgetAmount)
      .slice(0, 5);
  }
}
