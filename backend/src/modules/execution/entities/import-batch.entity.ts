import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ImportType = 'PR' | 'PO' | 'SETTLEMENT' | 'FINANCE_CALIBRATION';

@Entity('import_batches')
export class ImportBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  type: ImportType;

  @Column({ length: 200, nullable: true })
  filename!: string;

  @Column({ type: 'text', nullable: true })
  fileHash!: string;

  @Column({ type: 'integer', default: 0 })
  total: number;

  @Column({ type: 'integer', default: 0 })
  successCount: number;

  @Column({ type: 'integer', default: 0 })
  failCount: number;

  @Column({ type: 'jsonb', nullable: true })
  meta: any;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string;

  @CreateDateColumn()
  createdAt: Date;
}
