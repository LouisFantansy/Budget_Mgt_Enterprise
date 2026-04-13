import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('budget_adjustments')
export class BudgetAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  budgetId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  adjustedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  adjustmentAmount: number;

  @Column({ length: 20, default: 'increase' })
  adjustmentType: string; // increase, decrease

  @Column({ type: 'text' })
  reason: string;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending, approved, rejected

  @Column({ type: 'uuid' })
  requestedBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
