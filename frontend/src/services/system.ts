import api from './api';
import { SystemUser, SystemRole, DashboardData } from '../types';

export const systemService = {
  // Dashboard
  getDashboardData: async (year?: number): Promise<DashboardData> => {
    return api.get('/dashboard', { params: year ? { year } : {} });
  },

  // 用户管理
  getUsers: async (params?: { keyword?: string; status?: string; page?: number; pageSize?: number }): Promise<{ data: SystemUser[]; total: number }> => {
    return api.get('/system/users', { params });
  },

  getUser: async (id: string): Promise<SystemUser> => {
    return api.get(`/system/users/${id}`);
  },

  createUser: async (data: {
    username: string;
    password: string;
    realName: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    roleCodes?: string[];
  }): Promise<SystemUser> => {
    return api.post('/system/users', data);
  },

  updateUser: async (id: string, data: {
    realName?: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    status?: string;
    roleCodes?: string[];
  }): Promise<SystemUser> => {
    return api.put(`/system/users/${id}`, data);
  },

  resetPassword: async (id: string, password: string): Promise<void> => {
    return api.post(`/system/users/${id}/reset-password`, { password });
  },

  deleteUser: async (id: string): Promise<void> => {
    return api.delete(`/system/users/${id}`);
  },

  // 角色管理
  getRoles: async (): Promise<SystemRole[]> => {
    return api.get('/system/roles');
  },
};
