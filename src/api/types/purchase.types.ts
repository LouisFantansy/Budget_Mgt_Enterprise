import { ApiResponse, PaginatedResult, PaginationQuery } from '../../types';
import type {
  PurchaseRequest,
  PurchaseItem,
  PurchaseStatus,
  UrgencyLevel,
  Budget,
  Attachment,
} from '../../types';

// ==================== 查询参数 ====================

export interface PurchaseListQuery extends PaginationQuery {
  departmentId?: string;
  budgetId?: string;
  status?: PurchaseStatus;
  urgencyLevel?: UrgencyLevel;
  keyword?: string;
  applicantId?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== 请求类型 ====================

export interface CreatePurchaseItemRequest {
  name: string;
  specification?: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  deliveryDate?: string;
  remark?: string;
}

export interface CreatePurchaseRequest {
  budgetId: string;
  budgetItemId?: string;
  purpose: string;
  urgencyLevel: UrgencyLevel;
  items: CreatePurchaseItemRequest[];
  attachments?: string[]; // 文件ID列表
}

export interface UpdatePurchaseRequest {
  budgetId?: string;
  budgetItemId?: string;
  purpose?: string;
  urgencyLevel?: UrgencyLevel;
  items?: CreatePurchaseItemRequest[];
}

// ==================== 响应类型 ====================

export type PurchaseApiResponse = ApiResponse<PurchaseRequest>;
export type PurchaseListApiResponse = ApiResponse<PaginatedResult<PurchaseRequest>>;

// ==================== 扩展类型 ====================

export interface PurchaseWithItems extends PurchaseRequest {
  items: PurchaseItem[];
  budget?: Budget;
  attachments?: Attachment[];
}

export interface PurchaseWithBudget extends PurchaseRequest {
  budget?: Budget;
}

// 采购统计
export interface PurchaseStatistics {
  totalCount: number;
  totalAmount: number;
  byStatus: Record<PurchaseStatus, { count: number; amount: number }>;
  byUrgency: Record<UrgencyLevel, { count: number; amount: number }>;
  pendingApproval: number;
  approved: number;
  rejected: number;
}

export type PurchaseStatisticsApiResponse = ApiResponse<PurchaseStatistics>;
