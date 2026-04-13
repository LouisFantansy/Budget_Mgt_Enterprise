import api from './api';
import { Organization, BudgetAccount, IpdProject } from '../types';

export const masterService = {
  // 组织架构
  getOrganizations: async (params?: { parentId?: string; level?: number }): Promise<Organization[]> => {
    return api.get('/master/organizations', { params });
  },

  getOrganizationTree: async (): Promise<Organization[]> => {
    return api.get('/master/organizations/tree');
  },

  getOrganization: async (id: string): Promise<Organization> => {
    return api.get(`/master/organizations/${id}`);
  },

  createOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    return api.post('/master/organizations', data);
  },

  updateOrganization: async (id: string, data: Partial<Organization>): Promise<Organization> => {
    return api.put(`/master/organizations/${id}`, data);
  },

  deleteOrganization: async (id: string): Promise<void> => {
    return api.delete(`/master/organizations/${id}`);
  },

  // 预算科目
  getBudgetAccounts: async (params?: { type?: string }): Promise<BudgetAccount[]> => {
    return api.get('/master/budget-accounts', { params });
  },

  getBudgetAccountTree: async (): Promise<BudgetAccount[]> => {
    return api.get('/master/budget-accounts/tree');
  },

  createBudgetAccount: async (data: Partial<BudgetAccount>): Promise<BudgetAccount> => {
    return api.post('/master/budget-accounts', data);
  },

  updateBudgetAccount: async (id: string, data: Partial<BudgetAccount>): Promise<BudgetAccount> => {
    return api.put(`/master/budget-accounts/${id}`, data);
  },

  deleteBudgetAccount: async (id: string): Promise<void> => {
    return api.delete(`/master/budget-accounts/${id}`);
  },

  // IPD项目
  getProjects: async (params?: { status?: string }): Promise<IpdProject[]> => {
    return api.get('/master/ipd-projects', { params });
  },

  getProject: async (id: string): Promise<IpdProject> => {
    return api.get(`/master/ipd-projects/${id}`);
  },

  createProject: async (data: Partial<IpdProject>): Promise<IpdProject> => {
    return api.post('/master/ipd-projects', data);
  },

  updateProject: async (id: string, data: Partial<IpdProject>): Promise<IpdProject> => {
    return api.put(`/master/ipd-projects/${id}`, data);
  },

  deleteProject: async (id: string): Promise<void> => {
    return api.delete(`/master/ipd-projects/${id}`);
  },
};
