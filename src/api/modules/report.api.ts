import { apiClient, download } from '../client';
import type { ApiResponse } from '../../types';

// ==================== Dashboard 数据 ====================

export interface DashboardData {
  overview: {
    totalBudget: number;
    totalUsed: number;
    totalFrozen: number;
    usedPercent: number;
    budgetCount: number;
    pendingApproval: number;
    purchaseCount: number;
  };
  budgetByType: {
    type: string;
    total: number;
    used: number;
  }[];
  budgetByDepartment: {
    departmentId: string;
    departmentName: string;
    total: number;
    used: number;
  }[];
  recentApprovals: {
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
  }[];
  alerts: {
    type: string;
    message: string;
    level: 'warning' | 'error' | 'info';
  }[];
}

export type DashboardApiResponse = ApiResponse<DashboardData>;

// ==================== 排名数据 ====================

export interface DepartmentRankingItem {
  rank: number;
  departmentId: string;
  departmentName: string;
  totalBudget: number;
  totalUsed: number;
  usedPercent: number;
  efficiency: number; // 执行效率
}

export interface DepartmentRankingQuery {
  year?: number;
  limit?: number;
  orderBy?: 'usedPercent' | 'totalUsed' | 'efficiency';
}

export type DepartmentRankingApiResponse = ApiResponse<DepartmentRankingItem[]>;

// ==================== 趋势数据 ====================

export interface MonthlyTrendItem {
  month: string;
  budget: number;
  used: number;
  purchase: number;
}

export interface MonthlyTrendQuery {
  year?: number;
  departmentId?: string;
}

export type MonthlyTrendApiResponse = ApiResponse<MonthlyTrendItem[]>;

// ==================== 分类分析 ====================

export interface CategoryAnalysisItem {
  category: string;
  totalBudget: number;
  totalUsed: number;
  usedPercent: number;
  itemCount: number;
}

export interface CategoryAnalysisQuery {
  year?: number;
  departmentId?: string;
  type?: 'OPEX' | 'CAPEX';
}

export type CategoryAnalysisApiResponse = ApiResponse<CategoryAnalysisItem[]>;

// ==================== 导出参数 ====================

export interface ExportQuery {
  departmentId?: string;
  year?: number;
  type?: 'OPEX' | 'CAPEX';
  status?: string;
}

/**
 * 报表 API
 */
export const reportApi = {
  /**
   * 获取 Dashboard 数据
   */
  getDashboard: (): Promise<DashboardApiResponse> => {
    return apiClient.get('/analysis/dashboard');
  },
  
  /**
   * 获取部閨排名
   */
  getDepartmentRanking: (params?: DepartmentRankingQuery): Promise<DepartmentRankingApiResponse> => {
    return apiClient.get('/analysis/department-ranking', { params });
  },
  
  /**
   * 获取月度趋势
   */
  getMonthlyTrend: (params?: MonthlyTrendQuery): Promise<MonthlyTrendApiResponse> => {
    return apiClient.get('/analysis/monthly-trend', { params });
  },
  
  /**
   * 获取分类分析
   */
  getCategoryAnalysis: (params?: CategoryAnalysisQuery): Promise<CategoryAnalysisApiResponse> => {
    return apiClient.get('/analysis/category-analysis', { params });
  },
  
  /**
   * 导出预算报表
   */
  exportBudgets: async (params?: ExportQuery): Promise<void> => {
    const filename = `预算报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    await download('/analysis/export/budgets', filename);
  },
  
  /**
   * 导出分析报表
   */
  exportAnalysis: async (params?: ExportQuery): Promise<void> => {
    const filename = `分析报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    await download('/analysis/export/analysis', filename);
  },
};
