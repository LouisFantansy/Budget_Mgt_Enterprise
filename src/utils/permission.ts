/**
 * 权限判断工具函数
 */
import { Permission } from '../types';

/**
 * 检查用户是否有指定权限
 * @param userPermissions 用户权限列表
 * @param requiredPermission 需要的权限
 */
export const hasPermission = (
  userPermissions: string[],
  requiredPermission: string
): boolean => {
  // 管理员拥有所有权限
  if (userPermissions.includes('admin') || userPermissions.includes('*')) {
    return true;
  }
  
  return userPermissions.includes(requiredPermission);
};

/**
 * 检查用户是否有任一权限
 */
export const hasAnyPermission = (
  userPermissions: string[],
  permissions: string[]
): boolean => {
  return permissions.some(permission => hasPermission(userPermissions, permission));
};

/**
 * 检查用户是否有所有权限
 */
export const hasAllPermissions = (
  userPermissions: string[],
  permissions: string[]
): boolean => {
  return permissions.every(permission => hasPermission(userPermissions, permission));
};

/**
 * 生成权限字符串（模块。操作）
 */
export const generatePermission = (module: string, action: string): string => {
  return `${module}.${action}`;
};

/**
 * 权限枚举
 */
export const Permissions = {
  // 预算权限
  BUDGET_CREATE: 'budget.create',
  BUDGET_READ: 'budget.read',
  BUDGET_UPDATE: 'budget.update',
  BUDGET_DELETE: 'budget.delete',
  BUDGET_APPROVE: 'budget.approve',
  BUDGET_EXPORT: 'budget.export',
  
  // 采购权限
  PURCHASE_CREATE: 'purchase.create',
  PURCHASE_READ: 'purchase.read',
  PURCHASE_UPDATE: 'purchase.update',
  PURCHASE_DELETE: 'purchase.delete',
  PURCHASE_APPROVE: 'purchase.approve',
  PURCHASE_EXPORT: 'purchase.export',
  
  // 审批权限
  APPROVAL_READ: 'approval.read',
  APPROVAL_APPROVE: 'approval.approve',
  
  // 报表权限
  REPORT_READ: 'report.read',
  REPORT_EXPORT: 'report.export',
  
  // 系统管理权限
  SYSTEM_USER_MANAGE: 'system.user.manage',
  SYSTEM_ROLE_MANAGE: 'system.role.manage',
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_AUDIT: 'system.audit',
} as const;
