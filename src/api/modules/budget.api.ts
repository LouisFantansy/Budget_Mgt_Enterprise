import { apiClient, download } from '../client';
import type {
  BudgetListQuery,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetAdjustRequest,
  BudgetSummaryQuery,
  BudgetApiResponse,
  BudgetListApiResponse,
  BudgetAdjustmentApiResponse,
  BudgetSummaryApiResponse,
  BudgetUsageApiResponse,
} from '../types/budget.types';
import type { ApiResponse } from '../../types';

/**
 * 预算管理 API
 */
export const budgetApi = {
  /**
   * 获取预算列表
   */
  getList: (params?: BudgetListQuery): Promise<BudgetListApiResponse> => {
    return apiClient.get('/budgets', { params });
  },

  /**
   * 获取预算详情
   */
  getById: (id: string): Promise<BudgetApiResponse> => {
    return apiClient.get(`/budgets/${id}`);
  },

  /**
   * 创建预算
   */
  create: (data: CreateBudgetRequest): Promise<BudgetApiResponse> => {
    return apiClient.post('/budgets', data);
  },

  /**
   * 更新预算
   */
  update: (id: string, data: UpdateBudgetRequest): Promise<BudgetApiResponse> => {
    return apiClient.put(`/budgets/${id}`, data);
  },

  /**
   * 删除预算
   */
  remove: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/budgets/${id}`);
  },

  /**
   * 提交审批
   */
  submitForApproval: (id: string): Promise<BudgetApiResponse> => {
    return apiClient.post(`/budgets/${id}/submit`);
  },

  /**
   * 预算调整
   */
  adjust: (id: string, data: BudgetAdjustRequest): Promise<BudgetAdjustmentApiResponse> => {
    return apiClient.post(`/budgets/${id}/adjust`, data);
  },

  /**
   * 获取预算汇总
   */
  getSummary: (params?: BudgetSummaryQuery): Promise<BudgetSummaryApiResponse> => {
    return apiClient.get('/reports/budget-summary', { params });
  },

  /**
   * 获取预算使用情况
   */
  getUsage: (id: string): Promise<BudgetUsageApiResponse> => {
    return apiClient.get(`/reports/budget-usage/${id}`);
  },

  /**
   * 导出预算
   */
  export: async (params?: BudgetListQuery, filename?: string): Promise<void> => {
    const name = filename || `预算数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
    await download('/reports/export/budgets', name);
  },
};
