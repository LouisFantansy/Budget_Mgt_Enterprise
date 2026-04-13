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

@Entity('ipd_projects')
export class IpdProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  projectCode: string;

  @Column({ length: 200 })
  projectName: string;

  @Column({ length: 50 })
  projectType: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => IpdProject, (project) => project.children)
  @JoinColumn({ name: 'parent_id' })
  parent: IpdProject;

  @OneToMany(() => IpdProject, (project) => project.parent)
  children: IpdProject[];

  @Column({ type: 'uuid', nullable: true })
  managerId: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    length: 20,
    default: 'planning',
  })
  status: string; // planning, ongoing, completed, paused

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetAmount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
