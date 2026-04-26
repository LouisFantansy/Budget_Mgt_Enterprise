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
  FIRST_BUDGET_ADMIN = 'FIRST_BUDGET_ADMIN',
  FIRST_BUDGET_HOST = 'FIRST_BUDGET_HOST',
  FIRST_DEPT_HEAD = 'FIRST_DEPT_HEAD',
  SECOND_BUDGET_ADMIN_PRIMARY = 'SECOND_BUDGET_ADMIN_PRIMARY',
  SECOND_BUDGET_ADMIN_SECONDARY = 'SECOND_BUDGET_ADMIN_SECONDARY',
  SECOND_DEPT_HEAD = 'SECOND_DEPT_HEAD',
  ENGINEER = 'ENGINEER',
  ADMIN = 'ADMIN',
}

export enum BudgetSource {
  SELF_COMPILED = 'SELF_COMPILED',
  GROUP_ALLOCATION = 'GROUP_ALLOCATION',
  SS_PUBLIC = 'SS_PUBLIC',
}

export enum DepartmentType {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  SS_PUBLIC = 'SS_PUBLIC',
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
  type?: 'FIRST' | 'SECOND' | 'SS_PUBLIC'
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
  id: string
  budgetNo?: string
  year: number
  category: 'OPEX' | 'CAPEX'
  source: BudgetSource
  departmentId?: string
  department?: Department
  templateId?: string
  template?: BudgetTemplate
  versionMajor: number
  versionMinor: number
  versionLabel: string
  parentVersionId?: string
  branchedFromId?: string
  isBranch: boolean
  branchName?: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  totalAmount: number
  totalQuantity: number
  remark?: string
  items: BudgetItem[]
  createdBy?: string
  createdByName?: string
  approvedBy?: string
  approvedByName?: string
  submittedBy?: string
  submittedByName?: string
  approvedAt?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetItem {
  id: string
  budgetId: string
  templateId?: string
  itemNo: number
  fieldData: Record<string, any>
  computedFields: Record<string, any>
  internalComment?: string
  isDeleted: boolean
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetTemplate {
  id: string
  name: string
  templateType: string
  description?: string
  isActive: boolean
  creatorId?: string
  creatorName?: string
  fields: TemplateField[]
  createdAt: string
  updatedAt: string
}

export interface TemplateField {
  id: string
  fieldCode: string
  fieldName: string
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN'
  isRequired: boolean
  isFormula: boolean
  formula?: string
  defaultValue?: string
  sortOrder: number
  options?: TemplateFieldOption[]
}

export interface TemplateFieldOption {
  id: string
  optionValue: string
  optionLabel: string
  sortOrder: number
}

export interface BudgetTask {
  id: string
  name: string
  year: number
  budgetType: 'OPEX' | 'CAPEX'
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  deadline?: string
  description?: string
  createdAt: string
}

export interface SpecialRequirement {
  id: string
  templateId: string
  templateName?: string
  departmentId: string
  departmentName?: string
  year: number
  formData: Record<string, any>
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  filledBy?: string
  filledByName?: string
  linkedBudgetId?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseHistory {
  id: string
  description: string
  specification?: string
  historicalPrice: number
  suggestedPrice: number
  supplier?: string
  purchaseDate?: string
  usageCount: number
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
