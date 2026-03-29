import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 导出预算报表为 Excel
   */
  async exportBudgets(params: any): Promise<any> {
    const budgets = await this.prisma.budget.findMany({
      where: params,
      include: {
        department: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '预算管理系统';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('预算列表');

    // 设置列
    worksheet.columns = [
      { header: '预算编号', key: 'budgetNo', width: 20 },
      { header: '预算名称', key: 'name', width: 30 },
      { header: '部门', key: 'departmentName', width: 20 },
      { header: '类型', key: 'type', width: 10 },
      { header: '年份', key: 'year', width: 10 },
      { header: '总金额', key: 'totalAmount', width: 15 },
      { header: '已使用', key: 'usedAmount', width: 15 },
      { header: '执行率', key: 'executionRate', width: 10 },
      { header: '状态', key: 'status', width: 10 },
    ];

    // 添加数据
    budgets.forEach(budget => {
      worksheet.addRow({
        budgetNo: budget.budgetNo,
        name: budget.name,
        departmentName: budget.department.name,
        type: budget.type === 'OPEX' ? '运营支出' : '资本支出',
        year: budget.year,
        totalAmount: Number(budget.totalAmount).toFixed(2),
        usedAmount: Number(budget.usedAmount).toFixed(2),
        executionRate: `${((Number(budget.usedAmount) / Number(budget.totalAmount)) * 100).toFixed(1)}%`,
        status: this.getStatusText(budget.status),
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * 导出采购申请报表
   */
  async exportPurchases(params: any): Promise<any> {
    const purchases = await this.prisma.purchaseRequest.findMany({
      where: params,
      include: {
        budget: {
          include: {
            department: true,
          }
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('采购申请');

    worksheet.columns = [
      { header: '申请编号', key: 'requestNo', width: 20 },
      { header: '申请人', key: 'applicantName', width: 15 },
      { header: '部门', key: 'departmentName', width: 20 },
      { header: '总金额', key: 'totalAmount', width: 15 },
      { header: '用途', key: 'purpose', width: 30 },
      { header: '紧急程度', key: 'urgencyLevel', width: 10 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    purchases.forEach(purchase => {
      worksheet.addRow({
        requestNo: purchase.requestNo,
        applicantName: purchase.applicantId,
        departmentName: purchase.budget.department.name,
        totalAmount: Number(purchase.totalAmount).toFixed(2),
        purpose: purchase.purpose,
        urgencyLevel: this.getUrgencyText(purchase.urgencyLevel),
        status: this.getStatusText(purchase.status),
        createdAt: new Date(purchase.createdAt).toLocaleString('zh-CN'),
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private getStatusText(status: string): string {
    const statusMap: any = {
      'DRAFT': '草稿',
      'PENDING': '待审批',
      'APPROVED': '已批准',
      'REJECTED': '已拒绝',
      'IN_APPROVAL': '审批中',
    };
    return statusMap[status] || status;
  }

  private getUrgencyText(level: string): string {
    const levelMap: any = {
      'LOW': '低',
      'NORMAL': '普通',
      'HIGH': '高',
      'URGENT': '紧急',
    };
    return levelMap[level] || level;
  }
}
