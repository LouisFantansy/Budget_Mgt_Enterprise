import { ApiResponse, PaginatedResult, PaginationQuery } from '../../types';

// 认证相关类型定义

export interface LoginRequest {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// 通用 API 响应类型
export type LoginApiResponse = ApiResponse<LoginResponse>;
export type UserInfoApiResponse = ApiResponse<UserInfo>;
export type VoidApiResponse = ApiResponse<null>;

// 分页查询参数
export type PaginatedQuery<T extends PaginationQuery = PaginationQuery> = T;
export type PaginatedResponse<T> = ApiResponse<PaginatedResult<T>>;
