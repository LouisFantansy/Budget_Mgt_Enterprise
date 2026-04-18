import { apiClient } from '../client';
import type { ApiResponse, PaginatedResult, PaginationQuery, User, UserStatus, Role, Permission } from '../../types';

// ==================== 系统配置 ====================

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export interface UpdateConfigRequest {
  configs: Array<{
    key: string;
    value: string;
  }>;
}

export type SystemConfigListApiResponse = ApiResponse<SystemConfig[]>;

// ==================== 用户管理 ====================

export interface UserListQuery extends PaginationQuery {
  departmentId?: string;
  status?: UserStatus;
  keyword?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  departmentId: string;
  roleIds: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  status?: UserStatus;
  roleIds?: string[];
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export type UserApiResponse = ApiResponse<User>;
export type UserListApiResponse = ApiResponse<PaginatedResult<User>>;

// ==================== 角色管理 ====================

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}

export type RoleListApiResponse = ApiResponse<Role[]>;
export type RoleApiResponse = ApiResponse<Role>;
export type PermissionListApiResponse = ApiResponse<Permission[]>;

/**
 * 系统管理 API
 */
export const systemApi = {
  // ==================== 系统配置 ====================

  /**
   * 获取系统配置
   */
  getConfig: (): Promise<SystemConfigListApiResponse> => {
    return apiClient.get('/system/config/');
  },

  /**
   * 更新系统配置
   */
  updateConfig: (data: UpdateConfigRequest): Promise<SystemConfigListApiResponse> => {
    return apiClient.put('/system/config/', data);
  },

  // ==================== 用户管理 ====================

  /**
   * 获取用户列表
   */
  getUsers: (params?: UserListQuery): Promise<UserListApiResponse> => {
    return apiClient.get('/users/', { params });
  },

  /**
   * 创建用户
   */
  createUser: (data: CreateUserRequest): Promise<UserApiResponse> => {
    return apiClient.post('/users/', data);
  },

  /**
   * 更新用户
   */
  updateUser: (id: string, data: UpdateUserRequest): Promise<UserApiResponse> => {
    return apiClient.put(`/users/${id}`, data);
  },

  /**
   * 删除用户
   */
  deleteUser: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/users/${id}`);
  },

  /**
   * 重置用户密码
   */
  resetPassword: (id: string, data: ResetPasswordRequest): Promise<ApiResponse<null>> => {
    return apiClient.post(`/users/${id}/reset-password`, data);
  },

  // ==================== 角色管理 ====================

  /**
   * 获取角色列表
   */
  getRoles: (): Promise<RoleListApiResponse> => {
    return apiClient.get('/roles/');
  },

  /**
   * 创建角色
   */
  createRole: (data: CreateRoleRequest): Promise<RoleApiResponse> => {
    return apiClient.post('/roles/', data);
  },

  /**
   * 更新角色权限
   */
  updateRolePermissions: (id: string, data: UpdateRolePermissionsRequest): Promise<RoleApiResponse> => {
    return apiClient.put(`/roles/${id}/permissions`, data);
  },

  /**
   * 删除角色
   */
  deleteRole: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/roles/${id}`);
  },

  /**
   * 获取权限列表
   */
  getPermissions: (): Promise<PermissionListApiResponse> => {
    return apiClient.get('/permissions/');
  },
};
