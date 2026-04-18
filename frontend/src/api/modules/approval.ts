import { get, post } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { ApprovalFlow, ApprovalStep } from '@/types'

export const approvalApi = {
  getList: (params?: Record<string, any>): Promise<ApiResponse<PaginatedData<any>>> => {
    return get('/approvals/', { params })
  },

  getMyApprovals: (params?: Record<string, any>): Promise<ApiResponse<PaginatedData<any>>> => {
    return get('/approvals/my/', { params })
  },

  getById: (id: string | number): Promise<ApiResponse<any>> => {
    return get(`/approvals/${id}/`)
  },

  approve: (id: string | number, data?: any): Promise<ApiResponse<void>> => {
    return post(`/approvals/${id}/approve/`, data)
  },

  reject: (id: string | number, data: any): Promise<ApiResponse<void>> => {
    return post(`/approvals/${id}/reject/`, data)
  },

  withdraw: (id: string | number): Promise<ApiResponse<void>> => {
    return post(`/approvals/${id}/withdraw/`)
  },
}

// 兼容旧版导出
export const getApprovalList = approvalApi.getList
export const getApprovalDetail = approvalApi.getById
export const approve = approvalApi.approve
export const reject = approvalApi.reject

export function getApprovalFlows(params?: Record<string, any>): Promise<ApiResponse<PaginatedData<ApprovalFlow>>> {
  return get('/approval-flows/', { params })
}

export function createApprovalFlow(data: Partial<ApprovalFlow>): Promise<ApiResponse<ApprovalFlow>> {
  return post('/approval-flows/', data)
}
