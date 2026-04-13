import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { createHash } from 'crypto';
import {
  PrRecord,
  PoRecord,
  SettlementRecord,
} from '../entities/execution-records.entity';
import { ImportBatch, ImportType } from '../entities/import-batch.entity';
import { ImportRow } from '../entities/import-row.entity';
import { ExcelImportService, ImportResult } from './excel-import.service';
import { BudgetItem } from '../../budget/entities/budget.entity';

@Injectable()
export class DataImportService {
  constructor(
    @InjectRepository(PrRecord)
    private prRepository: Repository<PrRecord>,
    @InjectRepository(PoRecord)
    private poRepository: Repository<PoRecord>,
    @InjectRepository(SettlementRecord)
    private settlementRepository: Repository<SettlementRecord>,
    @InjectRepository(ImportBatch)
    private importBatchRepository: Repository<ImportBatch>,
    @InjectRepository(ImportRow)
    private importRowRepository: Repository<ImportRow>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
    private excelImportService: ExcelImportService,
    private dataSource: DataSource,
  ) {}

  private sha256(input: Buffer | string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private naturalKeyHash(type: ImportType, payload: any): string | undefined {
    const key =
      type === 'PR'
        ? payload?.prNumber
        : type === 'PO'
          ? payload?.poNumber
          : type === 'SETTLEMENT'
            ? payload?.settlementNumber
            : null;
    return key ? this.sha256(String(key).trim()) : undefined;
  }

  /**
   * 导入PR数据
   */
  async importPR(
    buffer: Buffer,
    userId: string,
    filename?: string,
  ): Promise<ImportResult> {
    const parseResult = this.excelImportService.importPRData(buffer);

    if (!parseResult.success) {
      return parseResult;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.save(
        queryRunner.manager.create(ImportBatch, {
          type: 'PR',
          filename: filename || undefined,
          fileHash: this.sha256(buffer),
          total: parseResult.total,
          successCount: parseResult.successCount,
          failCount: parseResult.failCount,
          createdBy: userId,
        }),
      );

      const records = parseResult.data!.map((item) =>
        queryRunner.manager.create(PrRecord, {
          ...item,
          prDate: new Date(item.prDate),
          status: 'pending',
          createdBy: userId,
        }),
      );

      await queryRunner.manager.save(PrRecord, records);

      const rows = parseResult.data!.map((raw, idx) =>
        queryRunner.manager.create(ImportRow, {
          batchId: batch.id,
          rowNumber: idx + 2,
          naturalKeyHash: this.naturalKeyHash('PR', raw),
          raw,
          success: true,
        }),
      );
      await queryRunner.manager.save(ImportRow, rows);

      // 更新预算执行金额（PR账本）
      await this.updatePrLedger(records, queryRunner);

      await queryRunner.commitTransaction();

      return parseResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      parseResult.success = false;
      parseResult.errors.push({
        row: 0,
        message: `数据库保存失败: ${error.message}`,
      });
      return parseResult;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 导入PO数据
   */
  async importPO(
    buffer: Buffer,
    userId: string,
    filename?: string,
  ): Promise<ImportResult> {
    const parseResult = this.excelImportService.importPOData(buffer);

    if (!parseResult.success) {
      return parseResult;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.save(
        queryRunner.manager.create(ImportBatch, {
          type: 'PO',
          filename: filename || undefined,
          fileHash: this.sha256(buffer),
          total: parseResult.total,
          successCount: parseResult.successCount,
          failCount: parseResult.failCount,
          createdBy: userId,
        }),
      );

      // 查找PR记录
      const prNumbers = parseResult.data!.map((item) => item.prNumber);
      const prRecords = await queryRunner.manager.find(PrRecord, {
        where: { prNumber: In(prNumbers) },
      });

      const prMap = new Map(prRecords.map((pr) => [pr.prNumber, pr]));
      const prIdMap = new Map(prRecords.map((pr) => [pr.id, pr]));

      const records: PoRecord[] = [];
      const errors: Array<{ row: number; message: string }> = [];
      const importRows: ImportRow[] = [];

      parseResult.data!.forEach((item, index) => {
        const pr = prMap.get(item.prNumber);
        if (!pr) {
          errors.push({
            row: index + 2,
            message: `PR编号 ${item.prNumber} 不存在`,
          });
          importRows.push(
            queryRunner.manager.create(ImportRow, {
              batchId: batch.id,
              rowNumber: index + 2,
              naturalKeyHash: this.naturalKeyHash('PO', item),
              raw: item,
              success: false,
              errorMessage: `PR编号 ${item.prNumber} 不存在`,
            }),
          );
          return;
        }

        records.push(
          queryRunner.manager.create(PoRecord, {
            ...item,
            prId: pr.id,
            poDate: new Date(item.poDate),
            status: 'pending',
            createdBy: userId,
          }),
        );

        importRows.push(
          queryRunner.manager.create(ImportRow, {
            batchId: batch.id,
            rowNumber: index + 2,
            naturalKeyHash: this.naturalKeyHash('PO', item),
            raw: item,
            success: true,
          }),
        );
      });

      if (errors.length > 0) {
        parseResult.success = false;
        parseResult.errors = [...parseResult.errors, ...errors];
        parseResult.failCount += errors.length;
        parseResult.successCount -= errors.length;
      }

      if (records.length > 0) {
        await queryRunner.manager.save(PoRecord, records);
        await this.updatePoLedger(records, prMap, prIdMap, queryRunner);
      }

      if (importRows.length > 0) {
        await queryRunner.manager.save(ImportRow, importRows);
      }

      await queryRunner.commitTransaction();

      return parseResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      parseResult.success = false;
      parseResult.errors.push({
        row: 0,
        message: `数据库保存失败: ${error.message}`,
      });
      return parseResult;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 导入结算数据
   */
  async importSettlement(
    buffer: Buffer,
    userId: string,
    filename?: string,
  ): Promise<ImportResult> {
    const parseResult = this.excelImportService.importSettlementData(buffer);

    if (!parseResult.success) {
      return parseResult;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.save(
        queryRunner.manager.create(ImportBatch, {
          type: 'SETTLEMENT',
          filename: filename || undefined,
          fileHash: this.sha256(buffer),
          total: parseResult.total,
          successCount: parseResult.successCount,
          failCount: parseResult.failCount,
          createdBy: userId,
        }),
      );

      // 查找PO记录
      const poNumbers = parseResult.data!.map((item) => item.poNumber);
      const poRecords = await queryRunner.manager.find(PoRecord, {
        where: { poNumber: In(poNumbers) },
        relations: ['pr'],
      });

      const poMap = new Map(poRecords.map((po) => [po.poNumber, po]));

      const records: SettlementRecord[] = [];
      const errors: Array<{ row: number; message: string }> = [];
      const importRows: ImportRow[] = [];

      parseResult.data!.forEach((item, index) => {
        const po = poMap.get(item.poNumber);
        if (!po) {
          errors.push({
            row: index + 2,
            message: `PO编号 ${item.poNumber} 不存在`,
          });
          importRows.push(
            queryRunner.manager.create(ImportRow, {
              batchId: batch.id,
              rowNumber: index + 2,
              naturalKeyHash: this.naturalKeyHash('SETTLEMENT', item),
              raw: item,
              success: false,
              errorMessage: `PO编号 ${item.poNumber} 不存在`,
            }),
          );
          return;
        }

        records.push(
          queryRunner.manager.create(SettlementRecord, {
            ...item,
            poId: po.id,
            settlementDate: new Date(item.settlementDate),
            status: 'pending',
            createdBy: userId,
          }),
        );

        importRows.push(
          queryRunner.manager.create(ImportRow, {
            batchId: batch.id,
            rowNumber: index + 2,
            naturalKeyHash: this.naturalKeyHash('SETTLEMENT', item),
            raw: item,
            success: true,
          }),
        );
      });

      if (errors.length > 0) {
        parseResult.success = false;
        parseResult.errors = [...parseResult.errors, ...errors];
        parseResult.failCount += errors.length;
        parseResult.successCount -= errors.length;
      }

      if (records.length > 0) {
        await queryRunner.manager.save(SettlementRecord, records);

        // 更新实际结算（结算账本）
        await this.updateSettlementLedger(records, poRecords, queryRunner);
      }

      if (importRows.length > 0) {
        await queryRunner.manager.save(ImportRow, importRows);
      }

      await queryRunner.commitTransaction();

      return parseResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      parseResult.success = false;
      parseResult.errors.push({
        row: 0,
        message: `数据库保存失败: ${error.message}`,
      });
      return parseResult;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 更新PR账本（按PR累计）
   */
  private async updatePrLedger(
    prRecords: PrRecord[],
    queryRunner: any,
  ): Promise<void> {
    for (const pr of prRecords) {
      // 查找对应的预算明细
      const budgetItem = await queryRunner.manager.findOne(BudgetItem, {
        where: {
          accountId: pr.accountId,
          departmentId: pr.departmentId,
          projectId: pr.projectId || null,
        },
      });

      if (budgetItem) {
        budgetItem.prCommittedAmount =
          Number(budgetItem.prCommittedAmount) + Number(pr.prAmount);
        // 兼容旧字段
        budgetItem.executedAmount = Number(budgetItem.prCommittedAmount);
        budgetItem.remainingAmount =
          Number(budgetItem.budgetAmount) - Number(budgetItem.prCommittedAmount);

        await queryRunner.manager.save(BudgetItem, budgetItem);
      }
    }
  }

  /**
   * 更新PO账本（按PO累计）
   */
  private async updatePoLedger(
    poRecords: PoRecord[],
    prMap: Map<string, PrRecord>,
    prIdMap: Map<string, PrRecord>,
    queryRunner: any,
  ): Promise<void> {
    for (const po of poRecords) {
      const pr =
        prMap.get((po as any).prNumber) || prIdMap.get((po as any).prId);
      const accountId = pr?.accountId;
      const departmentId = pr?.departmentId;
      const projectId = pr?.projectId || null;
      if (!accountId || !departmentId) continue;

      // 查找对应的预算明细
      const budgetItem = await queryRunner.manager.findOne(BudgetItem, {
        where: {
          accountId,
          departmentId,
          projectId,
        },
      });

      if (budgetItem) {
        budgetItem.poCommittedAmount =
          Number(budgetItem.poCommittedAmount) + Number(po.poAmount);

        await queryRunner.manager.save(BudgetItem, budgetItem);
      }
    }
  }

  /**
   * 更新结算账本（按结算累计）
   */
  private async updateSettlementLedger(
    settlementRecords: SettlementRecord[],
    poRecords: PoRecord[],
    queryRunner: any,
  ): Promise<void> {
    const poMap = new Map(poRecords.map((po) => [po.id, po]));

    for (const settlement of settlementRecords) {
      const po = poMap.get(settlement.poId);
      const pr = (po as any)?.pr;
      const accountId = pr?.accountId;
      const departmentId = pr?.departmentId;
      const projectId = pr?.projectId || null;
      if (!accountId || !departmentId) continue;

      const budgetItem = await queryRunner.manager.findOne(BudgetItem, {
        where: { accountId, departmentId, projectId },
      });

      if (budgetItem) {
        budgetItem.actualSettledAmount =
          Number(budgetItem.actualSettledAmount) +
          Number(settlement.settlementAmount);
        await queryRunner.manager.save(BudgetItem, budgetItem);
      }
    }
  }

  /**
   * 下载导入模板
   */
  downloadTemplate(type: 'PR' | 'PO' | 'SETTLEMENT'): Buffer {
    return this.excelImportService.generateTemplate(type);
  }
}
