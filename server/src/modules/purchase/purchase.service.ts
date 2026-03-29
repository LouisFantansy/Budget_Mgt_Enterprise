import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建采购申请
   */
  async create(createPurchaseRequestDto: CreatePurchaseRequestDto, userId: string) {
    const { items, budgetId, budgetItemId, ...requestData } = createPurchaseRequestDto;

    // 验证预算是否存在
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('预算不存在');
    }

    // 生成采购申请编号
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseRequest.count();
    const requestNo = `PR-${year}-${String(count + 1).padStart(3, '0')}`;

    // 计算总金额
    const totalAmount = items.reduce((sum, item) => {
      return sum + parseFloat(item.unitPrice) * item.quantity;
    }, 0);

    // 创建采购申请及明细
    const purchaseRequest = await this.prisma.purchaseRequest.create({
      data: {
        requestNo,
        applicantId: userId,
        departmentId: budget.departmentId,
        budgetId,
        budgetItemId,
        totalAmount,
        items: {
          create: items.map((item, index) => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice),
            totalAmount: parseFloat(item.unitPrice) * item.quantity,
          }))
        },
        ...requestData,
      },
      include: {
        budget: true,
        items: true,
      },
    });

    return purchaseRequest;
  }

  /**
   * 获取采购申请列表
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    budgetId?: string;
    status?: string;
    applicantId?: string;
  }) {
    const { page = 1, pageSize = 20, budgetId, status, applicantId } = params;

    const where: any = {};
    if (budgetId) where.budgetId = budgetId;
    if (status) where.status = status;
    if (applicantId) where.applicantId = applicantId;

    const [total, requests] = await Promise.all([
      this.prisma.purchaseRequest.count({ where }),
      this.prisma.purchaseRequest.findMany({
        where,
        include: {
          budget: {
            select: {
              budgetNo: true,
              name: true,
              department: true,
            }
          },
          items: {
            take: 3, // 只返回前 3 个明细
          },
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
      items: requests,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取采购申请详情
   */
  async findOne(id: string) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        budget: {
          include: {
            department: true,
          }
        },
        items: {
          orderBy: { id: 'asc' }
        },
        approvals: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        attachments: true,
      },
    });

    if (!request) {
      throw new NotFoundException('采购申请不存在');
    }

    return request;
  }

  /**
   * 提交审批
   */
  async submitForApproval(id: string) {
    const request = await this.findOne(id);

    if (request.status !== 'DRAFT') {
      throw new NotFoundException('只有草稿状态的采购申请可以提交审批');
    }

    // 检查是否已占用预算
    if (request.budget.frozenAmount < request.totalAmount) {
      // 需要更新预算的冻结金额
      await this.prisma.budget.update({
        where: { id: request.budgetId },
        data: {
          frozenAmount: request.budget.frozenAmount.toNumber() + parseFloat(request.totalAmount),
        },
      });
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { 
        status: 'PENDING',
        currentStep: 1,
      },
    });
  }

  /**
   * 更新采购申请
   */
  async update(id: string, updateData: any) {
    await this.findOne(id);

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });
  }

  /**
   * 删除采购申请
   */
  async remove(id: string) {
    const request = await this.findOne(id);

    if (request.status !== 'DRAFT' && request.status !== 'CANCELLED') {
      throw new NotFoundException('只能删除草稿或已取消的采购申请');
    }

    return this.prisma.purchaseRequest.delete({
      where: { id },
    });
  }
}
