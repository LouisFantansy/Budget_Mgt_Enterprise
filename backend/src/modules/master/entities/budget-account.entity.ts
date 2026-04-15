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

@Entity('budget_accounts')
export class BudgetAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  accountCode: string;

  @Column({ length: 100 })
  accountName: string;

  @Column({ length: 20 })
  accountType: string; // CAPEX, OPEX

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => BudgetAccount, (account) => account.children)
  @JoinColumn({ name: 'parent_id' })
  parent: BudgetAccount;

  @OneToMany(() => BudgetAccount, (account) => account.parent)
  children: BudgetAccount[];

  @Column({ type: 'integer' })
  accountLevel: number;

  @Column({ type: 'boolean', default: true })
  isLeaf: boolean;

  @Column({
    length: 20,
    default: 'active',
  })
  status: string; // active, inactive

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
