import { get, download as downloadFile } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { AuditLog } from '@/types'

export function getAuditLogs(params?: Record<string, any>): Promise<ApiResponse<PaginatedData<AuditLog>>> {
  return get('/audit-logs/', { params })
}

export function exportAuditLogs(params?: Record<string, any>): Promise<void> {
  return downloadFile('/audit-logs/export/', '审计日志.xlsx', { params })
}
