import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Budget, BudgetItem } from '../entities/budget.entity';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建预算
   */
  async create(createBudgetDto: Partial<Budget>): Promise<Budget> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建预算主表
      const budget = queryRunner.manager.create(Budget, {
        ...createBudgetDto,
        status: 'draft',
        version: 'V1.0',
        totalAmount: 0,
      });
      await queryRunner.manager.save(budget);

      await queryRunner.commitTransaction();
      return budget;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 添加预算明细
   */
  async addItem(
    budgetId: string,
    addItemDto: Partial<BudgetItem>,
  ): Promise<BudgetItem> {
    const budget = await this.findOne(budgetId);
    if (budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能添加明细');
    }

    const item = this.budgetItemRepository.create({
      ...addItemDto,
      budgetId,
      executedAmount: 0,
      remainingAmount: addItemDto.budgetAmount || 0,
    });

    const savedItem = await this.budgetItemRepository.save(item);

    // 更新预算总额
    await this.updateTotalAmount(budgetId);

    return savedItem;
  }

  /**
   * 批量添加预算明细
   */
  async addItems(
    budgetId: string,
    items: Partial<BudgetItem>[],
  ): Promise<BudgetItem[]> {
    const budget = await this.findOne(budgetId);
    if (budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能添加明细');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const budgetItems = items.map((item) =>
        queryRunner.manager.create(BudgetItem, {
          ...item,
          budgetId,
          executedAmount: 0,
          remainingAmount: item.budgetAmount || 0,
        }),
      );

      const savedItems = await queryRunner.manager.save(BudgetItem, budgetItems);

      await queryRunner.commitTransaction();

      // 更新预算总额
      await this.updateTotalAmount(budgetId);

      return savedItems;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 查询所有预算
   */
  async findAll(query?: {
    year?: number;
    type?: string;
    status?: string;
    orgId?: string;
  }): Promise<Budget[]> {
    const queryBuilder = this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.organization', 'organization')
      .leftJoinAndSelect('budget.items', 'items');

    if (query?.year) {
      queryBuilder.andWhere('budget.budgetYear = :year', { year: query.year });
    }
    if (query?.type) {
      queryBuilder.andWhere('budget.budgetType = :type', { type: query.type });
    }
    if (query?.status) {
      queryBuilder.andWhere('budget.status = :status', {
        status: query.status,
      });
    }
    if (query?.orgId) {
      queryBuilder.andWhere('budget.organizationId = :orgId', {
        orgId: query.orgId,
      });
    }

    return await queryBuilder
      .orderBy('budget.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 查询预算详情
   */
  async findOne(id: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['organization', 'items', 'items.department'],
    });

    if (!budget) {
      throw new NotFoundException(`预算 ${id} 不存在`);
    }

    return budget;
  }

  /**
   * 更新预算
   */
  async update(
    id: string,
    updateBudgetDto: Partial<Budget>,
  ): Promise<Budget> {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能修改');
    }

    Object.assign(budget, updateBudgetDto);
    return await this.budgetRepository.save(budget);
  }

  /**
   * 更新预算明细
   */
  async updateItem(
    itemId: string,
    updateItemDto: Partial<BudgetItem>,
  ): Promise<BudgetItem> {
    const item = await this.budgetItemRepository.findOne({
      where: { id: itemId },
      relations: ['budget'],
    });

    if (!item) {
      throw new NotFoundException(`预算明细 ${itemId} 不存在`);
    }

    if (item.budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能修改明细');
    }

    Object.assign(item, updateItemDto);
    const savedItem = await this.budgetItemRepository.save(item);

    // 更新预算总额
    await this.updateTotalAmount(item.budgetId);

    return savedItem;
  }

  /**
   * 删除预算明细
   */
  async removeItem(itemId: string): Promise<void> {
    const item = await this.budgetItemRepository.findOne({
      where: { id: itemId },
      relations: ['budget'],
    });

    if (!item) {
      throw new NotFoundException(`预算明细 ${itemId} 不存在`);
    }

    if (item.budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能删除明细');
    }

    await this.budgetItemRepository.remove(item);

    // 更新预算总额
    await this.updateTotalAmount(item.budgetId);
  }

  /**
   * 提交审批
   */
  async submit(id: string, userId: string): Promise<Budget> {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能提交审批');
    }

    if (!budget.items || budget.items.length === 0) {
      throw new BadRequestException('预算明细不能为空');
    }

    budget.status = 'submitted';
    budget.createdBy = userId;
    return await this.budgetRepository.save(budget);
  }

  /**
   * 审批通过
   */
  async approve(id: string, userId: string): Promise<Budget> {
    const budget = await this.findOne(id);
    if (budget.status !== 'submitted') {
      throw new BadRequestException('只有待审批状态的预算才能审批');
    }

    budget.status = 'approved';
    budget.approvedBy = userId;
    budget.approvedAt = new Date();
    return await this.budgetRepository.save(budget);
  }

  /**
   * 审批拒绝
   */
  async reject(id: string, reason: string): Promise<Budget> {
    const budget = await this.findOne(id);
    if (budget.status !== 'submitted') {
      throw new BadRequestException('只有待审批状态的预算才能拒绝');
    }

    budget.status = 'rejected';
    budget.description = `${budget.description || ''}\n拒绝原因: ${reason}`;
    return await this.budgetRepository.save(budget);
  }

  /**
   * 删除预算
   */
  async remove(id: string): Promise<void> {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的预算才能删除');
    }

    await this.budgetRepository.remove(budget);
  }

  /**
   * 更新预算总额
   */
  private async updateTotalAmount(budgetId: string): Promise<void> {
    const result = await this.budgetItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.budgetAmount)', 'total')
      .where('item.budgetId = :budgetId', { budgetId })
      .getRawOne();

    await this.budgetRepository.update(budgetId, {
      totalAmount: result.total || 0,
    });
  }

  /**
   * 获取预算执行情况
   */
  async getExecutionStatus(id: string): Promise<any> {
    const budget = await this.findOne(id);

    const items = budget.items.map((item) => ({
      ...item,
      prExecutionRate:
        item.budgetAmount > 0
          ? (Number(item.prCommittedAmount) / Number(item.budgetAmount)) * 100
          : 0,
      poExecutionRate:
        item.budgetAmount > 0
          ? (Number(item.poCommittedAmount) / Number(item.budgetAmount)) * 100
          : 0,
      actualExecutionRate:
        item.budgetAmount > 0
          ? (Number(item.actualSettledAmount) / Number(item.budgetAmount)) * 100
          : 0,
    }));

    const totalPrCommitted = items.reduce(
      (sum, item) => sum + Number(item.prCommittedAmount),
      0,
    );
    const totalPoCommitted = items.reduce(
      (sum, item) => sum + Number(item.poCommittedAmount),
      0,
    );
    const totalActualSettled = items.reduce(
      (sum, item) => sum + Number(item.actualSettledAmount),
      0,
    );

    return {
      budget,
      items,
      summary: {
        totalBudget: budget.totalAmount,
        totalPrCommitted,
        totalPoCommitted,
        totalActualSettled,
        totalRemaining:
          Number(budget.totalAmount) - Number(totalActualSettled || 0),
        prExecutionRate:
          Number(budget.totalAmount) > 0
            ? (totalPrCommitted / Number(budget.totalAmount)) * 100
            : 0,
        poExecutionRate:
          Number(budget.totalAmount) > 0
            ? (totalPoCommitted / Number(budget.totalAmount)) * 100
            : 0,
        actualExecutionRate:
          Number(budget.totalAmount) > 0
            ? (totalActualSettled / Number(budget.totalAmount)) * 100
            : 0,
      },
    };
  }
}
