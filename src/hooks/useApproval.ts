import { useState, useCallback } from 'react';
import { approvalApi } from '../api/modules/approval.api';
import type {
  ApprovalListQuery,
  ApproveRequest,
  RejectRequest,
} from '../api/modules/approval.api';
import type { ApprovalFlow, PaginatedResult } from '../types';

interface UseApprovalState {
  approvals: ApprovalFlow[];
  myApprovals: ApprovalFlow[];
  currentApproval: any | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

interface UseApprovalReturn extends UseApprovalState {
  fetchPendingApprovals: (params?: ApprovalListQuery) => Promise<void>;
  fetchMyApprovals: (params?: ApprovalListQuery) => Promise<void>;
  fetchApprovalDetail: (id: string) => Promise<void>;
  approve: (id: string, data?: ApproveRequest) => Promise<ApprovalFlow>;
  reject: (id: string, data: RejectRequest) => Promise<ApprovalFlow>;
  withdraw: (id: string) => Promise<ApprovalFlow>;
  clearError: () => void;
  reset: () => void;
}

const initialState: UseApprovalState = {
  approvals: [],
  myApprovals: [],
  currentApproval: null,
  pagination: null,
  loading: false,
  error: null,
};

/**
 * 审批管理 Hook
 */
export const useApproval = (): UseApprovalReturn => {
  const [state, setState] = useState<UseApprovalState>(initialState);

  /**
   * 获取待审批列表
   */
  const fetchPendingApprovals = useCallback(async (params?: ApprovalListQuery) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await approvalApi.getPendingList(params);
      const result: PaginatedResult<ApprovalFlow> = response.data;
      setState((prev) => ({
        ...prev,
        approvals: result.items,
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
        error: error.response?.data?.message || '获取待审批列表失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 获取我的申请列表
   */
  const fetchMyApprovals = useCallback(async (params?: ApprovalListQuery) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await approvalApi.getMyList(params);
      const result: PaginatedResult<ApprovalFlow> = response.data;
      setState((prev) => ({
        ...prev,
        myApprovals: result.items,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '获取我的申请列表失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 获取审批详情
   */
  const fetchApprovalDetail = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await approvalApi.getById(id);
      setState((prev) => ({
        ...prev,
        currentApproval: response.data,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '获取审批详情失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 通过审批
   */
  const approve = useCallback(async (id: string, data?: ApproveRequest): Promise<ApprovalFlow> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await approvalApi.approve(id, data);
      const approval = response.data;
      setState((prev) => ({
        ...prev,
        approvals: prev.approvals.filter((a) => a.id !== id), // 从待审批列表移除
        loading: false,
      }));
      return approval;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '审批通过失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 驳回审批
   */
  const reject = useCallback(async (id: string, data: RejectRequest): Promise<ApprovalFlow> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await approvalApi.reject(id, data);
      const approval = response.data;
      setState((prev) => ({
        ...prev,
        approvals: prev.approvals.filter((a) => a.id !== id), // 从待审批列表移除
        loading: false,
      }));
      return approval;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '审批驳回失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 撤回审批
   */
  const withdraw = useCallback(async (id: string): Promise<ApprovalFlow> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await approvalApi.withdraw(id);
      const approval = response.data;
      setState((prev) => ({
        ...prev,
        myApprovals: prev.myApprovals.map((a) => (a.id === id ? approval : a)),
        loading: false,
      }));
      return approval;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '撤回审批失败',
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
    fetchPendingApprovals,
    fetchMyApprovals,
    fetchApprovalDetail,
    approve,
    reject,
    withdraw,
    clearError,
    reset,
  };
};
