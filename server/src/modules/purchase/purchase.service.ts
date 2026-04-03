import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { WorkflowEngineService } from '../workflow/workflow-engine.service';

@Injectable()
export class PurchaseService {
  constructor(
    private prisma: PrismaService,
    private workflowEngineService: WorkflowEngineService,
  ) {}

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
   * 数据隔离：非 admin 用户只能查看本部门采购申请
   */
  async findAll(
    params: {
      page?: number;
      pageSize?: number;
      budgetId?: string;
      status?: string;
      applicantId?: string;
    },
    user?: { userId: string; departmentId: string; roles: string[] },
  ) {
    const { page = 1, pageSize = 20, budgetId, status, applicantId } = params;

    const where: any = {};
    
    // 数据隔离：非 admin 用户只能查看本部门采购申请
    if (user && !user.roles.includes('admin')) {
      where.departmentId = user.departmentId;
    }
    
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
   * 数据隔离：非 admin 用户只能查看本部门采购申请
   */
  async findOne(
    id: string,
    user?: { userId: string; departmentId: string; roles: string[] },
  ) {
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

    // 数据隔离：非 admin 用户只能查看本部门采购申请
    if (user && !user.roles.includes('admin') && request.departmentId !== user.departmentId) {
      throw new ForbiddenException('无权查看该采购申请');
    }

    return request;
  }

  /**
   * 提交审批
   */
  async submitForApproval(id: string) {
    const request = await this.findOne(id);

    if (request.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的采购申请可以提交审批');
    }

    const budgetId = request.budgetId;
    const requestAmount = request.totalAmount.toNumber();

    // 使用 Prisma 事务 + 行锁防止并发竞态
    await this.prisma.$transaction(async (tx) => {
      // SELECT ... FOR UPDATE 行锁
      const budgets = await tx.$queryRaw<Array<{
        id: string;
        totalAmount: number;
        usedAmount: number;
        frozenAmount: number;
      }>>`
        SELECT * FROM "Budget" WHERE id = ${budgetId}::uuid FOR UPDATE
      `;

      if (!budgets || budgets.length === 0) {
        throw new NotFoundException('预算不存在');
      }

      const budget = budgets[0];

      // 检查余额
      const available = Number(budget.totalAmount) - Number(budget.usedAmount) - Number(budget.frozenAmount);
      if (available < requestAmount) {
        throw new BadRequestException('预算余额不足');
      }

      // 更新冻结金额
      await tx.budget.update({
        where: { id: budgetId },
        data: {
          frozenAmount: {
            increment: requestAmount,
          },
        },
      });

      // 更新采购申请状态
      await tx.purchaseRequest.update({
        where: { id },
        data: { status: 'PENDING' },
      });

      // 创建审批流程（调用 workflowEngineService）
      await this.workflowEngineService.createApprovalFlow(
        'PURCHASE',
        id,
        requestAmount,
        request.departmentId,
      );
    }, { isolationLevel: 'Serializable' });

    return this.findOne(id);
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
