import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取仪表盘数据
   */
  async getDashboardData(userId: string, departmentId?: string) {
    // 如果是普通用户，只看本部门；管理员看全部
    const where = departmentId ? { departmentId } : {};

    const [
      totalBudgets,
      approvedBudgets,
      pendingBudgets,
      totalPurchases,
      pendingPurchases,
    ] = await Promise.all([
      this.prisma.budget.count({ where }),
      this.prisma.budget.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.budget.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.purchaseRequest.count({ where }),
      this.prisma.purchaseRequest.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    // 预算执行率
    const budgetExecution = await this.prisma.budget.aggregate({
      where,
      _sum: {
        totalAmount: true,
        usedAmount: true,
      },
    });

    const executionRate = budgetExecution._sum.totalAmount && budgetExecution._sum.totalAmount > 0
      ? Number(budgetExecution._sum.usedAmount || 0) / Number(budgetExecution._sum.totalAmount)
      : 0;

    return {
      totalBudgets,
      approvedBudgets,
      pendingBudgets,
      totalPurchases,
      pendingPurchases,
      executionRate,
      totalBudgetAmount: budgetExecution._sum.totalAmount || 0,
      usedBudgetAmount: budgetExecution._sum.usedAmount || 0,
    };
  }

  /**
   * 部门预算排名
   */
  async getDepartmentRanking(year?: number) {
    const departments = await this.prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        budgets: {
          where: year ? { year } : {},
          select: {
            totalAmount: true,
            usedAmount: true,
            status: true,
          },
        },
      },
    });

    const rankings = departments.map(dept => {
      const total = dept.budgets.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      const used = dept.budgets.reduce((sum, b) => sum + Number(b.usedAmount), 0);
      const rate = total > 0 ? used / total : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalBudget: total,
        usedBudget: used,
        executionRate: rate,
      };
    });

    return rankings.sort((a, b) => b.executionRate - a.executionRate);
  }

  /**
   * 月度趋势分析
   */
  async getMonthlyTrend(year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const trends = await Promise.all(
      months.map(month => 
        this.prisma.budget.aggregate({
          where: {
            year,
            createdAt: {
              gte: new Date(`${year}-${month}-01`),
              lt: new Date(`${year}-${month + 1}-01`),
            },
          },
          _sum: {
            totalAmount: true,
            usedAmount: true,
          },
          _count: true,
        })
      )
    );

    return months.map((month, index) => ({
      month,
      budgetCount: trends[index]._count,
      totalAmount: Number(trends[index]._sum.totalAmount || 0),
      usedAmount: Number(trends[index]._sum.usedAmount || 0),
    }));
  }

  /**
   * 预算类别分析
   */
  async getBudgetCategoryAnalysis(year?: number) {
    const budgets = await this.prisma.budget.groupBy({
      by: ['type'],
      where: year ? { year } : {},
      _sum: {
        totalAmount: true,
        usedAmount: true,
      },
      _count: true,
    });

    return budgets.map(item => ({
      type: item.type,
      count: item._count,
      totalAmount: Number(item._sum.totalAmount || 0),
      usedAmount: Number(item._sum.usedAmount || 0),
    }));
  }
}
