import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class WorkflowEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建审批流程实例
   */
  async createApprovalFlow(
    targetType: string,
    targetId: string,
    templateId?: string,
  ) {
    // 获取流程模板
    let template;
    if (templateId) {
      template = await this.prisma.workflowTemplate.findUnique({
        where: { id: templateId },
      });
    } else {
      // 根据类型查找默认模板
      template = await this.prisma.workflowTemplate.findFirst({
        where: { 
          type: this.getWorkflowType(targetType),
          isActive: true,
        },
      });
    }

    if (!template) {
      throw new NotFoundException('未找到适用的审批流程模板');
    }

    const steps = template.steps as any[];

    // 创建审批流程实例
    const approvalFlow = await this.prisma.approvalFlow.create({
      data: {
        templateId: template.id,
        targetType,
        targetId,
        status: 'PENDING',
        currentStep: 1,
        steps: {
          create: steps.map((step, index) => ({
            stepOrder: index + 1,
            stepName: step.name,
            approverRole: step.approverRole,
            approverId: step.approverId,
          }))
        },
      },
      include: {
        steps: true,
      },
    });

    return approvalFlow;
  }

  /**
   * 推进审批流程
   */
  async advanceFlow(flowId: string, action: 'APPROVE' | 'REJECT', comment?: string) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { id: flowId },
      include: {
        steps: {
          where: { operatedAt: null }, // 找到当前待处理的步骤
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!flow || flow.status !== 'IN_PROGRESS') {
      throw new NotFoundException('审批流程不存在或已结束');
    }

    if (flow.steps.length === 0) {
      throw new NotFoundException('没有找到待处理的审批步骤');
    }

    const currentStep = flow.steps[0];

    // 更新当前步骤
    await this.prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        action,
        comment,
        operatedAt: new Date(),
      },
    });

    // 如果是拒绝，直接结束流程
    if (action === 'REJECT') {
      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      });
    }

    // 检查是否还有下一步
    const allSteps = await this.prisma.approvalStep.findMany({
      where: { flowId },
      orderBy: { stepOrder: 'asc' },
    });

    const nextStepOrder = currentStep.stepOrder + 1;
    const hasNextStep = allSteps.some(step => step.stepOrder === nextStepOrder);

    if (hasNextStep) {
      // 推进到下一步
      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          currentStep: nextStepOrder,
        },
      });
    } else {
      // 所有步骤完成，批准流程
      return this.prisma.approvalFlow.update({
        where: { id: flowId },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
      });
    }
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
