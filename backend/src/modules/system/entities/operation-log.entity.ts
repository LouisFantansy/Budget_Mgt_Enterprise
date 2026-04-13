import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 100 })
  module: string;

  @Column({ length: 100 })
  operation: string;

  @Column({ length: 50, nullable: true })
  method: string;

  @Column({ length: 255, nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  params: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ length: 20 })
  ip: string;

  @Column({ type: 'integer', nullable: true })
  duration: number;

  @Column({ length: 20, default: 'success' })
  status: string; // success, failed

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
