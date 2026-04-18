// ===================== 枚举类型 =====================

export type BudgetStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'PENDING' | 'ADJUSTED'

export const BudgetStatusEnum = {
  DRAFT: 'DRAFT' as const,
  PENDING_APPROVAL: 'PENDING_APPROVAL' as const,
  APPROVED: 'APPROVED' as const,
  REJECTED: 'REJECTED' as const,
  ACTIVE: 'ACTIVE' as const,
  FROZEN: 'FROZEN' as const,
  CLOSED: 'CLOSED' as const,
}

export enum PurchaseStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
}

export enum NotificationType {
  APPROVAL = 'APPROVAL',
  SYSTEM = 'SYSTEM',
  BUDGET = 'BUDGET',
  PURCHASE = 'PURCHASE',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  BUDGET_ADMIN = 'BUDGET_ADMIN',
  DEPT_ADMIN = 'DEPT_ADMIN',
  BUDGET_USER = 'BUDGET_USER',
  VIEWER = 'VIEWER',
}

// ===================== 实体类型 =====================

export interface User {
  id: number
  username: string
  email: string
  realName: string
  phone?: string
  avatar?: string
  departmentId: number
  department?: Department
  roles: Role[]
  permissions: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: number
  name: string
  code: string
  description?: string
  permissions: Permission[]
  createdAt: string
}

export interface Permission {
  id: number
  name: string
  code: string
  resource: string
  action: string
}

export interface Department {
  id: number
  name: string
  code: string
  parentId?: number
  parent?: Department
  children?: Department[]
  managerId?: number
  manager?: User
  budgetAmount: number
  usedAmount: number
  sortOrder?: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface Budget {
  id: number
  name: string
  code: string
  type?: 'OPEX' | 'CAPEX'
  year: number
  departmentId?: number
  department?: Department
  totalAmount: number
  usedAmount: number
  frozenAmount?: number
  remainingAmount: number
  status: BudgetStatus
  items: BudgetItem[]
  createdBy: number
  creator?: User
  approvedBy?: number
  approver?: User
  paymentEntity?: string
  group?: string
  accountCode?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetItem {
  id: number
  budgetId: number
  name?: string
  category: string
  subCategory?: string
  specification?: string
  function?: string
  unitPrice: number
  quantity: number
  totalPrice?: number
  plannedAmount: number
  usedAmount: number
  remainingAmount: number
  description?: string
  purpose?: string
  supplier?: string
  deliveryDate?: string
  paymentEntity?: string
  group?: string
  accountCode?: string
  monthlyPlan?: Record<string, number>
  project?: string
  sortOrder?: number
}

export interface BudgetAdjustment {
  id: number
  budgetId: number
  budget?: Budget
  type: 'INCREASE' | 'DECREASE' | 'TRANSFER'
  amount: number
  reason: string
  status: ApprovalStatus
  createdBy: number
  creator?: User
  createdAt: string
}

export interface PurchaseRequest {
  id: number
  code?: string
  title: string
  description?: string
  departmentId: number
  department?: Department
  budgetId: number
  budget?: Budget
  totalAmount: number
  status: PurchaseStatus
  urgency?: string
  items: PurchaseItem[]
  createdBy: number
  creator?: User
  currentApprovalStep?: ApprovalStep
  approvalSteps?: ApprovalStep[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseItem {
  id: number
  purchaseRequestId: number
  name: string
  specification?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
  budgetItemId?: number
}

export interface ApprovalFlow {
  id: number
  name: string
  type: 'BUDGET' | 'PURCHASE' | 'ADJUSTMENT'
  steps: ApprovalStep[]
  createdAt: string
}

export interface ApprovalStep {
  id: number
  approvalFlowId: number
  stepOrder: number
  stepName: string
  approverType: 'USER' | 'ROLE' | 'DEPT_HEAD'
  approverId?: number
  approver?: User
  roleCode?: string
  status: ApprovalStepStatus
  comment?: string
  approvedAt?: string
  createdAt?: string
}

export interface Notification {
  id: number
  type: NotificationType
  title: string
  content: string
  senderId?: number
  sender?: User
  recipientId: number
  isRead: boolean
  relatedId?: number
  relatedType?: string
  createdAt: string
}

export interface AuditLog {
  id: number
  userId: number
  user?: User
  action: string
  resource: string
  resourceId?: number
  detail?: string
  ip: string
  createdAt: string
}

// ===================== 表单/请求类型 =====================

export interface LoginForm {
  username: string
  password: string
}

export interface ChangePasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface BudgetCreateForm {
  name: string
  year: number
  departmentId: number
  type?: 'OPEX' | 'CAPEX'
  totalAmount?: number
  paymentEntity?: string
  group?: string
  accountCode?: string
  remark?: string
  items: any[]
}

export interface PurchaseRequestCreateForm {
  title: string
  description?: string
  budgetId: number
  items: Omit<PurchaseItem, 'id' | 'purchaseRequestId' | 'totalPrice'>[]
}

export interface ImportForm {
  file: File
  type: 'PURCHASE_ORDER' | 'SETTLEMENT'
}
