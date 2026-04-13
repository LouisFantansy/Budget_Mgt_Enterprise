import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../master/entities/organization.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  budgetYear: number;

  @Column({ length: 20 })
  budgetType: string; // CAPEX, OPEX

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 20, default: 'draft' })
  status: string; // draft, submitted, approved, rejected, adjusted

  @Column({ length: 20, default: 'V1.0' })
  version: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BudgetItem, (item) => item.budget)
  items: BudgetItem[];
}

// 预算明细表
@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  budgetId: string;

  @ManyToOne(() => Budget, (budget) => budget.items)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'department_id' })
  department: Organization;

  @Column({ type: 'uuid', nullable: true })
  projectId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budgetAmount: number;

  // PR账本：承诺/在途金额（研发可见）
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  prCommittedAmount: number;

  // PO账本：承诺金额（仅采购/财务可见）
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  poCommittedAmount: number;

  // 实际：财务结算/完结金额（仅采购/财务可见）
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualSettledAmount: number;

  // 兼容旧字段：历史实现使用 executedAmount 作为执行金额
  // 后续重构将以 prCommittedAmount / poCommittedAmount / actualSettledAmount 为准
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  executedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
