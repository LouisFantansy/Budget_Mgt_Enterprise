import { get, post, put, del } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { Budget, BudgetCreateForm, BudgetAdjustment } from '@/types'

// 预算 API 模块
export const budgetApi = {
  // 获取预算列表
  getList: (params?: Record<string, any>): Promise<ApiResponse<PaginatedData<Budget>>> => {
    return get('/budgets/', { params })
  },

  // 获取预算详情
  getById: (id: string | number): Promise<ApiResponse<Budget>> => {
    return get(`/budgets/${id}/`)
  },

  // 创建预算
  create: (data: BudgetCreateForm): Promise<ApiResponse<Budget>> => {
    return post('/budgets/', data)
  },

  // 更新预算
  update: (id: string | number, data: Partial<BudgetCreateForm>): Promise<ApiResponse<Budget>> => {
    return put(`/budgets/${id}/`, data)
  },

  // 删除预算
  delete: (id: string | number): Promise<ApiResponse<void>> => {
    return del(`/budgets/${id}/`)
  },

  // 提交审批
  submit: (id: string | number): Promise<ApiResponse<Budget>> => {
    return post(`/budgets/${id}/submit/`)
  },

  // 预算调整
  adjust: (id: string | number, data: { adjusted_amount: number; reason: string; items?: any[] }): Promise<ApiResponse<BudgetAdjustment>> => {
    return post(`/budgets/${id}/adjust/`, data)
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

// 兼容旧版导出
export const getBudgetList = budgetApi.getList
export const getBudgetById = budgetApi.getById
export const createBudget = budgetApi.create
export const updateBudget = budgetApi.update
export const deleteBudget = budgetApi.delete
export const submitBudget = budgetApi.submit
export const adjustBudget = budgetApi.adjust
export const getBudgetSummary = budgetApi.getSummary
export const getBudgetUsage = budgetApi.getUsage
export function approveBudget(id: number, comment?: string): Promise<ApiResponse<Budget>> {
  return post(`/budgets/${id}/approve/`, { comment })
}
export function rejectBudget(id: number, comment: string): Promise<ApiResponse<Budget>> {
  return post(`/budgets/${id}/reject/`, { comment })
}
