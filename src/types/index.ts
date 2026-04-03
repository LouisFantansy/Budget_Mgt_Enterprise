// ==================== 用户与权限 ====================

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  departmentId: string;
  department?: Department;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  LOCKED = 'LOCKED'
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  permissions: RolePermission[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  user?: User;
  role?: Role;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  role?: Role;
  permission?: Permission;
}

// ==================== 组织结构 ====================

export interface Department {
  id: string;
  name: string;
  code: string;
  level: number;
  parentId?: string;
  parent?: Department;
  children?: Department[];
  managerId?: string;
  budgetAdminId?: string;
  sortOrder: number;
  status: DeptStatus;
  createdAt: string;
  updatedAt: string;
}

export enum DeptStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// ==================== 预算管理 ====================

export interface Budget {
  id: string;
  budgetNo: string;
  name: string;
  departmentId: string;
  department?: Department;
  type: BudgetType;
  year: number;
  version: number;
  parentId?: string;
  totalAmount: number;
  usedAmount: number;
  frozenAmount: number;
  status: BudgetStatus;
  items?: BudgetItem[];
  creatorId: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export enum BudgetType {
  OPEX = 'OPEX',
  CAPEX = 'CAPEX'
}

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ADJUSTED = 'ADJUSTED',
  CLOSED = 'CLOSED'
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  budget?: Budget;
  name: string;
  category: string;
  specification?: string;
  function?: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  usedAmount: number;
  frozenAmount: number;
  monthlyPlan?: Record<string, number>;
  project?: string;
  purpose?: string;
  supplier?: string;
  deliveryDate?: string;
  sortOrder: number;
}

export interface BudgetAdjustment {
  id: string;
  budgetId: string;
  adjustNo: string;
  originalAmount: number;
  adjustedAmount: number;
  reason: string;
  items: any;
  status: AdjustStatus;
  creatorId: string;
  createdAt: string;
}

export enum AdjustStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// ==================== 采购管理 ====================

export interface PurchaseRequest {
  id: string;
  requestNo: string;
  applicantId: string;
  departmentId: string;
  budgetId: string;
  budget?: Budget;
  budgetItemId?: string;
  items: PurchaseItem[];
  totalAmount: number;
  purpose: string;
  urgencyLevel: UrgencyLevel;
  status: PurchaseStatus;
  currentStep: number;
  approvals?: ApprovalFlow[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  requestId: string;
  request?: PurchaseRequest;
  name: string;
  specification?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplier?: string;
  deliveryDate?: string;
  remark?: string;
}

export enum PurchaseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_APPROVAL = 'IN_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum UrgencyLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// ==================== 工作流与审批 ====================

export interface WorkflowTemplate {
  id: string;
  name: string;
  type: string;
  steps: any;
  conditions?: any;
  isActive: boolean;
  version: number;
  createdAt: string;
}

export interface ApprovalFlow {
  id: string;
  templateId?: string;
  targetType: string;
  targetId: string;
  budget?: Budget;
  purchase?: PurchaseRequest;
  steps: ApprovalStep[];
  currentStep: number;
  status: ApprovalStatus;
  createdAt: string;
  completedAt?: string;
}

export interface ApprovalStep {
  id: string;
  flowId: string;
  flow?: ApprovalFlow;
  stepOrder: number;
  stepName: string;
  approverId?: string;
  approverRole?: string;
  action?: ApprovalAction;
  comment?: string;
  operatedAt?: string;
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  WITHDRAW = 'WITHDRAW'
}

// ==================== 通知系统 ====================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  channels: string[];
  createdAt: string;
}

export enum NotificationType {
  APPROVAL_PENDING = 'APPROVAL_PENDING',
  APPROVAL_RESULT = 'APPROVAL_RESULT',
  BUDGET_WARNING = 'BUDGET_WARNING',
  BUDGET_OVERRUN = 'BUDGET_OVERRUN',
  SYSTEM = 'SYSTEM',
  REPORT_READY = 'REPORT_READY'
}

// ==================== 数据导入 ====================

export enum MatchStatus {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE'
}

// ==================== 审计日志 ====================

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// ==================== 附件管理 ====================

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploaderId: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
}

// ==================== 通用类型 ====================

export interface PaginationQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}
