import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  errors: Array<{ row: number; message: string }>;
  data?: any[];
}

export interface PRRecordDTO {
  prNumber: string;
  accountId: string;
  departmentId: string;
  projectId?: string;
  prAmount: number;
  prDate: string;
  prTitle?: string;
  description?: string;
}

export interface PORecordDTO {
  poNumber: string;
  prNumber: string;
  poAmount: number;
  supplier?: string;
  poDate: string;
}

export interface SettlementRecordDTO {
  settlementNumber: string;
  poNumber: string;
  settlementAmount: number;
  settlementDate: string;
}

@Injectable()
export class ExcelImportService {
  /**
   * 解析Excel文件
   */
  parseExcel(buffer: Buffer): any[][] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      return data as any[][];
    } catch (error) {
      throw new BadRequestException('Excel文件解析失败');
    }
  }

  /**
   * 导入PR数据
   */
  importPRData(buffer: Buffer): ImportResult {
    const data = this.parseExcel(buffer);
    const result: ImportResult = {
      success: true,
      total: 0,
      successCount: 0,
      failCount: 0,
      errors: [],
      data: [],
    };

    // 跳过标题行
    const rows = data.slice(1);
    result.total = rows.length;

    rows.forEach((row, index) => {
      try {
        const record: PRRecordDTO = {
          prNumber: this.validateString(row[0], 'PR编号', index + 2),
          accountId: this.validateString(row[1], '预算科目ID', index + 2),
          departmentId: this.validateString(row[2], '部门ID', index + 2),
          projectId: row[3] ? String(row[3]) : undefined,
          prAmount: this.validateNumber(row[4], 'PR金额', index + 2),
          prDate: this.validateDate(row[5], 'PR日期', index + 2),
          prTitle: row[6] ? String(row[6]) : undefined,
          description: row[7] ? String(row[7]) : undefined,
        };

        result.data!.push(record);
        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    result.success = result.failCount === 0;
    return result;
  }

  /**
   * 导入PO数据
   */
  importPOData(buffer: Buffer): ImportResult {
    const data = this.parseExcel(buffer);
    const result: ImportResult = {
      success: true,
      total: 0,
      successCount: 0,
      failCount: 0,
      errors: [],
      data: [],
    };

    const rows = data.slice(1);
    result.total = rows.length;

    rows.forEach((row, index) => {
      try {
        const record: PORecordDTO = {
          poNumber: this.validateString(row[0], 'PO编号', index + 2),
          prNumber: this.validateString(row[1], 'PR编号', index + 2),
          poAmount: this.validateNumber(row[2], 'PO金额', index + 2),
          supplier: row[3] ? String(row[3]) : undefined,
          poDate: this.validateDate(row[4], 'PO日期', index + 2),
        };

        result.data!.push(record);
        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    result.success = result.failCount === 0;
    return result;
  }

  /**
   * 导入结算数据
   */
  importSettlementData(buffer: Buffer): ImportResult {
    const data = this.parseExcel(buffer);
    const result: ImportResult = {
      success: true,
      total: 0,
      successCount: 0,
      failCount: 0,
      errors: [],
      data: [],
    };

    const rows = data.slice(1);
    result.total = rows.length;

    rows.forEach((row, index) => {
      try {
        const record: SettlementRecordDTO = {
          settlementNumber: this.validateString(
            row[0],
            '结算单号',
            index + 2,
          ),
          poNumber: this.validateString(row[1], 'PO编号', index + 2),
          settlementAmount: this.validateNumber(row[2], '结算金额', index + 2),
          settlementDate: this.validateDate(row[3], '结算日期', index + 2),
        };

        result.data!.push(record);
        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    result.success = result.failCount === 0;
    return result;
  }

  /**
   * 验证字符串
   */
  private validateString(
    value: any,
    fieldName: string,
    row: number,
  ): string {
    if (!value || String(value).trim() === '') {
      throw new Error(`第${row}行: ${fieldName}不能为空`);
    }
    return String(value).trim();
  }

  /**
   * 验证数字
   */
  private validateNumber(value: any, fieldName: string, row: number): number {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`第${row}行: ${fieldName}必须是数字`);
    }
    if (num < 0) {
      throw new Error(`第${row}行: ${fieldName}不能为负数`);
    }
    return num;
  }

  /**
   * 验证日期
   */
  private validateDate(value: any, fieldName: string, row: number): string {
    if (!value) {
      throw new Error(`第${row}行: ${fieldName}不能为空`);
    }

    // 尝试解析日期
    let date: Date;
    if (typeof value === 'number') {
      // Excel日期序列号
      date = new Date((value - 25569) * 86400 * 1000);
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`第${row}行: ${fieldName}格式不正确`);
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * 生成导入模板
   */
  generateTemplate(type: 'PR' | 'PO' | 'SETTLEMENT'): Buffer {
    const workbook = XLSX.utils.book_new();

    let data: any[][];

    switch (type) {
      case 'PR':
        data = [
          [
            'PR编号',
            '预算科目ID',
            '部门ID',
            '项目ID',
            'PR金额',
            'PR日期',
            'PR标题',
            '描述',
          ],
          [
            'PR-2025-001',
            '科目ID',
            '部门ID',
            '项目ID',
            100000,
            '2025-01-15',
            '设备采购',
            '备注信息',
          ],
        ];
        break;
      case 'PO':
        data = [
          ['PO编号', 'PR编号', 'PO金额', '供应商', 'PO日期'],
          ['PO-2025-001', 'PR-2025-001', 95000, '供应商A', '2025-01-20'],
        ];
        break;
      case 'SETTLEMENT':
        data = [
          ['结算单号', 'PO编号', '结算金额', '结算日期'],
          ['JS-2025-001', 'PO-2025-001', 95000, '2025-02-15'],
        ];
        break;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
