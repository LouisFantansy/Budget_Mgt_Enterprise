/**
 * 全局常量定义
 */

// 预算类型
export const BUDGET_TYPES = {
  OPEX: { value: 'OPEX', label: '运营支出' },
  CAPEX: { value: 'CAPEX', label: '资本支出' },
} as const;

// 预算状态
export const BUDGET_STATUS = {
  DRAFT: { value: 'DRAFT', label: '草稿', color: 'default' },
  PENDING: { value: 'PENDING', label: '待审批', color: 'processing' },
  APPROVED: { value: 'APPROVED', label: '已批准', color: 'success' },
  REJECTED: { value: 'REJECTED', label: '已拒绝', color: 'error' },
  ADJUSTED: { value: 'ADJUSTED', label: '已调整', color: 'warning' },
  CLOSED: { value: 'CLOSED', label: '已关闭', color: 'default' },
} as const;

// 采购申请状态
export const PURCHASE_STATUS = {
  DRAFT: { value: 'DRAFT', label: '草稿', color: 'default' },
  PENDING: { value: 'PENDING', label: '待提交', color: 'warning' },
  IN_APPROVAL: { value: 'IN_APPROVAL', label: '审批中', color: 'processing' },
  APPROVED: { value: 'APPROVED', label: '已批准', color: 'success' },
  REJECTED: { value: 'REJECTED', label: '已拒绝', color: 'error' },
  CANCELLED: { value: 'CANCELLED', label: '已取消', color: 'default' },
} as const;

// 紧急程度
export const URGENCY_LEVELS = {
  LOW: { value: 'LOW', label: '低', color: 'default' },
  NORMAL: { value: 'NORMAL', label: '普通', color: 'blue' },
  HIGH: { value: 'HIGH', label: '高', color: 'orange' },
  URGENT: { value: 'URGENT', label: '紧急', color: 'red' },
} as const;

// 审批状态
export const APPROVAL_STATUS = {
  PENDING: { value: 'PENDING', label: '待处理', color: 'default' },
  IN_PROGRESS: { value: 'IN_PROGRESS', label: '进行中', color: 'processing' },
  APPROVED: { value: 'APPROVED', label: '已批准', color: 'success' },
  REJECTED: { value: 'REJECTED', label: '已拒绝', color: 'error' },
  CANCELLED: { value: 'CANCELLED', label: '已取消', color: 'default' },
} as const;

// 审批操作
export const APPROVAL_ACTIONS = {
  APPROVE: { value: 'APPROVE', label: '同意' },
  REJECT: { value: 'REJECT', label: '拒绝' },
  WITHDRAW: { value: 'WITHDRAW', label: '撤回' },
} as const;

// 通知类型
export const NOTIFICATION_TYPES = {
  APPROVAL_PENDING: { value: 'APPROVAL_PENDING', label: '待审批', icon: 'ClockCircleOutlined' },
  APPROVAL_RESULT: { value: 'APPROVAL_RESULT', label: '审批结果', icon: 'CheckCircleOutlined' },
  BUDGET_WARNING: { value: 'BUDGET_WARNING', label: '预算预警', icon: 'ExclamationCircleOutlined' },
  BUDGET_OVERRUN: { value: 'BUDGET_OVERRUN', label: '预算超支', icon: 'WarningOutlined' },
  SYSTEM: { value: 'SYSTEM', label: '系统通知', icon: 'BellOutlined' },
  REPORT_READY: { value: 'REPORT_READY', label: '报表就绪', icon: 'FileDoneOutlined' },
} as const;

// 用户状态
export const USER_STATUS = {
  ACTIVE: { value: 'ACTIVE', label: '正常', color: 'success' },
  DISABLED: { value: 'DISABLED', label: '禁用', color: 'default' },
  LOCKED: { value: 'LOCKED', label: '锁定', color: 'error' },
} as const;

// 部门状态
export const DEPT_STATUS = {
  ACTIVE: { value: 'ACTIVE', label: '启用', color: 'success' },
  INACTIVE: { value: 'INACTIVE', label: '停用', color: 'default' },
} as const;

// 分页选项
export const PAGINATION_OPTIONS = [10, 20, 50, 100];

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 20;

// 文件大小限制（MB）
export const FILE_SIZE_LIMIT = {
  EXCEL: 10, // Excel 文件最大 10MB
  PDF: 20,   // PDF 文件最大 20MB
  IMAGE: 5,  // 图片最大 5MB
} as const;

// 允许的文件类型
export const ALLOWED_FILE_TYPES = {
  EXCEL: ['.xlsx', '.xls'],
  CSV: ['.csv'],
  PDF: ['.pdf'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif'],
} as const;

// 财年配置
export const FISCAL_YEAR = {
  START_MONTH: 1, // 财年开始月份（1 月）
  END_MONTH: 12,  // 财年结束月份（12 月）
};

// 系统配置
export const SYSTEM_CONFIG = {
  APP_NAME: '企业预算管理系统',
  APP_VERSION: '2.0.0',
  SUPPORT_EMAIL: 'support@example.com',
};
