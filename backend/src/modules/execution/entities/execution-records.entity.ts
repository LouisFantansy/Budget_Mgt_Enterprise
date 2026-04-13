import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../master/entities/organization.entity';

// PR记录表
@Entity('pr_records')
export class PrRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  prNumber: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'department_id' })
  department: Organization;

  @Column({ type: 'uuid', nullable: true })
  projectId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  prAmount: number;

  @Column({ type: 'date' })
  prDate: Date;

  @Column({ length: 200, nullable: true })
  prTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending, approved, rejected, completed

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// PO记录表
@Entity('po_records')
export class PoRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  poNumber: string;

  @Column({ type: 'uuid' })
  prId: string;

  @ManyToOne(() => PrRecord)
  @JoinColumn({ name: 'pr_id' })
  pr: PrRecord;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  poAmount: number;

  @Column({ length: 100, nullable: true })
  supplier: string;

  @Column({ type: 'date' })
  poDate: Date;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending, confirmed, completed, cancelled

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 结算记录表
@Entity('settlement_records')
export class SettlementRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  settlementNumber: string;

  @Column({ type: 'uuid' })
  poId: string;

  @ManyToOne(() => PoRecord)
  @JoinColumn({ name: 'po_id' })
  po: PoRecord;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  settlementAmount: number;

  @Column({ type: 'date' })
  settlementDate: Date;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending, confirmed, completed

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
