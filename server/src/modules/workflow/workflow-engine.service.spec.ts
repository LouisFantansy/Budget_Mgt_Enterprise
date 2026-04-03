import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

// 创建 Prisma 方法的 Mock
const createMockPrisma = () => ({
  approvalFlow: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  approvalStep: {
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  budget: {
    update: jest.fn(),
  },
  purchaseRequest: {
    findUnique: jest.fn(),
  },
  workflowTemplate: {
    findUnique: jest.fn(),
  },
});

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let prisma: ReturnType<typeof createMockPrisma>;

  const mockApprovalFlow = {
    id: 'flow-id-1',
    targetType: 'BUDGET',
    status: 'IN_PROGRESS',
    currentStep: 1,
    budgetId: 'budget-id-1',
    purchaseId: null,
    steps: [
      {
        id: 'step-1',
        stepOrder: 1,
        stepName: '部门负责人审批',
        approverRole: 'dept_head',
        action: null,
        approverId: null,
        comment: null,
      },
      {
        id: 'step-2',
        stepOrder: 2,
        stepName: '预算管理员审批',
        approverRole: 'budget_manager',
        action: null,
        approverId: null,
        comment: null,
      },
    ],
    budget: { id: 'budget-id-1', budgetNo: 'BG-2024-001', name: 'Test Budget' },
    purchase: null,
  };

  const mockApprover = {
    id: 'approver-id-1',
    username: 'dept_head_user',
    name: 'Department Head',
    roles: [
      {
        role: {
          id: 'role-1',
          name: 'dept_head',
          displayName: '部门负责人',
        },
      },
    ],
  };

  const mockAdminApprover = {
    id: 'admin-id',
    username: 'admin',
    name: 'Admin User',
    roles: [
      {
        role: {
          id: 'role-admin',
          name: 'admin',
          displayName: '管理员',
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<WorkflowEngineService>(WorkflowEngineService);
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('createApprovalFlow', () => {
    describe('getApprovalChainByAmount (通过 createApprovalFlow 测试)', () => {
      it('金额 < 5万应该返回 2 级审批链', async () => {
        prisma.approvalFlow.create.mockResolvedValue(mockApprovalFlow as any);

        await service.createApprovalFlow('BUDGET', 'budget-id-1', 30000, 'dept-1');

        const createCall = prisma.approvalFlow.create.mock.calls[0][0];
        const steps = createCall.data.steps.create;
        expect(steps).toHaveLength(2);
        expect(steps[0].approverRole).toBe('dept_head');
        expect(steps[1].approverRole).toBe('budget_manager');
      });

      it('5万 <= 金额 < 50万应该返回 3 级审批链', async () => {
        prisma.approvalFlow.create.mockResolvedValue({
          ...mockApprovalFlow,
          steps: [
            ...mockApprovalFlow.steps,
            { id: 'step-3', stepOrder: 3, stepName: '总监审批', approverRole: 'director' },
          ],
        } as any);

        await service.createApprovalFlow('BUDGET', 'budget-id-1', 100000, 'dept-1');

        const createCall = prisma.approvalFlow.create.mock.calls[0][0];
        const steps = createCall.data.steps.create;
        expect(steps).toHaveLength(3);
        expect(steps[0].approverRole).toBe('dept_head');
        expect(steps[1].approverRole).toBe('budget_manager');
        expect(steps[2].approverRole).toBe('director');
      });

      it('金额 >= 50万应该返回 4 级审批链', async () => {
        prisma.approvalFlow.create.mockResolvedValue({
          ...mockApprovalFlow,
          steps: [
            ...mockApprovalFlow.steps,
            { id: 'step-3', stepOrder: 3, stepName: '总监审批', approverRole: 'director' },
            { id: 'step-4', stepOrder: 4, stepName: '总经理审批', approverRole: 'gm' },
          ],
        } as any);

        await service.createApprovalFlow('BUDGET', 'budget-id-1', 500000, 'dept-1');

        const createCall = prisma.approvalFlow.create.mock.calls[0][0];
        const steps = createCall.data.steps.create;
        expect(steps).toHaveLength(4);
        expect(steps[0].approverRole).toBe('dept_head');
        expect(steps[1].approverRole).toBe('budget_manager');
        expect(steps[2].approverRole).toBe('director');
        expect(steps[3].approverRole).toBe('gm');
      });
    });

    it('应该正确创建审批流程和步骤', async () => {
      prisma.approvalFlow.create.mockResolvedValue(mockApprovalFlow as any);

      const result = await service.createApprovalFlow('BUDGET', 'budget-id-1', 30000, 'dept-1');

      expect(result.targetType).toBe('BUDGET');
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.currentStep).toBe(1);
      expect(prisma.approvalFlow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'BUDGET',
          status: 'IN_PROGRESS',
          currentStep: 1,
          budget: { connect: { id: 'budget-id-1' } },
        }),
        include: {
          steps: true,
          budget: true,
          purchase: true,
        },
      });
    });

    it('创建 PURCHASE 类型审批流程应该正确关联', async () => {
      prisma.approvalFlow.create.mockResolvedValue({
        ...mockApprovalFlow,
        targetType: 'PURCHASE',
        budgetId: null,
        purchaseId: 'purchase-id-1',
      } as any);

      await service.createApprovalFlow('PURCHASE', 'purchase-id-1', 30000, 'dept-1');

      const createCall = prisma.approvalFlow.create.mock.calls[0][0];
      expect(createCall.data.purchase).toEqual({ connect: { id: 'purchase-id-1' } });
    });
  });

  describe('advanceStep', () => {
    it('批准应该推进到下一步', async () => {
      const flowInProgress = {
        ...mockApprovalFlow,
        currentStep: 1,
      };

      prisma.approvalFlow.findUnique.mockResolvedValue(flowInProgress as any);
      prisma.user.findUnique.mockResolvedValue(mockApprover as any);
      prisma.approvalStep.update.mockResolvedValue(flowInProgress.steps[0] as any);
      prisma.approvalFlow.update.mockResolvedValue({
        ...flowInProgress,
        currentStep: 2,
      } as any);

      const result = await service.advanceStep('flow-id-1', 'APPROVE', 'approver-id-1');

      expect(result.currentStep).toBe(2);
      expect(prisma.approvalFlow.update).toHaveBeenCalledWith({
        where: { id: 'flow-id-1' },
        data: { currentStep: 2, status: 'IN_PROGRESS' },
        include: { steps: true },
      });
    });

    it('最后一步批准应该标记为 APPROVED', async () => {
      const flowAtLastStep = {
        ...mockApprovalFlow,
        currentStep: 2,
        steps: mockApprovalFlow.steps,
      };

      prisma.approvalFlow.findUnique.mockResolvedValue(flowAtLastStep as any);
      prisma.user.findUnique.mockResolvedValue({
        ...mockApprover,
        roles: [{ role: { name: 'budget_manager' } }],
      } as any);
      prisma.approvalStep.update.mockResolvedValue(flowAtLastStep.steps[1] as any);
      prisma.approvalFlow.update.mockResolvedValue({
        ...flowAtLastStep,
        status: 'APPROVED',
      } as any);

      await service.advanceStep('flow-id-1', 'APPROVE', 'approver-id-1');

      expect(prisma.approvalFlow.update).toHaveBeenCalledWith({
        where: { id: 'flow-id-1' },
        data: expect.objectContaining({
          status: 'APPROVED',
        }),
        include: { steps: true },
      });
    });

    it('拒绝应该标记为 REJECTED', async () => {
      const flowInProgress = {
        ...mockApprovalFlow,
        currentStep: 1,
      };

      prisma.approvalFlow.findUnique.mockResolvedValue(flowInProgress as any);
      prisma.user.findUnique.mockResolvedValue(mockApprover as any);
      prisma.approvalStep.update.mockResolvedValue(flowInProgress.steps[0] as any);
      prisma.approvalFlow.update.mockResolvedValue({
        ...flowInProgress,
        status: 'REJECTED',
      } as any);

      await service.advanceStep('flow-id-1', 'REJECT', 'approver-id-1', '拒绝原因');

      expect(prisma.approvalFlow.update).toHaveBeenCalledWith({
        where: { id: 'flow-id-1' },
        data: expect.objectContaining({
          status: 'REJECTED',
        }),
        include: { steps: true },
      });
    });

    it('流程不存在应该抛出 NotFoundException', async () => {
      prisma.approvalFlow.findUnique.mockResolvedValue(null);

      await expect(service.advanceStep('nonexistent-flow', 'APPROVE', 'approver-id-1'))
        .rejects.toThrow(NotFoundException);
      await expect(service.advanceStep('nonexistent-flow', 'APPROVE', 'approver-id-1'))
        .rejects.toThrow('审批流程不存在');
    });

    it('审批人不存在应该抛出 NotFoundException', async () => {
      prisma.approvalFlow.findUnique.mockResolvedValue(mockApprovalFlow as any);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.advanceStep('flow-id-1', 'APPROVE', 'nonexistent-approver'))
        .rejects.toThrow(NotFoundException);
      await expect(service.advanceStep('flow-id-1', 'APPROVE', 'nonexistent-approver'))
        .rejects.toThrow('审批人不存在');
    });

    it('无权限审批应该抛出 BadRequestException', async () => {
      const wrongRoleApprover = {
        id: 'approver-id-2',
        username: 'viewer_user',
        name: 'Viewer User',
        roles: [{ role: { name: 'viewer' } }],
      };

      prisma.approvalFlow.findUnique.mockResolvedValue(mockApprovalFlow as any);
      prisma.user.findUnique.mockResolvedValue(wrongRoleApprover as any);

      await expect(service.advanceStep('flow-id-1', 'APPROVE', 'approver-id-2'))
        .rejects.toThrow(BadRequestException);
      await expect(service.advanceStep('flow-id-1', 'APPROVE', 'approver-id-2'))
        .rejects.toThrow('您没有权限处理此审批步骤');
    });

    it('admin 角色可以审批任何步骤', async () => {
      prisma.approvalFlow.findUnique.mockResolvedValue(mockApprovalFlow as any);
      prisma.user.findUnique.mockResolvedValue(mockAdminApprover as any);
      prisma.approvalStep.update.mockResolvedValue(mockApprovalFlow.steps[0] as any);
      prisma.approvalFlow.update.mockResolvedValue({
        ...mockApprovalFlow,
        currentStep: 2,
      } as any);

      const result = await service.advanceStep('flow-id-1', 'APPROVE', 'admin-id');

      expect(result.currentStep).toBe(2);
    });

    it('Purchase 审批通过时应该更新预算冻结金额', async () => {
      const purchaseFlow = {
        ...mockApprovalFlow,
        targetType: 'PURCHASE',
        budgetId: null,
        purchaseId: 'purchase-id-1',
        currentStep: 2,
        steps: [
          { id: 'step-1', stepOrder: 1, approverRole: 'dept_head', action: 'APPROVE' },
          { id: 'step-2', stepOrder: 2, approverRole: 'budget_manager', action: null },
        ],
      };

      prisma.approvalFlow.findUnique.mockResolvedValue(purchaseFlow as any);
      prisma.user.findUnique.mockResolvedValue({
        ...mockApprover,
        roles: [{ role: { name: 'budget_manager' } }],
      } as any);
      prisma.approvalStep.update.mockResolvedValue(purchaseFlow.steps[1] as any);
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'purchase-id-1',
        budgetId: 'budget-id-1',
        totalAmount: 10000,
      } as any);
      prisma.budget.update.mockResolvedValue({} as any);
      prisma.approvalFlow.update.mockResolvedValue({
        ...purchaseFlow,
        status: 'APPROVED',
      } as any);

      await service.advanceStep('flow-id-1', 'APPROVE', 'approver-id-1');

      expect(prisma.budget.update).toHaveBeenCalled();
    });

    it('拒绝时应该释放预算冻结金额', async () => {
      const purchaseFlow = {
        ...mockApprovalFlow,
        targetType: 'PURCHASE',
        budgetId: null,
        purchaseId: 'purchase-id-1',
        currentStep: 1,
      };

      prisma.approvalFlow.findUnique.mockResolvedValue(purchaseFlow as any);
      prisma.user.findUnique.mockResolvedValue(mockApprover as any);
      prisma.approvalStep.update.mockResolvedValue(purchaseFlow.steps[0] as any);
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'purchase-id-1',
        budgetId: 'budget-id-1',
        totalAmount: 10000,
      } as any);
      prisma.budget.update.mockResolvedValue({} as any);
      prisma.approvalFlow.update.mockResolvedValue({
        ...purchaseFlow,
        status: 'REJECTED',
      } as any);

      await service.advanceStep('flow-id-1', 'REJECT', 'approver-id-1');

      expect(prisma.budget.update).toHaveBeenCalledWith({
        where: { id: 'budget-id-1' },
        data: {
          frozenAmount: { decrement: 10000 },
        },
      });
    });
  });

  describe('getApprovalStatus', () => {
    it('应该返回审批流程详情', async () => {
      prisma.approvalFlow.findUnique.mockResolvedValue(mockApprovalFlow as any);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.getApprovalStatus('flow-id-1');

      expect(result.id).toBe('flow-id-1');
      expect(result.steps).toHaveLength(2);
    });

    it('流程不存在应该抛出 NotFoundException', async () => {
      prisma.approvalFlow.findUnique.mockResolvedValue(null);

      await expect(service.getApprovalStatus('nonexistent-flow'))
        .rejects.toThrow(NotFoundException);
      await expect(service.getApprovalStatus('nonexistent-flow'))
        .rejects.toThrow('审批流程不存在');
    });
  });

  describe('getPendingApprovals', () => {
    it('应该返回待当前用户审批的列表', async () => {
      prisma.user.findUnique.mockResolvedValue(mockApprover as any);
      prisma.approvalFlow.findMany.mockResolvedValue([mockApprovalFlow] as any);

      await service.getPendingApprovals('approver-id-1', ['dept_head']);

      expect(prisma.approvalFlow.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        include: expect.any(Object),
      });
    });

    it('用户不存在应该抛出 NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getPendingApprovals('nonexistent-user', []))
        .rejects.toThrow(NotFoundException);
      await expect(service.getPendingApprovals('nonexistent-user', []))
        .rejects.toThrow('用户不存在');
    });
  });
});
