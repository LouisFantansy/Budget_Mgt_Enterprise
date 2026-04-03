import { useState, useCallback } from 'react';
import { purchaseApi } from '../api/modules/purchase.api';
import type {
  PurchaseListQuery,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
} from '../api/types/purchase.types';
import type { PurchaseRequest, PaginatedResult } from '../types';

interface UsePurchaseState {
  purchases: PurchaseRequest[];
  currentPurchase: PurchaseRequest | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

interface UsePurchaseReturn extends UsePurchaseState {
  fetchPurchases: (params?: PurchaseListQuery) => Promise<void>;
  fetchPurchase: (id: string) => Promise<void>;
  createPurchase: (data: CreatePurchaseRequest) => Promise<PurchaseRequest>;
  updatePurchase: (id: string, data: UpdatePurchaseRequest) => Promise<PurchaseRequest>;
  deletePurchase: (id: string) => Promise<void>;
  submitForApproval: (id: string) => Promise<PurchaseRequest>;
  cancelPurchase: (id: string) => Promise<PurchaseRequest>;
  clearError: () => void;
  reset: () => void;
}

const initialState: UsePurchaseState = {
  purchases: [],
  currentPurchase: null,
  pagination: null,
  loading: false,
  error: null,
};

/**
 * 采购申请 Hook
 */
export const usePurchase = (): UsePurchaseReturn => {
  const [state, setState] = useState<UsePurchaseState>(initialState);

  /**
   * 获取采购申请列表
   */
  const fetchPurchases = useCallback(async (params?: PurchaseListQuery) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await purchaseApi.getList(params);
      const result: PaginatedResult<PurchaseRequest> = response.data;
      setState((prev) => ({
        ...prev,
        purchases: result.items,
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
        error: error.response?.data?.message || '获取采购申请列表失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 获取采购申请详情
   */
  const fetchPurchase = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await purchaseApi.getById(id);
      setState((prev) => ({
        ...prev,
        currentPurchase: response.data,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '获取采购申请详情失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 创建采购申请
   */
  const createPurchase = useCallback(async (data: CreatePurchaseRequest): Promise<PurchaseRequest> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await purchaseApi.create(data);
      const purchase = response.data;
      setState((prev) => ({
        ...prev,
        purchases: [...prev.purchases, purchase],
        loading: false,
      }));
      return purchase;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '创建采购申请失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 更新采购申请
   */
  const updatePurchase = useCallback(async (id: string, data: UpdatePurchaseRequest): Promise<PurchaseRequest> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await purchaseApi.update(id, data);
      const purchase = response.data;
      setState((prev) => ({
        ...prev,
        purchases: prev.purchases.map((p) => (p.id === id ? purchase : p)),
        currentPurchase: prev.currentPurchase?.id === id ? purchase : prev.currentPurchase,
        loading: false,
      }));
      return purchase;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '更新采购申请失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 删除采购申请
   */
  const deletePurchase = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await purchaseApi.remove(id);
      setState((prev) => ({
        ...prev,
        purchases: prev.purchases.filter((p) => p.id !== id),
        currentPurchase: prev.currentPurchase?.id === id ? null : prev.currentPurchase,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '删除采购申请失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 提交审批
   */
  const submitForApproval = useCallback(async (id: string): Promise<PurchaseRequest> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await purchaseApi.submitForApproval(id);
      const purchase = response.data;
      setState((prev) => ({
        ...prev,
        purchases: prev.purchases.map((p) => (p.id === id ? purchase : p)),
        currentPurchase: prev.currentPurchase?.id === id ? purchase : prev.currentPurchase,
        loading: false,
      }));
      return purchase;
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
   * 取消采购申请
   */
  const cancelPurchase = useCallback(async (id: string): Promise<PurchaseRequest> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await purchaseApi.cancel(id);
      const purchase = response.data;
      setState((prev) => ({
        ...prev,
        purchases: prev.purchases.map((p) => (p.id === id ? purchase : p)),
        currentPurchase: prev.currentPurchase?.id === id ? purchase : prev.currentPurchase,
        loading: false,
      }));
      return purchase;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '取消采购申请失败',
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
    fetchPurchases,
    fetchPurchase,
    createPurchase,
    updatePurchase,
    deletePurchase,
    submitForApproval,
    cancelPurchase,
    clearError,
    reset,
  };
};
