import { PurchaseStatus, ApprovalStatus, UserRole, ApprovalStepStatus } from '@/types'
import type { BudgetStatus } from '@/types'

// ===================== 角色标签 =====================
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.FIRST_BUDGET_ADMIN]: '一级部门预算管理员',
  [UserRole.FIRST_BUDGET_HOST]: '一级部门预算管理员主办',
  [UserRole.FIRST_DEPT_HEAD]: '一级部门负责人',
  [UserRole.SECOND_BUDGET_ADMIN_PRIMARY]: '主二级部门预算管理员',
  [UserRole.SECOND_BUDGET_ADMIN_SECONDARY]: '次二级部门预算管理员',
  [UserRole.SECOND_DEPT_HEAD]: '二级部门负责人',
  [UserRole.ENGINEER]: '一线工程师',
  [UserRole.ADMIN]: '系统管理员',
}

// ===================== 预算状态 =====================
export const BUDGET_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  APPROVED: '已审批',
  REJECTED: '已驳回',
  ACTIVE: '执行中',
  FROZEN: '已冻结',
  CLOSED: '已关闭',
}

export const BUDGET_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#909399',
  PENDING_APPROVAL: '#E6A23C',
  APPROVED: '#67C23A',
  REJECTED: '#F56C6C',
  ACTIVE: '#409EFF',
  FROZEN: '#909399',
  CLOSED: '#C0C4CC',
}

// 预算状态映射（用于 el-tag）
export const BUDGET_STATUS_MAP: Record<string, { label: string; type: '' | 'success' | 'warning' | 'danger' | 'info' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  PENDING_APPROVAL: { label: '待审批', type: 'warning' },
  PENDING: { label: '待审批', type: 'warning' },
  APPROVED: { label: '已审批', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
  ADJUSTED: { label: '已调整', type: '' },
  CLOSED: { label: '已关闭', type: 'info' },
  ACTIVE: { label: '执行中', type: 'success' },
  FROZEN: { label: '已冻结', type: 'info' },
}

// 预算类型映射
export const BUDGET_TYPE_MAP: Record<string, { label: string; type: '' | 'success' | 'warning' | 'danger' | 'info' | 'primary' }> = {
  OPEX: { label: '运营支出', type: 'primary' },
  CAPEX: { label: '资本支出', type: 'success' },
  ALL: { label: '全部', type: 'info' },
}

// ===================== 采购状态 =====================
export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  [PurchaseStatus.DRAFT]: '草稿',
  [PurchaseStatus.PENDING_APPROVAL]: '待审批',
  [PurchaseStatus.APPROVED]: '已审批',
  [PurchaseStatus.REJECTED]: '已驳回',
  [PurchaseStatus.ORDERED]: '已下单',
  [PurchaseStatus.DELIVERED]: '已交付',
  [PurchaseStatus.CANCELLED]: '已取消',
}

export const PURCHASE_STATUS_COLORS: Record<PurchaseStatus, string> = {
  [PurchaseStatus.DRAFT]: '#909399',
  [PurchaseStatus.PENDING_APPROVAL]: '#E6A23C',
  [PurchaseStatus.APPROVED]: '#67C23A',
  [PurchaseStatus.REJECTED]: '#F56C6C',
  [PurchaseStatus.ORDERED]: '#409EFF',
  [PurchaseStatus.DELIVERED]: '#67C23A',
  [PurchaseStatus.CANCELLED]: '#C0C4CC',
}

// ===================== 审批状态 =====================
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: '待审批',
  [ApprovalStatus.APPROVED]: '已通过',
  [ApprovalStatus.REJECTED]: '已驳回',
  [ApprovalStatus.CANCELLED]: '已取消',
}

export const APPROVAL_STEP_STATUS_LABELS: Record<ApprovalStepStatus, string> = {
  [ApprovalStepStatus.PENDING]: '待处理',
  [ApprovalStepStatus.APPROVED]: '已通过',
  [ApprovalStepStatus.REJECTED]: '已驳回',
  [ApprovalStepStatus.SKIPPED]: '已跳过',
}

// ===================== 分页默认值 =====================
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ===================== 文件上传限制 =====================
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMPORT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
]
