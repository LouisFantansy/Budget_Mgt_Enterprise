import { get, post, put, download, upload } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export const importExportApi = {
  importPurchaseOrders: (file: File): Promise<ApiResponse<any>> => {
    return upload('/import/purchase-orders/', file)
  },

  importSettlements: (file: File): Promise<ApiResponse<any>> => {
    return upload('/import/settlements/', file)
  },

  downloadTemplate: (type: 'PURCHASE_ORDER' | 'SETTLEMENT'): Promise<void> => {
    return download(`/import/templates/${type}/`, `${type === 'PURCHASE_ORDER' ? '采购订单' : '结算单'}导入模板.xlsx`)
  },

  getMappingList: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/mappings/', { params })
  },

  updateMapping: (id: string | number, data: any): Promise<ApiResponse<any>> => {
    return put(`/mappings/${id}/`, data)
  },

  autoMatch: (): Promise<ApiResponse<any>> => {
    return post('/mappings/auto-match/')
  },

  createMapping: (data: any): Promise<ApiResponse<any>> => {
    return post('/mappings/', data)
  },
}

// 兼容旧版导出
export const importPurchaseOrders = importExportApi.importPurchaseOrders
export const importSettlements = importExportApi.importSettlements
export const downloadTemplate = importExportApi.downloadTemplate
export const getMappingList = importExportApi.getMappingList
export const createMapping = importExportApi.createMapping
