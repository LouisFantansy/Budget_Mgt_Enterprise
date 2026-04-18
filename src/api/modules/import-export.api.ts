import { apiClient, download, upload } from '../client';
import type { ApiResponse, PaginatedResult, PaginationQuery, MatchStatus } from '../../types';

// ==================== 导入结果 ====================

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors?: ImportError[];
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
}

// ==================== 数据映射 ====================

export interface DataMappingItem {
  id: string;
  budgetNo: string | null;
  purchaseOrderNo: string | null;
  settlementNo: string | null;
  matchStatus: MatchStatus;
  amountDiff: number | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  // 关联数据
  purchaseOrder?: PurchaseOrderData;
  settlement?: SettlementData;
}

export interface PurchaseOrderData {
  id: string;
  orderNo: string;
  supplier: string;
  amount: number;
  orderDate: string;
  status: string;
}

export interface SettlementData {
  id: string;
  settlementNo: string;
  invoiceNo: string | null;
  amount: number;
  settleDate: string;
  supplier: string;
}

// 查询参数
export interface MappingListQuery extends PaginationQuery {
  matchStatus?: MatchStatus;
  budgetNo?: string;
}

// 匹配请求
export interface ManualMatchRequest {
  budgetNo: string;
}

// API 响应类型
export type ImportResultApiResponse = ApiResponse<ImportResult>;
export type MappingListApiResponse = ApiResponse<PaginatedResult<DataMappingItem>>;
export type MappingApiResponse = ApiResponse<DataMappingItem>;

/**
 * 导入导出 API
 */
export const importExportApi = {
  // ==================== 导入 ====================

  /**
   * 导入采购订单
   */
  importPurchaseOrders: async (file: File, onProgress?: (percent: number) => void): Promise<ImportResult> => {
    const result = await upload('/import/purchase-orders/', file, onProgress);
    return result;
  },

  /**
   * 导入结算单
   */
  importSettlements: async (file: File, onProgress?: (percent: number) => void): Promise<ImportResult> => {
    const result = await upload('/import/settlements/', file, onProgress);
    return result;
  },

  /**
   * 下载导入模板
   */
  downloadTemplate: async (type: 'purchase-orders' | 'settlements' | 'budgets'): Promise<void> => {
    await download(`/import/templates/${type}/`, `${type}_template.xlsx`);
  },

  // ==================== 数据映射 ====================

  /**
   * 获取映射列表
   */
  getMappings: (params?: MappingListQuery): Promise<MappingListApiResponse> => {
    return apiClient.get('/mappings/', { params });
  },

  /**
   * 自动匹配
   */
  autoMatch: (): Promise<ApiResponse<{ matched: number; total: number }>> => {
    return apiClient.post('/mappings/auto-match/');
  },

  /**
   * 手动匹配
   */
  manualMatch: (id: string, data: ManualMatchRequest): Promise<MappingApiResponse> => {
    return apiClient.put(`/mappings/${id}`, data);
  },

  // ==================== 导出 ====================

  /**
   * 导出预算
   */
  exportBudgets: async (params?: Record<string, any>): Promise<void> => {
    const filename = `预算数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
    await download('/export/budgets/', filename);
  },

  /**
   * 导出分析数据
   */
  exportAnalysis: async (params?: Record<string, any>): Promise<void> => {
    const filename = `分析数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
    await download('/export/analysis/', filename);
  },
};
