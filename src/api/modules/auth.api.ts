import { apiClient } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  LoginApiResponse,
  UserInfoApiResponse,
  VoidApiResponse,
} from '../types/auth.types';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (data: LoginRequest): Promise<LoginApiResponse> => {
    return apiClient.post('/auth/login', data);
  },

  /**
   * 用户登出
   */
  logout: (): Promise<VoidApiResponse> => {
    return apiClient.post('/auth/logout');
  },

  /**
   * 刷新 Token
   */
  refreshToken: (): Promise<LoginApiResponse> => {
    return apiClient.post('/auth/refresh');
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: (): Promise<UserInfoApiResponse> => {
    return apiClient.get('/auth/me');
  },

  /**
   * 修改密码
   */
  changePassword: (data: ChangePasswordRequest): Promise<VoidApiResponse> => {
    return apiClient.put('/auth/password', data);
  },
};
