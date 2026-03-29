import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户列表
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    departmentId?: string;
    status?: string;
  }) {
    const { page = 1, pageSize = 20, departmentId, status } = params;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          department: true,
          roles: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户详情
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 创建用户
   */
  async create(data: any) {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new NotFoundException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        roles: data.roleIds ? {
          connect: data.roleIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: {
        department: true,
        roles: true,
      },
    });
  }

  /**
   * 更新用户
   */
  async update(id: string, data: any) {
    await this.findOne(id);

    // 如果修改密码，需要加密
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        roles: data.roleIds ? {
          set: [],
          connect: data.roleIds.map((roleId: string) => ({ id: roleId }))
        } : undefined,
      },
      include: {
        department: true,
        roles: true,
      },
    });
  }

  /**
   * 删除用户
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * 重置用户密码
   */
  async resetPassword(id: string, newPassword: string) {
    await this.findOne(id);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
