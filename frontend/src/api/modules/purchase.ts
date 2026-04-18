import { get, post, put, del } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { PurchaseRequest, PurchaseRequestCreateForm } from '@/types'

export const purchaseApi = {
  getList: (params?: Record<string, any>): Promise<ApiResponse<PaginatedData<PurchaseRequest>>> => {
    return get('/purchases/', { params })
  },

  getById: (id: string | number): Promise<ApiResponse<PurchaseRequest>> => {
    return get(`/purchases/${id}/`)
  },

  create: (data: any): Promise<ApiResponse<PurchaseRequest>> => {
    return post('/purchases/', data)
  },

  update: (id: string | number, data: any): Promise<ApiResponse<PurchaseRequest>> => {
    return put(`/purchases/${id}/`, data)
  },

  delete: (id: string | number): Promise<ApiResponse<void>> => {
    return del(`/purchases/${id}/`)
  },

  submit: (id: string | number): Promise<ApiResponse<PurchaseRequest>> => {
    return post(`/purchases/${id}/submit/`)
  },

  cancel: (id: string | number): Promise<ApiResponse<PurchaseRequest>> => {
    return post(`/purchases/${id}/cancel/`)
  },
}

// 兼容旧版导出
export const getPurchaseRequestList = purchaseApi.getList
export const getPurchaseRequestById = purchaseApi.getById
export const createPurchaseRequest = purchaseApi.create
export const updatePurchaseRequest = purchaseApi.update
export const deletePurchaseRequest = purchaseApi.delete
export const submitPurchaseRequest = purchaseApi.submit
