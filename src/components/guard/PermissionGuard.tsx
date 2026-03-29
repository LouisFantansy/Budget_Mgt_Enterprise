import React from 'react';
import { hasPermission } from '../../utils/permission';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * 权限守卫组件
 * 用于控制按钮级别的权限
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  requireAll = false,
  fallback = null,
}) => {
  // 获取用户权限
  const user = localStorage.getItem('user');
  let userPermissions: string[] = [];
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      userPermissions = userData.permissions || [];
    } catch (error) {
      console.error('解析用户权限失败:', error);
    }
  }

  // 检查权限
  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? permission.every(p => hasPermission(userPermissions, p))
      : permission.some(p => hasPermission(userPermissions, p))
    : hasPermission(userPermissions, permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * 权限判断 Hook
 */
export const usePermission = () => {
  const getUserPermissions = (): string[] => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.permissions || [];
      } catch (error) {
        console.error('解析用户权限失败:', error);
        return [];
      }
    }
    return [];
  };

  const checkPermission = (permission: string): boolean => {
    const userPermissions = getUserPermissions();
    return hasPermission(userPermissions, permission);
  };

  const checkAnyPermission = (permissions: string[]): boolean => {
    const userPermissions = getUserPermissions();
    return permissions.some(p => hasPermission(userPermissions, p));
  };

  const checkAllPermissions = (permissions: string[]): boolean => {
    const userPermissions = getUserPermissions();
    return permissions.every(p => hasPermission(userPermissions, p));
  };

  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    userPermissions: getUserPermissions(),
  };
};
