import { get, post, put, del } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { Budget, BudgetItem } from '@/types'

// 预算 API 模块（新架构）
export const budgetApi = {
  // 获取预算列表
  getList: (params?: Record<string, any>): Promise<ApiResponse<PaginatedData<Budget>>> => {
    return get('/budgets/', { params })
  },

  // 获取预算详情
  getById: (id: string): Promise<ApiResponse<Budget>> => {
    return get(`/budgets/${id}/`)
  },

  // 创建预算
  create: (data: Partial<Budget>): Promise<ApiResponse<Budget>> => {
    return post('/budgets/', data)
  },

  // 更新预算
  update: (id: string, data: Partial<Budget>): Promise<ApiResponse<Budget>> => {
    return put(`/budgets/${id}/`, data)
  },

  // 删除预算
  delete: (id: string): Promise<ApiResponse<void>> => {
    return del(`/budgets/${id}/`)
  },

  // 获取预算条目
  getItems: (id: string): Promise<ApiResponse<BudgetItem[]>> => {
    return get(`/budgets/${id}/items/`)
  },

  // 添加预算条目
  addItem: (id: string, data: Partial<BudgetItem>): Promise<ApiResponse<BudgetItem>> => {
    return post(`/budgets/${id}/add_item/`, data)
  },

  // 更新预算条目
  updateItem: (id: string, data: { item_id: string; field_data: Record<string, any>; internal_comment?: string; reason?: string }): Promise<ApiResponse<BudgetItem>> => {
    return put(`/budgets/${id}/update_item/`, data)
  },

  // 删除预算条目（软删除）
  deleteItem: (id: string, itemId: string): Promise<ApiResponse<void>> => {
    return post(`/budgets/${id}/delete_item/`, { item_id: itemId })
  },

  // 批量更新条目
  batchUpdateItems: (id: string, data: { item_ids: string[]; field_updates: Record<string, any> }): Promise<ApiResponse<any>> => {
    return post(`/budgets/${id}/batch_update_items/`, data)
  },

  // 提交审批
  submit: (id: string): Promise<ApiResponse<any>> => {
    return post(`/budgets/${id}/submit/`)
  },

  // 审批通过/驳回
  approve: (id: string, action: 'APPROVE' | 'REJECT', comment?: string): Promise<ApiResponse<any>> => {
    return post(`/budgets/${id}/approve/`, { action, comment })
  },

  // 修订预算（Git branch）
  revise: (id: string): Promise<ApiResponse<Budget>> => {
    return post(`/budgets/${id}/revise/`)
  },

  // 获取修改留痕
  getChangeLogs: (id: string): Promise<ApiResponse<any[]>> => {
    return get(`/budgets/${id}/change_logs/`)
  },

  // 获取版本日志
  getVersionLogs: (id: string): Promise<ApiResponse<any[]>> => {
    return get(`/budgets/${id}/version_logs/`)
  },

  // 获取版本差异
  getDiff: (id: string): Promise<ApiResponse<any>> => {
    return get(`/budgets/${id}/diff/`)
  },

  // 生成预算总表（一级部门）
  generateSummary: (year: number): Promise<ApiResponse<any>> => {
    return post('/budgets/generate_summary/', { year })
  },

  // 获取预算汇总
  getSummary: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/budget-summary/', { params })
  },

  // 获取预算使用统计
  getUsage: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/budget-usage/', { params })
  },
}

// 历史采购记录 API
export const purchaseHistoryApi = {
  getList: (params?: Record<string, any>) => get('/purchase-history/', { params }),
  suggest: (keyword: string) => get('/purchase-history/suggest/', { params: { keyword } }),
}
