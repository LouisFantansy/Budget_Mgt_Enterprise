import { useCallback } from 'react';
import { authApi } from '../api/modules/auth.api';
import type { LoginRequest, ChangePasswordRequest } from '../api/types/auth.types';

/**
 * 认证相关 Hook
 */
export const useAuth = () => {
  /**
   * 登录
   */
  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    const { token, user } = response.data;
    
    // 保存 Token 和用户信息
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  /**
   * 修改密码
   */
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    await authApi.changePassword(data);
  }, []);

  /**
   * 获取当前用户信息
   */
  const getCurrentUser = useCallback(async () => {
    const response = await authApi.getCurrentUser();
    return response.data;
  }, []);

  /**
   * 检查是否已登录
   */
  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem('token');
  }, []);

  /**
   * 获取存储的用户信息
   */
  const getUserInfo = useCallback(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
    return null;
  }, []);

  return {
    login,
    logout,
    changePassword,
    getCurrentUser,
    isAuthenticated,
    getUserInfo,
  };
};
