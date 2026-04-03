import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Decimal } from '@prisma/client/runtime/library';

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
  batchId: string;
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成导入批次号
   */
  private generateBatchId(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 900 + 100);
    return `IMP-${dateStr}-${random}`;
  }

  /**
   * 解析Excel文件
   */
  private async parseExcel(file: Buffer): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file as any);
    return workbook.getWorksheet(1);
  }

  /**
   * 验证日期格式
   */
  private parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    
    // 如果是Excel日期数字
    if (typeof dateValue === 'number') {
      return new Date((dateValue - 25569) * 86400 * 1000);
    }
    
    // 如果是字符串
    if (typeof dateValue === 'string') {
      // 尝试多种格式
      const formats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        /^(\d{4})(\d{2})(\d{2})$/,
      ];
      
      for (const format of formats) {
        const match = dateValue.match(format);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
          }
        }
      }
    }
    
    // 尝试直接解析
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  }

  /**
   * 导入采购订单
   */
  async importPurchaseOrders(file: Buffer, userId: string): Promise<ImportResult> {
    const worksheet = await this.parseExcel(file);
    const batchId = this.generateBatchId();
    const errors: ImportError[] = [];
    const validOrders: any[] = [];

    // 获取现有订单号用于唯一性校验
    const existingOrderNos = new Set(
      (await this.prisma.purchaseOrder.findMany({
        select: { orderNo: true },
      })).map(o => o.orderNo)
    );

    let rowIndex = 2; // 从第2行开始（第1行是表头）
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const values = row.values as any[];
      const orderNo = values[1]?.toString().trim();
      const supplier = values[2]?.toString().trim();
      const amountStr = values[3]?.toString().trim();
      const orderDateValue = values[4];
      const status = values[5]?.toString().trim() || 'PENDING';
      const budgetNo = values[6]?.toString().trim() || null;

      // 校验
      if (!orderNo) {
        errors.push({ row: rowNumber, field: '订单编号', message: '订单编号不能为空' });
      } else if (existingOrderNos.has(orderNo)) {
        errors.push({ row: rowNumber, field: '订单编号', message: `订单编号 ${orderNo} 已存在` });
      }

      if (!supplier) {
        errors.push({ row: rowNumber, field: '供应商', message: '供应商不能为空' });
      }

      let amount: number | null = null;
      if (!amountStr) {
        errors.push({ row: rowNumber, field: '金额', message: '金额不能为空' });
      } else {
        amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          errors.push({ row: rowNumber, field: '金额', message: '金额必须大于0' });
        }
      }

      const orderDate = this.parseDate(orderDateValue);
      if (!orderDate) {
        errors.push({ row: rowNumber, field: '订单日期', message: '订单日期格式无效' });
      }

      // 如果没有错误，添加到有效列表
      if (!errors.some(e => e.row === rowNumber)) {
        validOrders.push({
          orderNo,
          supplier,
          amount: new Decimal(amount),
          orderDate,
          status,
          budgetNo,
          importBatchId: batchId,
        });
        existingOrderNos.add(orderNo); // 防止同一文件内重复
      }
    });

    // 使用事务批量插入
    if (validOrders.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const order of validOrders) {
          await tx.purchaseOrder.create({ data: order });
        }
      });
    }

    return {
      success: validOrders.length,
      failed: errors.length,
      errors,
      batchId,
    };
  }

  /**
   * 导入结算单
   */
  async importSettlements(file: Buffer, userId: string): Promise<ImportResult> {
    const worksheet = await this.parseExcel(file);
    const batchId = this.generateBatchId();
    const errors: ImportError[] = [];
    const validSettlements: any[] = [];

    // 获取现有结算单号用于唯一性校验
    const existingSettlementNos = new Set(
      (await this.prisma.settlement.findMany({
        select: { settlementNo: true },
      })).map(s => s.settlementNo)
    );

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const values = row.values as any[];
      const settlementNo = values[1]?.toString().trim();
      const invoiceNo = values[2]?.toString().trim() || null;
      const amountStr = values[3]?.toString().trim();
      const settleDateValue = values[4];
      const supplier = values[5]?.toString().trim();
      const budgetNo = values[6]?.toString().trim() || null;

      // 校验
      if (!settlementNo) {
        errors.push({ row: rowNumber, field: '结算编号', message: '结算编号不能为空' });
      } else if (existingSettlementNos.has(settlementNo)) {
        errors.push({ row: rowNumber, field: '结算编号', message: `结算编号 ${settlementNo} 已存在` });
      }

      let amount: number | null = null;
      if (!amountStr) {
        errors.push({ row: rowNumber, field: '金额', message: '金额不能为空' });
      } else {
        amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          errors.push({ row: rowNumber, field: '金额', message: '金额必须大于0' });
        }
      }

      const settleDate = this.parseDate(settleDateValue);
      if (!settleDate) {
        errors.push({ row: rowNumber, field: '结算日期', message: '结算日期格式无效' });
      }

      if (!supplier) {
        errors.push({ row: rowNumber, field: '供应商', message: '供应商不能为空' });
      }

      // 如果没有错误，添加到有效列表
      if (!errors.some(e => e.row === rowNumber)) {
        validSettlements.push({
          settlementNo,
          invoiceNo,
          amount: new Decimal(amount),
          settleDate,
          supplier,
          budgetNo,
          importBatchId: batchId,
        });
        existingSettlementNos.add(settlementNo); // 防止同一文件内重复
      }
    });

    // 使用事务批量插入
    if (validSettlements.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const settlement of validSettlements) {
          await tx.settlement.create({ data: settlement });
        }
      });
    }

    return {
      success: validSettlements.length,
      failed: errors.length,
      errors,
      batchId,
    };
  }

  /**
   * 生成导入模板
   */
  async generateTemplate(type: 'purchase-order' | 'settlement'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '预算管理系统';
    workbook.created = new Date();

    if (type === 'purchase-order') {
      const worksheet = workbook.addWorksheet('采购订单导入模板');
      worksheet.columns = [
        { header: '订单编号', key: 'orderNo', width: 20 },
        { header: '供应商', key: 'supplier', width: 30 },
        { header: '金额', key: 'amount', width: 15 },
        { header: '订单日期', key: 'orderDate', width: 15 },
        { header: '状态', key: 'status', width: 10 },
        { header: '预算编号', key: 'budgetNo', width: 20 },
      ];

      // 添加示例数据
      worksheet.addRow({
        orderNo: 'PO-2026-001',
        supplier: '示例供应商A',
        amount: 10000.00,
        orderDate: '2026-01-15',
        status: 'PENDING',
        budgetNo: 'BG-2026-001',
      });

      worksheet.addRow({
        orderNo: 'PO-2026-002',
        supplier: '示例供应商B',
        amount: 25000.50,
        orderDate: '2026-02-20',
        status: 'APPROVED',
        budgetNo: 'BG-2026-002',
      });

      // 添加说明
      const noteWorksheet = workbook.addWorksheet('填写说明');
      noteWorksheet.addRow(['字段', '说明', '必填', '格式要求']);
      noteWorksheet.addRow(['订单编号', '采购订单唯一编号', '是', '不能重复']);
      noteWorksheet.addRow(['供应商', '供应商名称', '是', '']);
      noteWorksheet.addRow(['金额', '订单金额', '是', '大于0的数字']);
      noteWorksheet.addRow(['订单日期', '订单签订日期', '是', 'YYYY-MM-DD']);
      noteWorksheet.addRow(['状态', '订单状态', '否', 'PENDING/APPROVED/REJECTED，默认PENDING']);
      noteWorksheet.addRow(['预算编号', '关联的预算编号', '否', '系统中已存在的预算编号']);
      
      noteWorksheet.columns = [
        { width: 15 },
        { width: 30 },
        { width: 10 },
        { width: 30 },
      ];
    } else {
      const worksheet = workbook.addWorksheet('结算单导入模板');
      worksheet.columns = [
        { header: '结算编号', key: 'settlementNo', width: 20 },
        { header: '发票号', key: 'invoiceNo', width: 20 },
        { header: '金额', key: 'amount', width: 15 },
        { header: '结算日期', key: 'settleDate', width: 15 },
        { header: '供应商', key: 'supplier', width: 30 },
        { header: '预算编号', key: 'budgetNo', width: 20 },
      ];

      // 添加示例数据
      worksheet.addRow({
        settlementNo: 'ST-2026-001',
        invoiceNo: 'INV-001',
        amount: 8000.00,
        settleDate: '2026-01-20',
        supplier: '示例供应商A',
        budgetNo: 'BG-2026-001',
      });

      worksheet.addRow({
        settlementNo: 'ST-2026-002',
        invoiceNo: 'INV-002',
        amount: 15000.00,
        settleDate: '2026-02-25',
        supplier: '示例供应商B',
        budgetNo: 'BG-2026-002',
      });

      // 添加说明
      const noteWorksheet = workbook.addWorksheet('填写说明');
      noteWorksheet.addRow(['字段', '说明', '必填', '格式要求']);
      noteWorksheet.addRow(['结算编号', '结算单唯一编号', '是', '不能重复']);
      noteWorksheet.addRow(['发票号', '发票号码', '否', '']);
      noteWorksheet.addRow(['金额', '结算金额', '是', '大于0的数字']);
      noteWorksheet.addRow(['结算日期', '实际结算日期', '是', 'YYYY-MM-DD']);
      noteWorksheet.addRow(['供应商', '供应商名称', '是', '']);
      noteWorksheet.addRow(['预算编号', '关联的预算编号', '否', '系统中已存在的预算编号']);
      
      noteWorksheet.columns = [
        { width: 15 },
        { width: 30 },
        { width: 10 },
        { width: 30 },
      ];
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
