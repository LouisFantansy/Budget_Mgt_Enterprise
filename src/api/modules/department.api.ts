import { apiClient } from '../client';
import type { ApiResponse, PaginatedResult, PaginationQuery, Department } from '../../types';

// 部门查询参数
export interface DepartmentListQuery extends PaginationQuery {
  parentId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  keyword?: string;
}

// 创建部门请求
export interface CreateDepartmentRequest {
  name: string;
  code: string;
  level: number;
  parentId?: string;
  managerId?: string;
  budgetAdminId?: string;
  sortOrder?: number;
}

// 更新部门请求
export interface UpdateDepartmentRequest {
  name?: string;
  managerId?: string;
  budgetAdminId?: string;
  sortOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

// 部门树节点
export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[];
}

// API 响应类型
export type DepartmentApiResponse = ApiResponse<Department>;
export type DepartmentListApiResponse = ApiResponse<Department[]>;
export type DepartmentTreeApiResponse = ApiResponse<DepartmentTreeNode[]>;

/**
 * 部门管理 API
 */
export const departmentApi = {
  /**
   * 获取部门树
   */
  getTree: (): Promise<DepartmentTreeApiResponse> => {
    return apiClient.get('/departments');
  },

  /**
   * 获取部门列表（平铺）
   */
  getList: (params?: DepartmentListQuery): Promise<DepartmentListApiResponse> => {
    return apiClient.get('/departments/list', { params });
  },

  /**
   * 获取部门详情
   */
  getById: (id: string): Promise<DepartmentApiResponse> => {
    return apiClient.get(`/departments/${id}`);
  },

  /**
   * 创建部门
   */
  create: (data: CreateDepartmentRequest): Promise<DepartmentApiResponse> => {
    return apiClient.post('/departments', data);
  },

  /**
   * 更新部门
   */
  update: (id: string, data: UpdateDepartmentRequest): Promise<DepartmentApiResponse> => {
    return apiClient.put(`/departments/${id}`, data);
  },

  /**
   * 删除部门
   */
  remove: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/departments/${id}`);
  },
};
