import { get, download } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export const reportApi = {
  getDashboard: (): Promise<ApiResponse<any>> => {
    return get('/analysis/dashboard/')
  },

  getDepartmentRanking: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/department-ranking/', { params })
  },

  getMonthlyTrend: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/monthly-trend/', { params })
  },

  getCategoryAnalysis: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/category-analysis/', { params })
  },

  getBudgetSummary: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/budget-summary/', { params })
  },

  getBudgetUsage: (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return get('/analysis/budget-usage/', { params })
  },

  exportBudgets: (params?: Record<string, any>): Promise<void> => {
    return download('/export/budgets/', '预算报表.xlsx', { params })
  },

  exportAnalysis: (params?: Record<string, any>): Promise<void> => {
    return download('/export/analysis/', '分析报表.xlsx', { params })
  },
}

// 兼容旧版导出
export const getBudgetReport = reportApi.getBudgetSummary
export const getPurchaseReport = reportApi.getCategoryAnalysis
export const getDepartmentReport = reportApi.getDepartmentRanking
export const getDashboardStats = reportApi.getDashboard
