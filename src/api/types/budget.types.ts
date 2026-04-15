import { ApiResponse, PaginatedResult, PaginationQuery } from '../../types';
import type {
  Budget,
  BudgetItem,
  BudgetAdjustment,
  BudgetType,
  BudgetStatus,
  AdjustStatus,
  Department,
} from '../../types';

// ==================== 查询参数 ====================

export interface BudgetListQuery extends PaginationQuery {
  departmentId?: string;
  year?: number;
  type?: BudgetType;
  status?: BudgetStatus;
  keyword?: string;
}

export interface BudgetSummaryQuery {
  departmentId?: string;
  year?: number;
  type?: BudgetType;
}

// ==================== 请求类型 ====================

export interface CreateBudgetItemRequest {
  name: string;
  category: string;
  specification?: string;
  function?: string;
  unitPrice: number;
  quantity: number;
  paymentEntity?: string;
  group?: string;
  accountCode?: string;
  monthlyPlan?: Record<string, number>;
  project?: string;
  purpose?: string;
  supplier?: string;
  deliveryDate?: string;
}

export interface CreateBudgetRequest {
  name: string;
  departmentId: string;
  type: BudgetType;
  year: number;
  totalAmount: string;
  paymentEntity?: string;
  group?: string;
  accountCode?: string;
  items: CreateBudgetItemRequest[];
  remark?: string;
}

export interface UpdateBudgetRequest {
  name?: string;
  items?: CreateBudgetItemRequest[];
  remark?: string;
}

export interface BudgetAdjustRequest {
  items: CreateBudgetItemRequest[];
  reason: string;
}

// ==================== 响应类型 ====================

export type BudgetApiResponse = ApiResponse<Budget>;
export type BudgetListApiResponse = ApiResponse<PaginatedResult<Budget>>;
export type BudgetItemListApiResponse = ApiResponse<PaginatedResult<BudgetItem>>;

// ==================== 扩展类型 ====================

export interface BudgetWithItems extends Budget {
  items: BudgetItem[];
  department?: Department;
}

export interface BudgetWithDepartment extends Budget {
  department?: Department;
}

// 预算汇总
export interface BudgetSummary {
  totalBudget: number;
  totalUsed: number;
  totalFrozen: number;
  totalAvailable: number;
  usedPercent: number;
  departmentSummaries: DepartmentBudgetSummary[];
}

export interface DepartmentBudgetSummary {
  departmentId: string;
  departmentName: string;
  totalBudget: number;
  totalUsed: number;
  totalFrozen: number;
  totalAvailable: number;
  usedPercent: number;
}

// 预算使用情况
export interface BudgetUsage {
  budgetId: string;
  budgetName: string;
  budgetNo: string;
  totalAmount: number;
  usedAmount: number;
  frozenAmount: number;
  availableAmount: number;
  usedPercent: number;
  items: BudgetItemUsage[];
}

export interface BudgetItemUsage {
  id: string;
  name: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  frozenAmount: number;
  availableAmount: number;
  usedPercent: number;
}

// 预算调整响应
export interface BudgetAdjustmentResponse {
  id: string;
  budgetId: string;
  adjustNo: string;
  originalAmount: number;
  adjustedAmount: number;
  reason: string;
  items: BudgetItem[];
  status: AdjustStatus;
  creatorId: string;
  createdAt: string;
}

export type BudgetAdjustmentApiResponse = ApiResponse<BudgetAdjustment>;
export type BudgetSummaryApiResponse = ApiResponse<BudgetSummary>;
export type BudgetUsageApiResponse = ApiResponse<BudgetUsage>;
