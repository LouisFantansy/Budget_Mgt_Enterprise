import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('import_rows')
@Index(['batchId', 'rowNumber'], { unique: true })
@Index(['naturalKeyHash'], { unique: false })
export class ImportRow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batchId: string;

  @Column({ type: 'integer' })
  rowNumber: number;

  // natural key hash (e.g. PR: prNumber; PO: poNumber; Settlement: settlementNumber)
  @Column({ type: 'text', nullable: true })
  naturalKeyHash!: string;

  // raw row data snapshot (for audit/reproduction)
  @Column({ type: 'jsonb' })
  raw: any;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string;

  @CreateDateColumn()
  createdAt: Date;
}
