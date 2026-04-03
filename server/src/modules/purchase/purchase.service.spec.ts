import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { WorkflowEngineService } from '../workflow/workflow-engine.service';

// 创建 Prisma 方法的 Mock
const createMockPrisma = () => ({
  purchaseRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  budget: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
});

describe('PurchaseService', () => {
  let service: PurchaseService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let workflowEngineService: { createApprovalFlow: jest.Mock };

  const mockBudget = {
    id: 'budget-id-1',
    budgetNo: 'BG-2024-001',
    name: 'Test Budget',
    totalAmount: 100000,
    usedAmount: 0,
    frozenAmount: 0,
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Test Department' },
  };

  const mockPurchaseRequest = {
    id: 'pr-id-1',
    requestNo: 'PR-2024-001',
    purpose: 'Test Purchase',
    totalAmount: { toNumber: () => 10000 },
    status: 'DRAFT',
    applicantId: 'user-id-1',
    departmentId: 'dept-1',
    budgetId: 'budget-id-1',
    budget: mockBudget,
    items: [
      { id: 'item-1', name: 'Item 1', unitPrice: 100, quantity: 10, totalAmount: 1000 },
      { id: 'item-2', name: 'Item 2', unitPrice: 200, quantity: 10, totalAmount: 2000 },
    ],
    approvals: [],
    attachments: [],
  };

  const mockAdminUser = {
    userId: 'admin-id',
    departmentId: 'dept-admin',
    roles: ['admin'],
  };

  const mockNormalUser = {
    userId: 'user-id',
    departmentId: 'dept-1',
    roles: ['viewer'],
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    workflowEngineService = {
      createApprovalFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: WorkflowEngineService,
          useValue: workflowEngineService,
        },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该成功创建采购申请并自动计算总金额', async () => {
      const createDto = {
        purpose: 'Test Purchase',
        budgetId: 'budget-id-1',
        items: [
          { name: 'Item 1', unitPrice: '100', quantity: 5 },
          { name: 'Item 2', unitPrice: '200', quantity: 3 },
        ],
      };

      prisma.budget.findUnique.mockResolvedValue(mockBudget as any);
      prisma.purchaseRequest.count.mockResolvedValue(5);
      prisma.purchaseRequest.create.mockResolvedValue({
        ...mockPurchaseRequest,
        requestNo: 'PR-2024-006',
        totalAmount: { toNumber: () => 1100 },
      } as any);

      const result = await service.create(createDto as any, 'user-id-1');

      expect(result.requestNo).toBe('PR-2024-006');
      const createCall = prisma.purchaseRequest.create.mock.calls[0][0];
      expect(createCall.data.totalAmount).toBe(1100); // 100*5 + 200*3
    });

    it('预算不存在应该抛出 NotFoundException', async () => {
      const createDto = {
        purpose: 'Test Purchase',
        budgetId: 'nonexistent-budget',
        items: [],
      };

      prisma.budget.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto as any, 'user-id-1'))
        .rejects.toThrow(NotFoundException);
      await expect(service.create(createDto as any, 'user-id-1'))
        .rejects.toThrow('预算不存在');
    });
  });

  describe('findAll', () => {
    it('应该返回分页数据', async () => {
      const mockRequests = [
        mockPurchaseRequest,
        { ...mockPurchaseRequest, id: 'pr-id-2', requestNo: 'PR-2024-002' },
      ];

      prisma.purchaseRequest.count.mockResolvedValue(15);
      prisma.purchaseRequest.findMany.mockResolvedValue(mockRequests as any);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(2);
    });

    it('普通用户应该只能看到本部门采购申请', async () => {
      prisma.purchaseRequest.count.mockResolvedValue(5);
      prisma.purchaseRequest.findMany.mockResolvedValue([mockPurchaseRequest] as any);

      await service.findAll({ page: 1, pageSize: 20 }, mockNormalUser);

      const findManyCall = prisma.purchaseRequest.findMany.mock.calls[0][0];
      expect(findManyCall.where.departmentId).toBe('dept-1');
    });

    it('admin 用户应该能看到所有采购申请', async () => {
      prisma.purchaseRequest.count.mockResolvedValue(10);
      prisma.purchaseRequest.findMany.mockResolvedValue([mockPurchaseRequest] as any);

      await service.findAll({ page: 1, pageSize: 20 }, mockAdminUser);

      const findManyCall = prisma.purchaseRequest.findMany.mock.calls[0][0];
      expect(findManyCall.where.departmentId).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('应该正常返回采购申请详情', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(mockPurchaseRequest as any);

      const result = await service.findOne('pr-id-1');

      expect(result.id).toBe('pr-id-1');
      expect(result.requestNo).toBe('PR-2024-001');
    });

    it('采购申请不存在应该抛出 NotFoundException', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id'))
        .rejects.toThrow('采购申请不存在');
    });

    it('普通用户查看其他部门采购申请应该抛出 ForbiddenException', async () => {
      const otherDeptRequest = { ...mockPurchaseRequest, departmentId: 'dept-other' };
      prisma.purchaseRequest.findUnique.mockResolvedValue(otherDeptRequest as any);

      await expect(service.findOne('pr-id-1', mockNormalUser))
        .rejects.toThrow(ForbiddenException);
      await expect(service.findOne('pr-id-1', mockNormalUser))
        .rejects.toThrow('无权查看该采购申请');
    });
  });

  describe('submitForApproval', () => {
    it('应该成功提交审批并冻结预算', async () => {
      const pendingRequest = { ...mockPurchaseRequest, status: 'DRAFT' };

      prisma.purchaseRequest.findUnique.mockResolvedValue(pendingRequest as any);
      prisma.$queryRaw.mockResolvedValue([{
        id: 'budget-id-1',
        totalAmount: 100000,
        usedAmount: 0,
        frozenAmount: 0,
      }] as any);

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          $queryRaw: prisma.$queryRaw,
          budget: {
            update: jest.fn().mockResolvedValue(mockBudget),
          },
          purchaseRequest: {
            update: jest.fn().mockResolvedValue({ ...pendingRequest, status: 'PENDING' }),
          },
        };
        return callback(mockTx);
      });

      workflowEngineService.createApprovalFlow.mockResolvedValue({ id: 'flow-1' } as any);

      // Mock findOne for the final return
      prisma.purchaseRequest.findUnique.mockResolvedValueOnce(pendingRequest as any);
      prisma.purchaseRequest.findUnique.mockResolvedValueOnce({ ...pendingRequest, status: 'PENDING' } as any);

      await service.submitForApproval('pr-id-1');

      expect(workflowEngineService.createApprovalFlow).toHaveBeenCalledWith(
        'PURCHASE',
        'pr-id-1',
        10000,
        'dept-1'
      );
    });

    it('非 DRAFT 状态提交审批应该抛出异常', async () => {
      const pendingRequest = { ...mockPurchaseRequest, status: 'PENDING' };
      prisma.purchaseRequest.findUnique.mockResolvedValue(pendingRequest as any);

      await expect(service.submitForApproval('pr-id-1'))
        .rejects.toThrow(BadRequestException);
      await expect(service.submitForApproval('pr-id-1'))
        .rejects.toThrow('只有草稿状态的采购申请可以提交审批');
    });

    it('预算余额不足应该抛出异常', async () => {
      const pendingRequest = { ...mockPurchaseRequest, status: 'DRAFT' };

      prisma.purchaseRequest.findUnique.mockResolvedValue(pendingRequest as any);
      prisma.$queryRaw.mockResolvedValue([{
        id: 'budget-id-1',
        totalAmount: 10000,
        usedAmount: 5000,
        frozenAmount: 5000,
      }] as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          $queryRaw: prisma.$queryRaw,
          budget: {
            update: jest.fn(),
          },
          purchaseRequest: {
            update: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      await expect(service.submitForApproval('pr-id-1'))
        .rejects.toThrow(BadRequestException);
      await expect(service.submitForApproval('pr-id-1'))
        .rejects.toThrow('预算余额不足');
    });
  });

  describe('remove', () => {
    it('应该成功删除 DRAFT 状态的采购申请', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(mockPurchaseRequest as any);
      prisma.purchaseRequest.delete.mockResolvedValue(mockPurchaseRequest as any);

      const result = await service.remove('pr-id-1');

      expect(result.id).toBe('pr-id-1');
    });

    it('应该成功删除 CANCELLED 状态的采购申请', async () => {
      const cancelledRequest = { ...mockPurchaseRequest, status: 'CANCELLED' };
      prisma.purchaseRequest.findUnique.mockResolvedValue(cancelledRequest as any);
      prisma.purchaseRequest.delete.mockResolvedValue(cancelledRequest as any);

      const result = await service.remove('pr-id-1');

      expect(result.id).toBe('pr-id-1');
    });

    it('非 DRAFT/CANCELLED 状态删除应该抛出异常', async () => {
      const pendingRequest = { ...mockPurchaseRequest, status: 'PENDING' };
      prisma.purchaseRequest.findUnique.mockResolvedValue(pendingRequest as any);

      await expect(service.remove('pr-id-1'))
        .rejects.toThrow(NotFoundException);
      await expect(service.remove('pr-id-1'))
        .rejects.toThrow('只能删除草稿或已取消的采购申请');
    });
  });
});
