import { apiClient } from '../client';
import type { ApiResponse, PaginatedResult, PaginationQuery, ApprovalFlow, ApprovalStatus } from '../../types';

// 审批查询参数
export interface ApprovalListQuery extends PaginationQuery {
  targetType?: 'BUDGET' | 'PURCHASE' | 'ADJUSTMENT';
  status?: ApprovalStatus;
  keyword?: string;
}

// 审批操作请求
export interface ApproveRequest {
  comment?: string;
}

export interface RejectRequest {
  reason: string;
}

// 审批详情（含关联数据）
export interface ApprovalDetail extends ApprovalFlow {
  targetData?: Record<string, any>;
  currentApprover?: {
    id: string;
    name: string;
    role?: string;
  };
  history?: ApprovalHistoryItem[];
}

export interface ApprovalHistoryItem {
  stepOrder: number;
  stepName: string;
  approverName: string;
  action: 'APPROVE' | 'REJECT' | 'WITHDRAW';
  comment?: string;
  operatedAt: string;
}

// API 响应类型
export type ApprovalApiResponse = ApiResponse<ApprovalFlow>;
export type ApprovalDetailApiResponse = ApiResponse<ApprovalDetail>;
export type ApprovalListApiResponse = ApiResponse<PaginatedResult<ApprovalFlow>>;

/**
 * 审批管理 API
 */
export const approvalApi = {
  /**
   * 获取待审批列表
   */
  getPendingList: (params?: ApprovalListQuery): Promise<ApprovalListApiResponse> => {
    return apiClient.get('/approvals/', { params });
  },

  /**
   * 获取我的申请列表
   */
  getMyList: (params?: ApprovalListQuery): Promise<ApprovalListApiResponse> => {
    return apiClient.get('/approvals/my/', { params });
  },

  /**
   * 获取审批详情
   */
  getById: (id: string): Promise<ApprovalDetailApiResponse> => {
    return apiClient.get(`/approvals/${id}`);
  },

  /**
   * 通过审批
   */
  approve: (id: string, data?: ApproveRequest): Promise<ApprovalApiResponse> => {
    return apiClient.post(`/approvals/${id}/approve`, data);
  },

  /**
   * 驳回审批
   */
  reject: (id: string, data: RejectRequest): Promise<ApprovalApiResponse> => {
    return apiClient.post(`/approvals/${id}/reject`, data);
  },

  /**
   * 撤回审批
   */
  withdraw: (id: string): Promise<ApprovalApiResponse> => {
    return apiClient.post(`/approvals/${id}/withdraw`);
  },
};
