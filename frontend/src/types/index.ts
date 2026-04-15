// 预算相关类型
export interface Budget {
  id: string;
  budgetYear: number;
  budgetType: string;
  organizationId: string;
  organization?: Organization;
  status: string;
  version: string;
  totalAmount: number;
  description?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  items?: BudgetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  accountId: string;
  departmentId?: string;
  department?: Organization;
  projectId?: string;
  budgetAmount: number;
  prCommittedAmount: number;
  poCommittedAmount: number;
  actualSettledAmount: number;
  executedAmount: number;
  remainingAmount: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 组织架构
export interface Organization {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  parent?: Organization;
  children?: Organization[];
  orgLevel: number;
  costCenter?: string;
  managerId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 预算科目
export interface BudgetAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentId?: string;
  parent?: BudgetAccount;
  children?: BudgetAccount[];
  accountLevel: number;
  isLeaf: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// IPD项目
export interface IpdProject {
  id: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  parentId?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  budgetAmount?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 预算调整
export interface BudgetAdjustment {
  id: string;
  adjustmentNo: string;
  budgetId: string;
  adjustmentType: string;
  originalAmount: number;
  adjustmentAmount: number;
  newAmount: number;
  reason: string;
  reasonCategory?: string;
  impactAnalysis?: string;
  status: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 用户
export interface SystemUser {
  id: string;
  username: string;
  realName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  status: string;
  lastLoginAt?: string;
  roles: SystemRole[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemRole {
  id: string;
  roleCode: string;
  roleName: string;
  description?: string;
  isSystem: boolean;
}

// Dashboard
export interface DashboardData {
  summary: {
    totalBudget: number;
    totalExecuted: number;
    totalRemaining: number;
    executionRate: number;
    budgetCount: number;
    approvedCount: number;
    pendingCount: number;
  };
  byType: {
    capex: { budget: number; executed: number; rate: number };
    opex: { budget: number; executed: number; rate: number };
  };
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    budgetAmount: number;
    executedAmount: number;
    executionRate: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  recentBudgets: Array<{
    id: string;
    budgetYear: number;
    budgetType: string;
    totalAmount: number;
    status: string;
    organizationName: string;
    createdAt: string;
    executionRate: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    budget: number;
    executed: number;
  }>;
  topProjects: Array<{
    projectId: string;
    projectName: string;
    budgetAmount: number;
    executedAmount: number;
    executionRate: number;
  }>;
}

// 差异分析
export interface VarianceAnalysisResult {
  byOrganization: VarianceItem[];
  byDepartment: VarianceItem[];
  byProject: VarianceItem[];
  byAccount: VarianceItem[];
  summary: {
    totalBudget: number;
    totalExecuted: number;
    totalVariance: number;
    avgExecutionRate: number;
  };
}

export interface VarianceItem {
  dimension: string;
  dimensionValue: string;
  budgetAmount: number;
  executedAmount: number;
  variance: number;
  varianceRate: number;
  executionRate: number;
}
