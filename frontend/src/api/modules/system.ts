import { get, put } from '@/api/client'
import type { ApiResponse } from '@/api/types'

// 系统参数配置
export interface SystemConfig {
  id: number
  key: string
  value: string
  description: string
  createdAt: string
  updatedAt: string
}

export function getSystemConfigs(params?: Record<string, any>): Promise<ApiResponse<SystemConfig[]>> {
  return get('/system/configs/', { params })
}

export function getSystemConfig(key: string): Promise<ApiResponse<SystemConfig>> {
  return get(`/system/configs/${key}/`)
}

export function updateSystemConfig(key: string, value: string): Promise<ApiResponse<SystemConfig>> {
  return put(`/system/configs/${key}/`, { value })
}

export function getDashboardStats(): Promise<ApiResponse<{
  totalBudget: number
  usedBudget: number
  pendingApprovals: number
  activePurchaseRequests: number
  departmentCount: number
  userCount: number
}>> {
  return get('/system/dashboard-stats/')
}
