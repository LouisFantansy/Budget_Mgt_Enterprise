import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BudgetAdjustment } from '../entities/budget-adjustment.entity';
import { Budget, BudgetItem } from '../../budget/entities/budget.entity';

@Injectable()
export class AdjustmentService {
  constructor(
    @InjectRepository(BudgetAdjustment)
    private adjustmentRepository: Repository<BudgetAdjustment>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
    private dataSource: DataSource,
  ) {}

  async createRequest(input: {
    budgetId: string;
    itemId: string;
    adjustedAmount: number;
    reason: string;
    requestedBy: string;
  }): Promise<BudgetAdjustment> {
    const item = await this.budgetItemRepository.findOne({
      where: { id: input.itemId },
    });
    if (!item) throw new NotFoundException('预算明细不存在');
    if (item.budgetId !== input.budgetId) {
      throw new BadRequestException('预算与明细不匹配');
    }

    const originalAmount = Number(item.budgetAmount);
    const adjustedAmount = Number(input.adjustedAmount);
    if (Number.isNaN(adjustedAmount) || adjustedAmount < 0) {
      throw new BadRequestException('调整后金额必须为非负数字');
    }

    const adjustmentAmount = adjustedAmount - originalAmount;

    return await this.adjustmentRepository.save(
      this.adjustmentRepository.create({
        budgetId: input.budgetId,
        itemId: input.itemId,
        originalAmount,
        adjustedAmount,
        adjustmentAmount: Math.abs(adjustmentAmount),
        adjustmentType: adjustmentAmount >= 0 ? 'increase' : 'decrease',
        reason: input.reason,
        status: 'pending',
        requestedBy: input.requestedBy,
      }),
    );
  }

  async list(budgetId?: string): Promise<BudgetAdjustment[]> {
    return await this.adjustmentRepository.find({
      where: budgetId ? { budgetId } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: string, approvedBy: string): Promise<BudgetAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({ where: { id } });
    if (!adjustment) throw new NotFoundException('调整单不存在');
    if (adjustment.status !== 'pending') {
      throw new BadRequestException('仅待审批的调整单可审批');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const item = await queryRunner.manager.findOne(BudgetItem, {
        where: { id: adjustment.itemId },
      });
      if (!item) throw new NotFoundException('预算明细不存在');

      item.budgetAmount = Number(adjustment.adjustedAmount);
      // remainingAmount 基于PR账本计算（研发默认口径），后续可按 ledger 参数动态计算
      item.remainingAmount =
        Number(item.budgetAmount) - Number(item.prCommittedAmount || 0);
      await queryRunner.manager.save(BudgetItem, item);

      adjustment.status = 'approved';
      adjustment.approvedBy = approvedBy;
      adjustment.approvedAt = new Date();
      const saved = await queryRunner.manager.save(BudgetAdjustment, adjustment);

      // 更新预算总额与状态
      const sum = await queryRunner.manager
        .createQueryBuilder(BudgetItem, 'item')
        .select('SUM(item.budgetAmount)', 'total')
        .where('item.budgetId = :budgetId', { budgetId: adjustment.budgetId })
        .getRawOne();

      await queryRunner.manager.update(Budget, adjustment.budgetId, {
        totalAmount: sum.total || 0,
        status: 'adjusted',
      });

      await queryRunner.commitTransaction();
      return saved;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async reject(id: string, approvedBy: string): Promise<BudgetAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({ where: { id } });
    if (!adjustment) throw new NotFoundException('调整单不存在');
    if (adjustment.status !== 'pending') {
      throw new BadRequestException('仅待审批的调整单可驳回');
    }
    adjustment.status = 'rejected';
    adjustment.approvedBy = approvedBy;
    adjustment.approvedAt = new Date();
    return await this.adjustmentRepository.save(adjustment);
  }
}

