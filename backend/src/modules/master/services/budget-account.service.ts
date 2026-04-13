import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetAccount } from '../entities/budget-account.entity';

@Injectable()
export class BudgetAccountService {
  constructor(
    @InjectRepository(BudgetAccount)
    private accountRepository: Repository<BudgetAccount>,
  ) {}

  async create(createDto: Partial<BudgetAccount>): Promise<BudgetAccount> {
    const account = this.accountRepository.create(createDto);
    return await this.accountRepository.save(account);
  }

  async findAll(): Promise<BudgetAccount[]> {
    return await this.accountRepository.find({
      relations: ['parent', 'children'],
      order: { accountCode: 'ASC' },
    });
  }

  async findTree(): Promise<BudgetAccount[]> {
    return await this.accountRepository.find({
      where: { parentId: null as any },
      relations: ['children', 'children.children'],
      order: { accountCode: 'ASC' },
    });
  }

  async findOne(id: string): Promise<BudgetAccount> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!account) {
      throw new NotFoundException(`科目 ${id} 不存在`);
    }
    return account;
  }

  async findByType(type: string): Promise<BudgetAccount[]> {
    return await this.accountRepository.find({
      where: { accountType: type },
      order: { accountCode: 'ASC' },
    });
  }

  async findLeafAccounts(): Promise<BudgetAccount[]> {
    return await this.accountRepository.find({
      where: { isLeaf: true },
      order: { accountCode: 'ASC' },
    });
  }

  async update(
    id: string,
    updateDto: Partial<BudgetAccount>,
  ): Promise<BudgetAccount> {
    const account = await this.findOne(id);
    Object.assign(account, updateDto);
    return await this.accountRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    await this.accountRepository.remove(account);
  }
}
