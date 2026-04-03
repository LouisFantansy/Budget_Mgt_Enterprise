import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudget } from '../useBudget';
import { budgetApi } from '../../api/modules/budget.api';
import { BudgetType } from '../../types';

// Mock budgetApi
vi.mock('../../api/modules/budget.api', () => ({
  budgetApi: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    submitForApproval: vi.fn(),
    adjust: vi.fn(),
  },
}));

describe('useBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBudgets', () => {
    it('成功加载预算列表', async () => {
      const mockBudgets = [
        { id: '1', name: '预算1', amount: 100000 },
        { id: '2', name: '预算2', amount: 200000 },
      ];
      const mockResponse = {
        data: {
          items: mockBudgets,
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      };
      vi.mocked(budgetApi.getList).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useBudget());

      await act(async () => {
        await result.current.fetchBudgets({ page: 1, pageSize: 10 });
      });

      expect(budgetApi.getList).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
      expect(result.current.budgets).toEqual(mockBudgets);
      expect(result.current.pagination).toEqual({
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('应设置loading状态', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(budgetApi.getList).mockReturnValue(promise as any);

      const { result } = renderHook(() => useBudget());

      act(() => {
        result.current.fetchBudgets();
      });

      // 立即检查loading状态
      expect(result.current.loading).toBe(true);

      // 完成Promise
      resolvePromise!({
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0,
        },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('失败时应设置error', async () => {
      const mockError = {
        response: {
          data: {
            message: '获取预算列表失败',
          },
        },
      };
      vi.mocked(budgetApi.getList).mockRejectedValue(mockError);

      const { result } = renderHook(() => useBudget());

      await act(async () => {
        try {
          await result.current.fetchBudgets();
        } catch (e) {
          // 预期会抛出错误
        }
      });

      // 等待状态更新
      await waitFor(() => {
        expect(result.current.error).toBe('获取预算列表失败');
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('createBudget', () => {
    it('成功创建预算', async () => {
      const mockBudget = {
        id: 'new-id',
        name: '新预算',
        departmentId: 'dept-1',
        type: BudgetType.OPEX,
        year: 2024,
        amount: 500000,
      };
      vi.mocked(budgetApi.create).mockResolvedValue({ data: mockBudget } as any);

      const { result } = renderHook(() => useBudget());

      let createdBudget;
      await act(async () => {
        createdBudget = await result.current.createBudget({
          name: '新预算',
          departmentId: 'dept-1',
          type: BudgetType.OPEX,
          year: 2024,
          items: [],
        });
      });

      expect(budgetApi.create).toHaveBeenCalledWith({
        name: '新预算',
        departmentId: 'dept-1',
        type: BudgetType.OPEX,
        year: 2024,
        items: [],
      });
      expect(createdBudget).toEqual(mockBudget);
      expect(result.current.budgets).toContainEqual(mockBudget);
      expect(result.current.loading).toBe(false);
    });

    it('失败时应设置error', async () => {
      const mockError = {
        response: {
          data: {
            message: '创建预算失败：名称已存在',
          },
        },
      };
      vi.mocked(budgetApi.create).mockRejectedValue(mockError);

      const { result } = renderHook(() => useBudget());

      await act(async () => {
        try {
          await result.current.createBudget({
            name: '重复预算',
            departmentId: 'dept-1',
            type: BudgetType.OPEX,
            year: 2024,
            items: [],
          });
        } catch (e) {
          // 预期会抛出错误
        }
      });

      // 等待状态更新
      await waitFor(() => {
        expect(result.current.error).toBe('创建预算失败：名称已存在');
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('fetchBudget', () => {
    it('应获取单个预算详情', async () => {
      const mockBudget = {
        id: '1',
        name: '预算详情',
        amount: 100000,
      };
      vi.mocked(budgetApi.getById).mockResolvedValue({ data: mockBudget } as any);

      const { result } = renderHook(() => useBudget());

      await act(async () => {
        await result.current.fetchBudget('1');
      });

      expect(budgetApi.getById).toHaveBeenCalledWith('1');
      expect(result.current.currentBudget).toEqual(mockBudget);
    });
  });

  describe('updateBudget', () => {
    it('应更新预算', async () => {
      const mockBudget = {
        id: '1',
        name: '更新后的预算',
        amount: 150000,
      };
      vi.mocked(budgetApi.update).mockResolvedValue({ data: mockBudget } as any);

      const { result } = renderHook(() => useBudget());

      // 先设置一些初始数据
      result.current.budgets = [
        { id: '1', name: '旧预算', amount: 100000 },
        { id: '2', name: '其他预算', amount: 200000 },
      ] as any;

      let updatedBudget;
      await act(async () => {
        updatedBudget = await result.current.updateBudget('1', {
          name: '更新后的预算',
        } as any);
      });

      expect(budgetApi.update).toHaveBeenCalledWith('1', { name: '更新后的预算' });
      expect(updatedBudget).toEqual(mockBudget);
    });
  });

  describe('deleteBudget', () => {
    it('应删除预算', async () => {
      vi.mocked(budgetApi.remove).mockResolvedValue({ data: null } as any);
      vi.mocked(budgetApi.getList).mockResolvedValue({
        data: {
          items: [
            { id: '1', name: '预算1' },
            { id: '2', name: '预算2' },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      } as any);

      const { result } = renderHook(() => useBudget());

      // 先加载预算列表
      await act(async () => {
        await result.current.fetchBudgets();
      });

      expect(result.current.budgets).toHaveLength(2);

      await act(async () => {
        await result.current.deleteBudget('1');
      });

      expect(budgetApi.remove).toHaveBeenCalledWith('1');
      expect(result.current.budgets).toHaveLength(1);
      expect(result.current.budgets[0].id).toBe('2');
    });
  });

  describe('clearError', () => {
    it('应清除错误状态', async () => {
      const { result } = renderHook(() => useBudget());

      // 先设置一个错误
      result.current.error = '一些错误';

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('应重置状态', async () => {
      vi.mocked(budgetApi.getList).mockResolvedValue({
        data: {
          items: [{ id: '1', name: '预算1' }],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      } as any);

      const { result } = renderHook(() => useBudget());

      // 先加载预算列表来设置状态
      await act(async () => {
        await result.current.fetchBudgets();
      });
      
      expect(result.current.budgets).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.budgets).toEqual([]);
      expect(result.current.currentBudget).toBeNull();
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
