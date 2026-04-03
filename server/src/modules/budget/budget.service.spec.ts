import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

// 创建 Prisma 方法的 Mock
const createMockPrisma = () => ({
  budget: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
});

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: ReturnType<typeof createMockPrisma>;

  const mockBudget = {
    id: 'budget-id-1',
    budgetNo: 'BG-2024-001',
    name: 'Test Budget',
    year: 2024,
    totalAmount: 100000,
    status: 'DRAFT',
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Test Department' },
    items: [],
    approvals: [],
    createdAt: new Date(),
    updatedAt: new Date(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该成功创建预算并自动生成编号', async () => {
      const createDto = {
        name: 'New Budget',
        year: 2024,
        totalAmount: '50000',
        departmentId: 'dept-1',
        type: 'OPERATING',
        items: [
          { name: 'Item 1', unitPrice: '100', quantity: 10, category: '办公' },
        ],
      };

      prisma.budget.count.mockResolvedValue(5);
      prisma.budget.create.mockResolvedValue({
        ...mockBudget,
        budgetNo: 'BG-2024-006',
        items: [{ name: 'Item 1', unitPrice: 100, quantity: 10, totalAmount: 1000 }],
      } as any);

      const result = await service.create(createDto as any);

      expect(result.budgetNo).toMatch(/^BG-/);
      expect(prisma.budget.count).toHaveBeenCalled();
      expect(prisma.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalAmount: 50000,
        }),
        include: {
          department: true,
          items: true,
        },
      });
    });

    it('创建预算时应该正确计算明细总金额', async () => {
      const createDto = {
        name: 'New Budget',
        year: 2024,
        totalAmount: '50000',
        departmentId: 'dept-1',
        type: 'OPERATING',
        items: [
          { name: 'Item 1', unitPrice: '100', quantity: 5, category: '办公' },
          { name: 'Item 2', unitPrice: '200', quantity: 3, category: '办公' },
        ],
      };

      prisma.budget.count.mockResolvedValue(0);
      prisma.budget.create.mockResolvedValue(mockBudget as any);

      await service.create(createDto as any);

      const createCall = prisma.budget.create.mock.calls[0][0];
      expect(createCall.data.items.create[0].totalAmount).toBe(500);
      expect(createCall.data.items.create[1].totalAmount).toBe(600);
    });
  });

  describe('findAll', () => {
    it('应该返回分页数据', async () => {
      const mockBudgets = [
        mockBudget,
        { ...mockBudget, id: 'budget-id-2', budgetNo: 'BG-2024-002' },
      ];

      prisma.budget.count.mockResolvedValue(25);
      prisma.budget.findMany.mockResolvedValue(mockBudgets as any);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(2);
    });

    it('普通用户应该只能看到本部门预算', async () => {
      prisma.budget.count.mockResolvedValue(5);
      prisma.budget.findMany.mockResolvedValue([mockBudget] as any);

      await service.findAll({ page: 1, pageSize: 20 }, mockNormalUser);

      const findManyCall = prisma.budget.findMany.mock.calls[0][0];
      expect(findManyCall.where.departmentId).toBe('dept-1');
    });

    it('admin 用户应该能看到所有预算', async () => {
      prisma.budget.count.mockResolvedValue(10);
      prisma.budget.findMany.mockResolvedValue([mockBudget] as any);

      await service.findAll({ page: 1, pageSize: 20 }, mockAdminUser);

      const findManyCall = prisma.budget.findMany.mock.calls[0][0];
      expect(findManyCall.where.departmentId).toBeUndefined();
    });

    it('admin 用户可以按 departmentId 过滤', async () => {
      prisma.budget.count.mockResolvedValue(5);
      prisma.budget.findMany.mockResolvedValue([mockBudget] as any);

      await service.findAll({ page: 1, pageSize: 20, departmentId: 'dept-1' }, mockAdminUser);

      const findManyCall = prisma.budget.findMany.mock.calls[0][0];
      expect(findManyCall.where.departmentId).toBe('dept-1');
    });

    it('应该支持按年份和状态过滤', async () => {
      prisma.budget.count.mockResolvedValue(3);
      prisma.budget.findMany.mockResolvedValue([mockBudget] as any);

      await service.findAll({ page: 1, pageSize: 20, year: 2024, status: 'DRAFT' });

      const findManyCall = prisma.budget.findMany.mock.calls[0][0];
      expect(findManyCall.where.year).toBe(2024);
      expect(findManyCall.where.status).toBe('DRAFT');
    });
  });

  describe('findOne', () => {
    it('应该正常返回预算详情', async () => {
      prisma.budget.findUnique.mockResolvedValue(mockBudget as any);

      const result = await service.findOne('budget-id-1');

      expect(result.id).toBe('budget-id-1');
      expect(result.budgetNo).toBe('BG-2024-001');
    });

    it('预算不存在应该抛出 NotFoundException', async () => {
      prisma.budget.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id'))
        .rejects.toThrow('预算不存在');
    });

    it('普通用户查看其他部门预算应该抛出 ForbiddenException', async () => {
      const otherDeptBudget = { ...mockBudget, departmentId: 'dept-other' };
      prisma.budget.findUnique.mockResolvedValue(otherDeptBudget as any);

      await expect(service.findOne('budget-id-1', mockNormalUser))
        .rejects.toThrow(ForbiddenException);
      await expect(service.findOne('budget-id-1', mockNormalUser))
        .rejects.toThrow('无权查看该预算');
    });

    it('admin 用户可以查看任何部门预算', async () => {
      const otherDeptBudget = { ...mockBudget, departmentId: 'dept-other' };
      prisma.budget.findUnique.mockResolvedValue(otherDeptBudget as any);

      const result = await service.findOne('budget-id-1', mockAdminUser);

      expect(result).toBeDefined();
    });

    it('普通用户可以查看本部门预算', async () => {
      prisma.budget.findUnique.mockResolvedValue(mockBudget as any);

      const result = await service.findOne('budget-id-1', mockNormalUser);

      expect(result).toBeDefined();
    });
  });

  describe('submitForApproval', () => {
    it('DRAFT 状态可以提交审批', async () => {
      prisma.budget.findUnique.mockResolvedValue(mockBudget as any);
      prisma.budget.update.mockResolvedValue({ ...mockBudget, status: 'PENDING' } as any);

      const result = await service.submitForApproval('budget-id-1');

      expect(result.status).toBe('PENDING');
    });

    it('非 DRAFT 状态提交审批应该抛出异常', async () => {
      const pendingBudget = { ...mockBudget, status: 'PENDING' };
      prisma.budget.findUnique.mockResolvedValue(pendingBudget as any);

      await expect(service.submitForApproval('budget-id-1'))
        .rejects.toThrow(NotFoundException);
      await expect(service.submitForApproval('budget-id-1'))
        .rejects.toThrow('只有草稿状态的预算可以提交审批');
    });
  });

  describe('update', () => {
    it('应该成功更新预算', async () => {
      prisma.budget.findUnique.mockResolvedValue(mockBudget as any);
      prisma.budget.update.mockResolvedValue({
        ...mockBudget,
        name: 'Updated Budget',
      } as any);

      const result = await service.update('budget-id-1', { name: 'Updated Budget' });

      expect(result.name).toBe('Updated Budget');
    });
  });

  describe('remove', () => {
    it('应该成功删除预算', async () => {
      prisma.budget.findUnique.mockResolvedValue(mockBudget as any);
      prisma.budget.delete.mockResolvedValue(mockBudget as any);

      const result = await service.remove('budget-id-1');

      expect(result.id).toBe('budget-id-1');
    });
  });
});
