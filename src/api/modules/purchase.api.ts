import { apiClient } from '../client';
import type {
  PurchaseListQuery,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  PurchaseApiResponse,
  PurchaseListApiResponse,
} from '../types/purchase.types';
import type { ApiResponse } from '../../types';

/**
 * 采购申请 API
 */
export const purchaseApi = {
  /**
   * 获取采购申请列表
   */
  getList: (params?: PurchaseListQuery): Promise<PurchaseListApiResponse> => {
    return apiClient.get('/purchases/', { params });
  },

  /**
   * 获取采购申请详情
   */
  getById: (id: string): Promise<PurchaseApiResponse> => {
    return apiClient.get(`/purchases/${id}`);
  },

  /**
   * 创建采购申请
   */
  create: (data: CreatePurchaseRequest): Promise<PurchaseApiResponse> => {
    return apiClient.post('/purchases/', data);
  },

  /**
   * 更新采购申请
   */
  update: (id: string, data: UpdatePurchaseRequest): Promise<PurchaseApiResponse> => {
    return apiClient.put(`/purchases/${id}`, data);
  },

  /**
   * 删除采购申请
   */
  remove: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/purchases/${id}`);
  },

  /**
   * 提交审批
   */
  submitForApproval: (id: string): Promise<PurchaseApiResponse> => {
    return apiClient.post(`/purchases/${id}/submit`);
  },

  /**
   * 取消采购申请
   */
  cancel: (id: string): Promise<PurchaseApiResponse> => {
    return apiClient.post(`/purchases/${id}/cancel`);
  },
};
