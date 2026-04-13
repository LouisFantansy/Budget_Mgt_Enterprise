import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, name: 'role_code' })
  roleCode: string;

  @Column({ length: 100, name: 'role_name' })
  roleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false, name: 'is_system' })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
