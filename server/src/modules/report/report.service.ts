import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取仪表盘数据
   */
  async getDashboardData(user: any, departmentId?: string) {
    // 检查用户角色，非管理员/预算管理员只能查看本部门数据
    const isAdmin = user.roles?.some((role: string) => 
      role === 'admin' || role === 'budget_manager'
    );
    
    // 如果不是管理员，强制使用用户所属部门ID
    const effectiveDepartmentId = isAdmin ? departmentId : user.departmentId;
    const where = effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : {};

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

    const executionRate = budgetExecution._sum.totalAmount && Number(budgetExecution._sum.totalAmount) > 0
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

  /**
   * 预算汇总报表（多维度聚合）
   */
  async getBudgetSummary(user: any, params: { year?: number; departmentId?: string }) {
    const { year, departmentId } = params;
    
    // 检查用户角色，非管理员/预算管理员只能查看本部门数据
    const isAdmin = user.roles?.some((role: string) => 
      role === 'admin' || role === 'budget_manager'
    );
    
    // 如果不是管理员，强制使用用户所属部门ID
    const effectiveDepartmentId = isAdmin ? departmentId : user.departmentId;
    
    const where: any = {};
    
    if (year) where.year = year;
    if (effectiveDepartmentId) where.departmentId = effectiveDepartmentId;

    // 1. 按部门汇总
    const departmentSummary = await this.prisma.budget.groupBy({
      by: ['departmentId'],
      where,
      _sum: {
        totalAmount: true,
        usedAmount: true,
        frozenAmount: true,
      },
      _count: true,
    });

    const departments = await this.prisma.department.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
    });

    const byDepartment = departmentSummary.map(item => {
      const dept = departments.find(d => d.id === item.departmentId);
      const total = Number(item._sum.totalAmount || 0);
      const used = Number(item._sum.usedAmount || 0);
      const frozen = Number(item._sum.frozenAmount || 0);
      const remaining = total - used - frozen;
      const executionRate = total > 0 ? (used / total) * 100 : 0;

      return {
        departmentId: item.departmentId,
        departmentName: dept?.name || '未知部门',
        departmentCode: dept?.code || '',
        budgetCount: item._count,
        totalAmount: total,
        usedAmount: used,
        frozenAmount: frozen,
        remainingAmount: remaining,
        executionRate: Math.round(executionRate * 100) / 100,
      };
    });

    // 2. 按类型汇总
    const typeSummary = await this.prisma.budget.groupBy({
      by: ['type'],
      where,
      _sum: {
        totalAmount: true,
        usedAmount: true,
        frozenAmount: true,
      },
      _count: true,
    });

    const byType = typeSummary.map(item => {
      const total = Number(item._sum.totalAmount || 0);
      const used = Number(item._sum.usedAmount || 0);
      const frozen = Number(item._sum.frozenAmount || 0);
      const remaining = total - used - frozen;
      const executionRate = total > 0 ? (used / total) * 100 : 0;

      return {
        type: item.type,
        typeName: item.type === 'OPEX' ? '运营支出' : '资本支出',
        budgetCount: item._count,
        totalAmount: total,
        usedAmount: used,
        frozenAmount: frozen,
        remainingAmount: remaining,
        executionRate: Math.round(executionRate * 100) / 100,
      };
    });

    // 3. 按状态汇总
    const statusSummary = await this.prisma.budget.groupBy({
      by: ['status'],
      where,
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    const byStatus = statusSummary.map(item => ({
      status: item.status,
      budgetCount: item._count,
      totalAmount: Number(item._sum.totalAmount || 0),
    }));

    // 4. 总体统计
    const overallStats = await this.prisma.budget.aggregate({
      where,
      _sum: {
        totalAmount: true,
        usedAmount: true,
        frozenAmount: true,
      },
      _count: true,
    });

    const totalAmount = Number(overallStats._sum.totalAmount || 0);
    const usedAmount = Number(overallStats._sum.usedAmount || 0);
    const frozenAmount = Number(overallStats._sum.frozenAmount || 0);
    const remainingAmount = totalAmount - usedAmount - frozenAmount;
    const avgExecutionRate = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;

    return {
      summary: {
        totalBudgets: overallStats._count,
        totalAmount,
        usedAmount,
        frozenAmount,
        remainingAmount,
        avgExecutionRate: Math.round(avgExecutionRate * 100) / 100,
      },
      byDepartment: byDepartment.sort((a, b) => b.totalAmount - a.totalAmount),
      byType,
      byStatus,
    };
  }

  /**
   * 单个预算使用追踪
   */
  async getBudgetUsage(budgetId: string) {
    // 1. 获取预算基本信息
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('预算不存在');
    }

    // 获取部门和创建者信息
    const [department, creator] = await Promise.all([
      this.prisma.department.findUnique({
        where: { id: budget.departmentId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.user.findUnique({
        where: { id: budget.creatorId },
        select: { id: true, name: true, username: true },
      }),
    ]);

    // 2. 获取预算明细项使用情况
    const items = await this.prisma.budgetItem.findMany({
      where: { budgetId },
      orderBy: { sortOrder: 'asc' },
    });

    const itemUsage = items.map(item => {
      const total = Number(item.totalAmount);
      const used = Number(item.usedAmount);
      const frozen = Number(item.frozenAmount);
      const remaining = total - used - frozen;
      const usageRate = total > 0 ? (used / total) * 100 : 0;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        specification: item.specification,
        totalAmount: total,
        usedAmount: used,
        frozenAmount: frozen,
        remainingAmount: remaining,
        usageRate: Math.round(usageRate * 100) / 100,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      };
    });

    // 3. 获取关联的采购申请
    const purchaseRequests = await this.prisma.purchaseRequest.findMany({
      where: { budgetId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 获取申请人和审批信息
    const purchaseList = await Promise.all(
      purchaseRequests.map(async pr => {
        const applicant = await this.prisma.user.findUnique({
          where: { id: pr.applicantId },
          select: { id: true, name: true, username: true },
        });

        const approvals = await this.prisma.approvalFlow.findMany({
          where: { purchaseId: pr.id },
          select: { status: true },
        });

        return {
          id: pr.id,
          requestNo: pr.requestNo,
          totalAmount: Number(pr.totalAmount),
          status: pr.status,
          purpose: pr.purpose,
          urgencyLevel: pr.urgencyLevel,
          applicant,
          itemCount: pr.items.length,
          createdAt: pr.createdAt,
          approvalStatus: approvals.length > 0 ? approvals[0].status : null,
        };
      })
    );

    // 4. 月度使用趋势（基于采购申请创建时间）
    const year = budget.year;
    const monthlyTrend = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map(async month => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const monthPurchases = await this.prisma.purchaseRequest.aggregate({
          where: {
            budgetId,
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
            status: { in: ['APPROVED', 'IN_APPROVAL'] },
          },
          _sum: { totalAmount: true },
          _count: true,
        });

        return {
          month,
          monthName: `${month}月`,
          purchaseCount: monthPurchases._count,
          amount: Number(monthPurchases._sum.totalAmount || 0),
        };
      })
    );

    // 5. 计算预算执行统计
    const totalAmount = Number(budget.totalAmount);
    const usedAmount = Number(budget.usedAmount);
    const frozenAmount = Number(budget.frozenAmount);
    const remainingAmount = totalAmount - usedAmount - frozenAmount;
    const executionRate = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;

    return {
      budget: {
        id: budget.id,
        budgetNo: budget.budgetNo,
        name: budget.name,
        type: budget.type,
        year: budget.year,
        status: budget.status,
        department,
        creator,
        createdAt: budget.createdAt,
        remark: budget.remark,
      },
      usage: {
        totalAmount,
        usedAmount,
        frozenAmount,
        remainingAmount,
        executionRate: Math.round(executionRate * 100) / 100,
      },
      items: itemUsage,
      purchases: purchaseList,
      monthlyTrend,
    };
  }

  /**
   * 导出预算报表Excel
   */
  async exportBudgetReport(user: any, params: { year?: number; departmentId?: string }) {
    const { year, departmentId } = params;
    
    // 检查用户角色，非管理员/预算管理员只能查看本部门数据
    const isAdmin = user.roles?.some((role: string) => 
      role === 'admin' || role === 'budget_manager'
    );
    
    // 如果不是管理员，强制使用用户所属部门ID
    const effectiveDepartmentId = isAdmin ? departmentId : user.departmentId;
    
    // 获取汇总数据
    const summaryData = await this.getBudgetSummary(user, { year, departmentId });
    
    // 获取明细数据
    const where: any = {};
    if (year) where.year = year;
    if (effectiveDepartmentId) where.departmentId = effectiveDepartmentId;
    
    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 获取部门和创建者信息
    const budgetDetails = await Promise.all(
      budgets.map(async budget => {
        const [department, creator] = await Promise.all([
          this.prisma.department.findUnique({
            where: { id: budget.departmentId },
            select: { name: true, code: true },
          }),
          this.prisma.user.findUnique({
            where: { id: budget.creatorId },
            select: { name: true },
          }),
        ]);
        return { ...budget, department, creator };
      })
    );

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();

    // 1. 汇总 Sheet
    const summarySheet = workbook.addWorksheet('预算汇总');
    
    // 标题行
    summarySheet.mergeCells('A1:H1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `${year || '全部'}年度预算汇总报表`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 30;

    // 总体统计
    summarySheet.getCell('A3').value = '总体统计';
    summarySheet.getCell('A3').font = { bold: true, size: 12 };
    
    const summaryHeaders = ['指标', '数值'];
    summarySheet.getRow(4).values = summaryHeaders;
    summarySheet.getRow(4).font = { bold: true };
    summarySheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const summaryRows = [
      ['预算总数', summaryData.summary.totalBudgets],
      ['总预算额', summaryData.summary.totalAmount],
      ['已使用额', summaryData.summary.usedAmount],
      ['冻结金额', summaryData.summary.frozenAmount],
      ['剩余金额', summaryData.summary.remainingAmount],
      ['平均执行率', `${summaryData.summary.avgExecutionRate}%`],
    ];
    summarySheet.addRows(summaryRows);

    // 按部门汇总
    summarySheet.getCell('A12').value = '按部门汇总';
    summarySheet.getCell('A12').font = { bold: true, size: 12 };
    
    const deptHeaders = ['部门', '预算数', '总预算额', '已使用', '冻结', '剩余', '执行率(%)'];
    summarySheet.getRow(13).values = deptHeaders;
    summarySheet.getRow(13).font = { bold: true };
    summarySheet.getRow(13).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    summaryData.byDepartment.forEach(dept => {
      summarySheet.addRow([
        dept.departmentName,
        dept.budgetCount,
        dept.totalAmount,
        dept.usedAmount,
        dept.frozenAmount,
        dept.remainingAmount,
        dept.executionRate,
      ]);
    });

    // 按类型汇总
    const typeStartRow = 13 + summaryData.byDepartment.length + 3;
    summarySheet.getCell(`A${typeStartRow}`).value = '按类型汇总';
    summarySheet.getCell(`A${typeStartRow}`).font = { bold: true, size: 12 };
    
    const typeHeaders = ['类型', '预算数', '总预算额', '已使用', '冻结', '剩余', '执行率(%)'];
    summarySheet.getRow(typeStartRow + 1).values = typeHeaders;
    summarySheet.getRow(typeStartRow + 1).font = { bold: true };
    summarySheet.getRow(typeStartRow + 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    summaryData.byType.forEach(type => {
      summarySheet.addRow([
        type.typeName,
        type.budgetCount,
        type.totalAmount,
        type.usedAmount,
        type.frozenAmount,
        type.remainingAmount,
        type.executionRate,
      ]);
    });

    // 设置列宽
    summarySheet.columns = [
      { width: 20 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
    ];

    // 2. 预算明细 Sheet
    const detailSheet = workbook.addWorksheet('预算明细');
    
    const detailHeaders = [
      '预算编号',
      '预算名称',
      '部门',
      '类型',
      '年度',
      '状态',
      '总预算',
      '已使用',
      '冻结',
      '剩余',
      '执行率(%)',
      '创建人',
      '创建日期',
    ];
    
    detailSheet.getRow(1).values = detailHeaders;
    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    budgetDetails.forEach(budget => {
      const total = Number(budget.totalAmount);
      const used = Number(budget.usedAmount);
      const frozen = Number(budget.frozenAmount);
      const remaining = total - used - frozen;
      const rate = total > 0 ? (used / total) * 100 : 0;

      detailSheet.addRow([
        budget.budgetNo,
        budget.name,
        budget.department?.name || '',
        budget.type === 'OPEX' ? '运营支出' : '资本支出',
        budget.year,
        budget.status,
        total,
        used,
        frozen,
        remaining,
        Math.round(rate * 100) / 100,
        budget.creator?.name || '',
        budget.createdAt.toISOString().split('T')[0],
      ]);
    });

    // 设置明细表列宽
    detailSheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 12 },
      { width: 10 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
    ];

    // 3. 预算项目明细 Sheet
    const itemSheet = workbook.addWorksheet('预算项目明细');
    
    const itemHeaders = [
      '预算编号',
      '预算名称',
      '项目名称',
      '类别',
      '规格型号',
      '数量',
      '单价',
      '总金额',
      '已使用',
      '冻结',
      '剩余',
      '使用率(%)',
    ];
    
    itemSheet.getRow(1).values = itemHeaders;
    itemSheet.getRow(1).font = { bold: true };
    itemSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    budgetDetails.forEach(budget => {
      budget.items.forEach(item => {
        const total = Number(item.totalAmount);
        const used = Number(item.usedAmount);
        const frozen = Number(item.frozenAmount);
        const remaining = total - used - frozen;
        const rate = total > 0 ? (used / total) * 100 : 0;

        itemSheet.addRow([
          budget.budgetNo,
          budget.name,
          item.name,
          item.category,
          item.specification || '',
          item.quantity,
          Number(item.unitPrice),
          total,
          used,
          frozen,
          remaining,
          Math.round(rate * 100) / 100,
        ]);
      });
    });

    // 设置项目明细表列宽
    itemSheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 20 },
      { width: 10 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
    ];

    // 设置数字格式
    [summarySheet, detailSheet, itemSheet].forEach(sheet => {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            if (typeof cell.value === 'number' && cell.value > 1000) {
              cell.numFmt = '#,##0.00';
            }
          });
        }
      });
    });

    return workbook;
  }
}
