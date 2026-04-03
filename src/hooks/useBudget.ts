import { useState, useCallback } from 'react';
import { budgetApi } from '../api/modules/budget.api';
import type {
  BudgetListQuery,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetAdjustRequest,
} from '../api/types/budget.types';
import type { Budget, PaginatedResult } from '../types';

interface UseBudgetState {
  budgets: Budget[];
  currentBudget: Budget | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

interface UseBudgetReturn extends UseBudgetState {
  fetchBudgets: (params?: BudgetListQuery) => Promise<void>;
  fetchBudget: (id: string) => Promise<void>;
  createBudget: (data: CreateBudgetRequest) => Promise<Budget>;
  updateBudget: (id: string, data: UpdateBudgetRequest) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  submitForApproval: (id: string) => Promise<Budget>;
  adjustBudget: (id: string, data: BudgetAdjustRequest) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState: UseBudgetState = {
  budgets: [],
  currentBudget: null,
  pagination: null,
  loading: false,
  error: null,
};

/**
 * 预算管理 Hook
 */
export const useBudget = (): UseBudgetReturn => {
  const [state, setState] = useState<UseBudgetState>(initialState);

  /**
   * 获取预算列表
   */
  const fetchBudgets = useCallback(async (params?: BudgetListQuery) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await budgetApi.getList(params);
      const result: PaginatedResult<Budget> = response.data;
      setState((prev) => ({
        ...prev,
        budgets: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '获取预算列表失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 获取预算详情
   */
  const fetchBudget = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await budgetApi.getById(id);
      setState((prev) => ({
        ...prev,
        currentBudget: response.data,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '获取预算详情失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 创建预算
   */
  const createBudget = useCallback(async (data: CreateBudgetRequest): Promise<Budget> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await budgetApi.create(data);
      const budget = response.data;
      setState((prev) => ({
        ...prev,
        budgets: [...prev.budgets, budget],
        loading: false,
      }));
      return budget;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '创建预算失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 更新预算
   */
  const updateBudget = useCallback(async (id: string, data: UpdateBudgetRequest): Promise<Budget> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await budgetApi.update(id, data);
      const budget = response.data;
      setState((prev) => ({
        ...prev,
        budgets: prev.budgets.map((b) => (b.id === id ? budget : b)),
        currentBudget: prev.currentBudget?.id === id ? budget : prev.currentBudget,
        loading: false,
      }));
      return budget;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '更新预算失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 删除预算
   */
  const deleteBudget = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await budgetApi.remove(id);
      setState((prev) => ({
        ...prev,
        budgets: prev.budgets.filter((b) => b.id !== id),
        currentBudget: prev.currentBudget?.id === id ? null : prev.currentBudget,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '删除预算失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 提交审批
   */
  const submitForApproval = useCallback(async (id: string): Promise<Budget> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await budgetApi.submitForApproval(id);
      const budget = response.data;
      setState((prev) => ({
        ...prev,
        budgets: prev.budgets.map((b) => (b.id === id ? budget : b)),
        currentBudget: prev.currentBudget?.id === id ? budget : prev.currentBudget,
        loading: false,
      }));
      return budget;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '提交审批失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 预算调整
   */
  const adjustBudget = useCallback(async (id: string, data: BudgetAdjustRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await budgetApi.adjust(id, data);
      // 调整后重新获取预算详情
      const response = await budgetApi.getById(id);
      const budget = response.data;
      setState((prev) => ({
        ...prev,
        budgets: prev.budgets.map((b) => (b.id === id ? budget : b)),
        currentBudget: prev.currentBudget?.id === id ? budget : prev.currentBudget,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '预算调整失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    fetchBudgets,
    fetchBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    submitForApproval,
    adjustBudget,
    clearError,
    reset,
  };
};
