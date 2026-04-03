import { apiClient, download } from '../client';
import type { ApiResponse, PaginatedResult, PaginationQuery, AuditLog } from '../../types';

// 审计日志查询参数
export interface AuditLogListQuery extends PaginationQuery {
  userId?: string;
  action?: string;
  module?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

// 审计统计
export interface AuditStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byModule: Record<string, number>;
  topUsers: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    count: number;
  }>;
}

export interface AuditStatsQuery {
  startDate?: string;
  endDate?: string;
  module?: string;
}

// API 响应类型
export type AuditLogListApiResponse = ApiResponse<PaginatedResult<AuditLog>>;
export type AuditStatsApiResponse = ApiResponse<AuditStats>;

/**
 * 审计日志 API
 */
export const auditApi = {
  /**
   * 获取审计日志列表
   */
  getList: (params?: AuditLogListQuery): Promise<AuditLogListApiResponse> => {
    return apiClient.get('/audit-logs', { params });
  },

  /**
   * 获取审计统计
   */
  getStats: (params?: AuditStatsQuery): Promise<AuditStatsApiResponse> => {
    return apiClient.get('/audit-logs/stats', { params });
  },

  /**
   * 导出审计日志
   */
  exportLogs: async (params?: AuditLogListQuery): Promise<void> => {
    const filename = `审计日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    await download('/audit-logs/export', filename);
  },
};
