import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ApprovalStatus, ApprovalAction } from '@prisma/client';

interface ApprovalStepConfig {
  name: string;
  approverRole: string;
}

@Injectable()
export class WorkflowEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据金额确定审批级别和审批链
   */
  private getApprovalChainByAmount(amount: number): ApprovalStepConfig[] {
    // 金额 < 5万: 部门负责人 -> 预算管理员 (2级)
    if (amount < 50000) {
      return [
        { name: '部门负责人审批', approverRole: 'dept_head' },
        { name: '预算管理员审批', approverRole: 'budget_manager' },
      ];
    }
    // 5万 <= 金额 < 50万: 部门负责人 -> 预算管理员 -> 总监/VP (3级)
    if (amount < 500000) {
      return [
        { name: '部门负责人审批', approverRole: 'dept_head' },
        { name: '预算管理员审批', approverRole: 'budget_manager' },
        { name: '总监审批', approverRole: 'director' },
      ];
    }
    // 金额 >= 50万: 部门负责人 -> 预算管理员 -> 总监/VP -> 总经理 (4级)
    return [
      { name: '部门负责人审批', approverRole: 'dept_head' },
      { name: '预算管理员审批', approverRole: 'budget_manager' },
      { name: '总监审批', approverRole: 'director' },
      { name: '总经理审批', approverRole: 'gm' },
    ];
  }

  /**
   * 创建动态审批流程实例（根据金额自动确定审批级别）
   */
  async createApprovalFlow(
    targetType: string,
    targetId: string,
    amount: number,
    departmentId: string,
    templateId?: string,
  ) {
    let steps: ApprovalStepConfig[];

    if (templateId) {
      // 使用指定模板
      const template = await this.prisma.workflowTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        throw new NotFoundException('未找到指定的审批流程模板');
      }
      steps = (template.steps as any[]).map(s => ({
        name: s.name,
        approverRole: s.approverRole,
      }));
    } else {
      // 根据金额动态确定审批链
      steps = this.getApprovalChainByAmount(amount);
    }

    // 构建关联数据
    const connectData: any = {};
    if (targetType === 'BUDGET') {
      connectData.budget = { connect: { id: targetId } };
    } else if (targetType === 'PURCHASE') {
      connectData.purchase = { connect: { id: targetId } };
    }

    // 创建审批流程实例
    const approvalFlow = await this.prisma.approvalFlow.create({
      data: {
        targetType,
        status: 'IN_PROGRESS',
        currentStep: 1,
        ...connectData,
        steps: {
          create: steps.map((step, index) => ({
            stepOrder: index + 1,
            stepName: step.name,
            approverRole: step.approverRole,
          })),
        },
      },
      include: {
        steps: true,
        budget: true,
        purchase: true,
      },
    });

    return approvalFlow;
  }

  /**
   * 推进审批步骤
   */
  async advanceStep(
    flowId: string,
    action: 'APPROVE' | 'REJECT' | 'WITHDRAW',
    approverId: string,
    comment?: string,
  ) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { id: flowId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        budget: true,
        purchase: true,
      },
    });

    if (!flow) {
      throw new NotFoundException('审批流程不存在');
    }

    if (flow.status !== 'IN_PROGRESS' && flow.status !== 'PENDING') {
      throw new BadRequestException('审批流程已结束');
    }

    // 找到当前待处理的步骤
    const currentStep = flow.steps.find(s => s.stepOrder === flow.currentStep);
    if (!currentStep) {
      throw new NotFoundException('没有找到待处理的审批步骤');
    }

    // 验证审批人权限（根据角色）
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      include: { roles: { include: { role: true } } },
    });

    if (!approver) {
      throw new NotFoundException('审批人不存在');
    }

    const approverRoles = approver.roles.map(r => r.role.name);
    if (!approverRoles.includes(currentStep.approverRole) && !approverRoles.includes('admin')) {
      throw new BadRequestException('您没有权限处理此审批步骤');
    }

    // 更新当前步骤
    await this.prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        action: action as ApprovalAction,
        comment,
        approverId,
        operatedAt: new Date(),
      },
    });

    // 处理撤回
    if (action === 'WITHDRAW') {
      // 释放预算冻结金额
      if (flow.purchaseId) {
        const purchase = await this.prisma.purchaseRequest.findUnique({
          where: { id: flow.purchaseId },
        });
        if (purchase) {
          await this.prisma.budget.update({
            where: { id: purchase.budgetId },
            data: {
              frozenAmount: {
                decrement: purchase.totalAmount,
              },
            },
          });
        }
      }

      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
        },
        include: { steps: true },
      });
    }

    // 处理拒绝
    if (action === 'REJECT') {
      // 释放预算冻结金额
      if (flow.purchaseId) {
        const purchase = await this.prisma.purchaseRequest.findUnique({
          where: { id: flow.purchaseId },
        });
        if (purchase) {
          await this.prisma.budget.update({
            where: { id: purchase.budgetId },
            data: {
              frozenAmount: {
                decrement: purchase.totalAmount,
              },
            },
          });
        }
      }

      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
        include: { steps: true },
      });
    }

    // 处理批准 - 检查是否还有下一步
    const nextStepOrder = currentStep.stepOrder + 1;
    const hasNextStep = flow.steps.some(step => step.stepOrder === nextStepOrder);

    if (hasNextStep) {
      // 推进到下一步
      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          currentStep: nextStepOrder,
          status: 'IN_PROGRESS',
        },
        include: { steps: true },
      });
    } else {
      // 所有步骤完成，批准流程
      // 将冻结金额转为已使用金额
      if (flow.purchaseId) {
        const purchase = await this.prisma.purchaseRequest.findUnique({
          where: { id: flow.purchaseId },
        });
        if (purchase) {
          await this.prisma.budget.update({
            where: { id: purchase.budgetId },
            data: {
              frozenAmount: {
                decrement: purchase.totalAmount,
              },
              usedAmount: {
                increment: purchase.totalAmount,
              },
            },
          });
        }
      }

      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
        include: { steps: true },
      });
    }
  }

  /**
   * 获取审批状态（兼容旧方法名）
   */
  async getApprovalStatus(flowId: string) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { id: flowId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        budget: {
          select: { id: true, budgetNo: true, name: true },
        },
        purchase: {
          select: { id: true, requestNo: true, totalAmount: true },
        },
      },
    });

    if (!flow) {
      throw new NotFoundException('审批流程不存在');
    }

    // 获取审批人信息
    const approverIds = flow.steps
      .filter(s => s.approverId)
      .map(s => s.approverId);
    
    const approvers = approverIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: approverIds as string[] } },
          select: { id: true, name: true, username: true },
        })
      : [];

    const approverMap = new Map(approvers.map(a => [a.id, a]));

    return {
      ...flow,
      steps: flow.steps.map(step => ({
        ...step,
        approver: step.approverId ? approverMap.get(step.approverId) : null,
      })),
    };
  }

  /**
   * 获取待当前用户审批的列表
   */
  async getPendingApprovals(userId: string, roles: string[]) {
    // 获取用户角色
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const userRoles = user.roles.map(r => r.role.name);
    const allRoles = [...new Set([...userRoles, ...roles])];

    // 查询进行中的审批流程
    const flows = await this.prisma.approvalFlow.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        budget: {
          select: { id: true, budgetNo: true, name: true, department: true },
        },
        purchase: {
          select: { id: true, requestNo: true, totalAmount: true, purpose: true, applicantId: true },
        },
      },
    });

    // 过滤出当前用户需要审批的流程
    const pendingFlows = flows.filter(flow => {
      const currentStep = flow.steps.find(s => s.stepOrder === flow.currentStep);
      if (!currentStep) return false;
      return allRoles.includes(currentStep.approverRole) || allRoles.includes('admin');
    });

    return pendingFlows.map(flow => {
      const currentStep = flow.steps.find(s => s.stepOrder === flow.currentStep);
      return {
        ...flow,
        currentStepDetail: currentStep,
      };
    });
  }

  /**
   * 获取我发起的审批
   */
  async getMyApprovals(userId: string) {
    // 查询与我相关的采购申请的审批流程
    const purchaseFlows = await this.prisma.approvalFlow.findMany({
      where: {
        purchase: {
          applicantId: userId,
        },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        purchase: {
          select: { id: true, requestNo: true, totalAmount: true, purpose: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 查询与我相关的预算的审批流程
    const budgetFlows = await this.prisma.approvalFlow.findMany({
      where: {
        budget: {
          creatorId: userId,
        },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        budget: {
          select: { id: true, budgetNo: true, name: true, totalAmount: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 获取所有审批人信息
    const allApproverIds = [...purchaseFlows, ...budgetFlows]
      .flatMap(f => f.steps)
      .filter(s => s.approverId)
      .map(s => s.approverId as string);

    const uniqueApproverIds = [...new Set(allApproverIds)];
    
    const approvers = uniqueApproverIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: uniqueApproverIds } },
          select: { id: true, name: true },
        })
      : [];

    const approverMap = new Map(approvers.map(a => [a.id, a]));

    const enrichSteps = (steps: any[]) =>
      steps.map(step => ({
        ...step,
        approver: step.approverId ? approverMap.get(step.approverId) : null,
      }));

    return {
      purchaseApprovals: purchaseFlows.map(f => ({
        ...f,
        steps: enrichSteps(f.steps),
      })),
      budgetApprovals: budgetFlows.map(f => ({
        ...f,
        steps: enrichSteps(f.steps),
      })),
    };
  }

  /**
   * 推进审批流程（兼容旧方法名）
   */
  async advanceFlow(flowId: string, action: 'APPROVE' | 'REJECT', comment?: string) {
    // 获取系统用户作为默认审批人（用于兼容旧调用）
    const systemUser = await this.prisma.user.findFirst();
    if (!systemUser) {
      throw new NotFoundException('系统中没有用户');
    }
    return this.advanceStep(flowId, action, systemUser.id, comment);
  }

  /**
   * 获取工作流类型
   */
  private getWorkflowType(targetType: string): string {
    const typeMap = {
      'BUDGET': 'BUDGET_APPROVAL',
      'PURCHASE': 'PURCHASE_APPROVAL',
      'ADJUSTMENT': 'ADJUSTMENT_APPROVAL',
    };
    return typeMap[targetType] || 'GENERAL_APPROVAL';
  }
}
