import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建预算
   */
  async create(createBudgetDto: CreateBudgetDto) {
    const { items, ...budgetData } = createBudgetDto;

    // 生成预算编号
    const year = new Date().getFullYear();
    const count = await this.prisma.budget.count();
    const budgetNo = `BG-${year}-${String(count + 1).padStart(3, '0')}`;

    // 创建预算及明细
    const budget = await this.prisma.budget.create({
      data: {
        ...budgetData,
        totalAmount: parseFloat(budgetData.totalAmount),
        budgetNo,
        department: {
          connect: { id: budgetData.departmentId }
        },
        items: items && items.length > 0 ? {
          create: items.map((item, index) => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice),
            totalAmount: parseFloat(item.unitPrice) * item.quantity,
            sortOrder: item.sortOrder || index,
          }))
        } : undefined,
      },
      include: {
        department: true,
        items: true,
      },
    });

    return budget;
  }

  /**
   * 获取预算列表
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    departmentId?: string;
    year?: number;
    status?: string;
  }) {
    const { page = 1, pageSize = 20, departmentId, year, status } = params;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (year) where.year = year;
    if (status) where.status = status;

    const [total, budgets] = await Promise.all([
      this.prisma.budget.count({ where }),
      this.prisma.budget.findMany({
        where,
        include: {
          department: true,
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: budgets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取预算详情
   */
  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        department: true,
        items: {
          orderBy: { sortOrder: 'asc' }
        },
        approvals: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('预算不存在');
    }

    return budget;
  }

  /**
   * 提交审批
   */
  async submitForApproval(id: string) {
    const budget = await this.findOne(id);

    if (budget.status !== 'DRAFT') {
      throw new NotFoundException('只有草稿状态的预算可以提交审批');
    }

    return this.prisma.budget.update({
      where: { id },
      data: { status: 'PENDING' },
    });
  }

  /**
   * 更新预算
   */
  async update(id: string, updateData: any) {
    await this.findOne(id);

    return this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        items: true,
      },
    });
  }

  /**
   * 删除预算
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.budget.delete({
      where: { id },
    });
  }
}
