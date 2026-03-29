import React from 'react';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 认证守卫组件
 * 用于保护需要登录访问的页面
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const isAuthenticated = !!localStorage.getItem('token');

  // 如果需要认证但未登录，跳转到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果不需要认证但已登录，跳转到首页
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
