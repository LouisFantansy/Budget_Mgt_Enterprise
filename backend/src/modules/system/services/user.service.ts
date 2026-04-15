import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(query?: {
    keyword?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: User[]; total: number }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (query?.keyword) {
      queryBuilder.andWhere(
        '(user.username LIKE :kw OR user.realName LIKE :kw OR user.email LIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }
    if (query?.status) {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    const [data, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException(`用户 ${id} 不存在`);
    return user;
  }

  async create(createUserDto: {
    username: string;
    password: string;
    realName: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    roleCodes?: string[];
  }): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existing) throw new BadRequestException('用户名已存在');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      username: createUserDto.username,
      password: hashedPassword,
      realName: createUserDto.realName,
      email: createUserDto.email,
      phone: createUserDto.phone,
      departmentId: createUserDto.departmentId,
      status: 'active',
    });

    if (createUserDto.roleCodes && createUserDto.roleCodes.length > 0) {
      const roles = await this.roleRepository
        .createQueryBuilder('role')
        .where('role.roleCode IN (:...codes)', { codes: createUserDto.roleCodes })
        .getMany();
      user.roles = roles;
    }

    return await this.userRepository.save(user);
  }

  async update(
    id: string,
    updateUserDto: {
      realName?: string;
      email?: string;
      phone?: string;
      departmentId?: string;
      status?: string;
      roleCodes?: string[];
    },
  ): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.realName) user.realName = updateUserDto.realName;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.phone) user.phone = updateUserDto.phone;
    if (updateUserDto.departmentId)
      user.departmentId = updateUserDto.departmentId;
    if (updateUserDto.status) user.status = updateUserDto.status;

    if (updateUserDto.roleCodes) {
      const roles = await this.roleRepository
        .createQueryBuilder('role')
        .where('role.roleCode IN (:...codes)', {
          codes: updateUserDto.roleCodes,
        })
        .getMany();
      user.roles = roles;
    }

    return await this.userRepository.save(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async findAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find();
  }
}
