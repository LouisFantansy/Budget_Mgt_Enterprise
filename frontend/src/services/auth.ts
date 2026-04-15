import api from './api';
import { LoginRequest, LoginResponse, User } from '../types/auth';

export const authService = {
  /**
   * 用户登录
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post('/auth/login', data);
  },

  /**
   * 用户登出
   */
  logout: async (): Promise<void> => {
    return api.post('/auth/logout');
  },

  /**
   * 刷新token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    return api.post('/auth/refresh', { refreshToken });
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (): Promise<User> => {
    return api.get('/auth/me');
  },
};
