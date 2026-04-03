import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建部门
   */
  async create(createDepartmentDto: CreateDepartmentDto) {
    // 检查部门编码是否已存在
    const existing = await this.prisma.department.findUnique({
      where: { code: createDepartmentDto.code },
    });

    if (existing) {
      throw new NotFoundException('部门编码已存在');
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * 获取部门树
   * 数据隔离：非 admin 用户只能查看本部门及子部门
   */
  async findAllTree(user?: { userId: string; departmentId: string; roles: string[] }) {
    const departments = await this.prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        parent: true,
        children: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // 数据隔离：非 admin 用户只能查看本部门及子部门
    if (user && !user.roles.includes('admin')) {
      // 获取用户部门及其所有子部门 ID
      const allowedIds = this.getDepartmentAndChildrenIds(departments, user.departmentId);
      const filteredDepartments = departments.filter(d => allowedIds.includes(d.id));
      return this.buildDepartmentTree(filteredDepartments);
    }

    // 构建树形结构
    return this.buildDepartmentTree(departments);
  }

  /**
   * 获取部门及其所有子部门的 ID 列表
   */
  private getDepartmentAndChildrenIds(departments: any[], parentId: string): string[] {
    const ids = [parentId];
    const children = departments.filter(d => d.parentId === parentId);
    for (const child of children) {
      ids.push(...this.getDepartmentAndChildrenIds(departments, child.id));
    }
    return ids;
  }

  /**
   * 获取部门详情
   * 数据隔离：非 admin 用户只能查看本部门及子部门
   */
  async findOne(
    id: string,
    user?: { userId: string; departmentId: string; roles: string[] },
  ) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        budgets: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    // 数据隔离：非 admin 用户只能查看本部门及子部门
    if (user && !user.roles.includes('admin')) {
      const allDepartments = await this.prisma.department.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, parentId: true },
      });
      const allowedIds = this.getDepartmentAndChildrenIds(allDepartments, user.departmentId);
      if (!allowedIds.includes(id)) {
        throw new ForbiddenException('无权查看该部门');
      }
    }

    return department;
  }

  /**
   * 更新部门
   */
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    // 验证部门是否存在
    await this.findOne(id);

    // 如果修改了编码，检查新编码是否已存在
    if (updateDepartmentDto.code) {
      const existing = await this.prisma.department.findFirst({
        where: {
          code: updateDepartmentDto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new NotFoundException('部门编码已存在');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * 删除部门（软删除）
   */
  async remove(id: string) {
    // 验证部门是否存在
    const department = await this.findOne(id);

    // 检查是否有子部门
    if (department.children.length > 0) {
      throw new NotFoundException('该部门存在子部门，无法删除');
    }

    // 检查是否有用户
    if (department.users && department.users.length > 0) {
      throw new NotFoundException('该部门存在用户，无法删除');
    }

    // 软删除：将状态设置为 INACTIVE
    return this.prisma.department.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  /**
   * 构建部门树形结构
   */
  private buildDepartmentTree(departments: any[], parentId: string | null = null) {
    return departments
      .filter((dept) => dept.parentId === parentId)
      .map((dept) => ({
        ...dept,
        children: this.buildDepartmentTree(departments, dept.id),
      }));
  }
}
