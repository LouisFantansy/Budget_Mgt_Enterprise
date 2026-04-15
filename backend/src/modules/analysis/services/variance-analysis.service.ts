import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget, BudgetItem } from '../../budget/entities/budget.entity';
import { Organization } from '../../master/entities/organization.entity';
import {
  PrRecord,
  PoRecord,
  SettlementRecord,
} from '../../execution/entities/execution-records.entity';

export interface VarianceAnalysis {
  dimension: string;
  dimensionValue: string;
  budgetAmount: number;
  executedAmount: number;
  variance: number;
  varianceRate: number;
  executionRate: number;
}

export interface MultiDimensionAnalysis {
  byOrganization: VarianceAnalysis[];
  byDepartment: VarianceAnalysis[];
  byProject: VarianceAnalysis[];
  byAccount: VarianceAnalysis[];
  summary: {
    totalBudget: number;
    totalExecuted: number;
    totalVariance: number;
    avgExecutionRate: number;
  };
}

@Injectable()
export class VarianceAnalysisService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(PrRecord)
    private prRepository: Repository<PrRecord>,
    @InjectRepository(PoRecord)
    private poRepository: Repository<PoRecord>,
    @InjectRepository(SettlementRecord)
    private settlementRepository: Repository<SettlementRecord>,
  ) {}

  /**
   * 多维度差异分析
   */
  async analyzeMultiDimension(params: {
    year: number;
    budgetType?: string;
    organizationId?: string;
    ledger?: 'PR' | 'PO' | 'ACTUAL';
  }): Promise<MultiDimensionAnalysis> {
    // 查询预算数据
    const queryBuilder = this.budgetItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.budget', 'budget')
      .leftJoinAndSelect('item.department', 'department')
      .where('budget.budgetYear = :year', { year: params.year })
      .andWhere('budget.status = :status', { status: 'approved' });

    if (params.budgetType) {
      queryBuilder.andWhere('budget.budgetType = :type', {
        type: params.budgetType,
      });
    }

    if (params.organizationId) {
      queryBuilder.andWhere('budget.organizationId = :orgId', {
        orgId: params.organizationId,
      });
    }

    const items = await queryBuilder.getMany();
    const ledger = params.ledger || 'PR';

    // 按组织分析
    const byOrganization = await this.analyzeByOrganization(items, ledger);

    // 按部门分析
    const byDepartment = this.analyzeByDepartment(items, ledger);

    // 按项目分析
    const byProject = this.analyzeByProject(items, ledger);

    // 按科目分析
    const byAccount = this.analyzeByAccount(items, ledger);

    // 汇总统计
    const summary = this.calculateSummary(items, ledger);

    return {
      byOrganization,
      byDepartment,
      byProject,
      byAccount,
      summary,
    };
  }

  /**
   * 按组织分析
   */
  private async analyzeByOrganization(
    items: BudgetItem[],
    ledger: 'PR' | 'PO' | 'ACTUAL',
  ): Promise<VarianceAnalysis[]> {
    const orgMap = new Map<string, { budget: number; executed: number }>();

    for (const item of items) {
      const orgId = item.budget.organizationId;
      if (!orgMap.has(orgId)) {
        orgMap.set(orgId, { budget: 0, executed: 0 });
      }
      const data = orgMap.get(orgId)!;
      data.budget += Number(item.budgetAmount);
      data.executed += this.getExecutedAmount(item, ledger);
    }

    const organizations = await this.organizationRepository.find();
    const orgNameMap = new Map(organizations.map((org) => [org.id, org.name]));

    return Array.from(orgMap.entries()).map(([orgId, data]) => ({
      dimension: 'organization',
      dimensionValue: orgNameMap.get(orgId) || orgId,
      budgetAmount: data.budget,
      executedAmount: data.executed,
      variance: data.budget - data.executed,
      varianceRate: data.budget > 0 ? ((data.budget - data.executed) / data.budget) * 100 : 0,
      executionRate: data.budget > 0 ? (data.executed / data.budget) * 100 : 0,
    }));
  }

  /**
   * 按部门分析
   */
  private analyzeByDepartment(
    items: BudgetItem[],
    ledger: 'PR' | 'PO' | 'ACTUAL',
  ): VarianceAnalysis[] {
    const deptMap = new Map<string, { budget: number; executed: number; name: string }>();

    for (const item of items) {
      const deptId = item.departmentId || '未分配';
      const deptName = item.department?.name || '未分配';

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { budget: 0, executed: 0, name: deptName });
      }

      const data = deptMap.get(deptId)!;
      data.budget += Number(item.budgetAmount);
      data.executed += this.getExecutedAmount(item, ledger);
    }

    return Array.from(deptMap.entries()).map(([deptId, data]) => ({
      dimension: 'department',
      dimensionValue: data.name,
      budgetAmount: data.budget,
      executedAmount: data.executed,
      variance: data.budget - data.executed,
      varianceRate: data.budget > 0 ? ((data.budget - data.executed) / data.budget) * 100 : 0,
      executionRate: data.budget > 0 ? (data.executed / data.budget) * 100 : 0,
    }));
  }

  /**
   * 按项目分析
   */
  private analyzeByProject(
    items: BudgetItem[],
    ledger: 'PR' | 'PO' | 'ACTUAL',
  ): VarianceAnalysis[] {
    const projectMap = new Map<string, { budget: number; executed: number }>();

    for (const item of items) {
      const projectId = item.projectId || '无项目';
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, { budget: 0, executed: 0 });
      }
      const data = projectMap.get(projectId)!;
      data.budget += Number(item.budgetAmount);
      data.executed += this.getExecutedAmount(item, ledger);
    }

    return Array.from(projectMap.entries()).map(([projectId, data]) => ({
      dimension: 'project',
      dimensionValue: projectId === '无项目' ? '无项目' : projectId,
      budgetAmount: data.budget,
      executedAmount: data.executed,
      variance: data.budget - data.executed,
      varianceRate: data.budget > 0 ? ((data.budget - data.executed) / data.budget) * 100 : 0,
      executionRate: data.budget > 0 ? (data.executed / data.budget) * 100 : 0,
    }));
  }

  /**
   * 按科目分析
   */
  private analyzeByAccount(
    items: BudgetItem[],
    ledger: 'PR' | 'PO' | 'ACTUAL',
  ): VarianceAnalysis[] {
    const accountMap = new Map<string, { budget: number; executed: number }>();

    for (const item of items) {
      const accountId = item.accountId;
      if (!accountMap.has(accountId)) {
        accountMap.set(accountId, { budget: 0, executed: 0 });
      }
      const data = accountMap.get(accountId)!;
      data.budget += Number(item.budgetAmount);
      data.executed += this.getExecutedAmount(item, ledger);
    }

    return Array.from(accountMap.entries()).map(([accountId, data]) => ({
      dimension: 'account',
      dimensionValue: accountId,
      budgetAmount: data.budget,
      executedAmount: data.executed,
      variance: data.budget - data.executed,
      varianceRate: data.budget > 0 ? ((data.budget - data.executed) / data.budget) * 100 : 0,
      executionRate: data.budget > 0 ? (data.executed / data.budget) * 100 : 0,
    }));
  }

  /**
   * 计算汇总统计
   */
  private calculateSummary(items: BudgetItem[], ledger: 'PR' | 'PO' | 'ACTUAL') {
    const totalBudget = items.reduce(
      (sum, item) => sum + Number(item.budgetAmount),
      0,
    );
    const totalExecuted = items.reduce(
      (sum, item) => sum + this.getExecutedAmount(item, ledger),
      0,
    );
    const totalVariance = totalBudget - totalExecuted;
    const avgExecutionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalExecuted,
      totalVariance,
      avgExecutionRate,
    };
  }

  /**
   * 获取预算执行趋势
   */
  async getExecutionTrend(params: {
    year: number;
    budgetType?: string;
  }): Promise<any[]> {
    // 按月统计执行情况
    const months = [];
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(params.year, month - 1, 1);
      const endDate = new Date(params.year, month, 0);

      // 查询该月的PR和结算数据
      const prAmount = await this.prRepository
        .createQueryBuilder('pr')
        .select('SUM(pr.prAmount)', 'total')
        .where('pr.prDate >= :start', { start: startDate })
        .andWhere('pr.prDate <= :end', { end: endDate })
        .getRawOne();

      const settlementAmount = await this.settlementRepository
        .createQueryBuilder('settlement')
        .select('SUM(settlement.settlementAmount)', 'total')
        .where('settlement.settlementDate >= :start', { start: startDate })
        .andWhere('settlement.settlementDate <= :end', { end: endDate })
        .getRawOne();

      months.push({
        month,
        prAmount: Number(prAmount.total) || 0,
        settlementAmount: Number(settlementAmount.total) || 0,
      });
    }

    return months;
  }

  /**
   * 全年执行预估
   */
  async forecastFullYear(params: {
    year: number;
    budgetType?: string;
    ledger?: 'PR' | 'PO' | 'ACTUAL';
  }): Promise<any> {
    const currentMonth = new Date().getMonth() + 1;
    const analysis = await this.analyzeMultiDimension({
      ...params,
      ledger: params.ledger || 'PR',
    });

    // 基于当前执行率预估全年
    const monthlyRate = analysis.summary.avgExecutionRate / currentMonth;
    const forecastRate = Math.min(monthlyRate * 12, 100);

    return {
      currentExecutionRate: analysis.summary.avgExecutionRate,
      forecastExecutionRate: forecastRate,
      forecastAmount:
        (analysis.summary.totalBudget * forecastRate) / 100,
      confidence: currentMonth >= 6 ? 'high' : currentMonth >= 3 ? 'medium' : 'low',
    };
  }

  private getExecutedAmount(
    item: BudgetItem,
    ledger: 'PR' | 'PO' | 'ACTUAL',
  ): number {
    if (ledger === 'PO') return Number((item as any).poCommittedAmount || 0);
    if (ledger === 'ACTUAL') return Number((item as any).actualSettledAmount || 0);
    return Number((item as any).prCommittedAmount || item.executedAmount || 0);
  }
}
