import api from './api';
import { Budget, BudgetItem } from '../types';

export const budgetService = {
  getAll: async (params?: { year?: number; type?: string; status?: string; orgId?: string }): Promise<Budget[]> => {
    return api.get('/budget', { params });
  },

  getById: async (id: string): Promise<Budget> => {
    return api.get(`/budget/${id}`);
  },

  create: async (data: Partial<Budget>): Promise<Budget> => {
    return api.post('/budget', data);
  },

  update: async (id: string, data: Partial<Budget>): Promise<Budget> => {
    return api.put(`/budget/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/budget/${id}`);
  },

  addItem: async (budgetId: string, data: Partial<BudgetItem>): Promise<BudgetItem> => {
    return api.post(`/budget/${budgetId}/items`, data);
  },

  addItems: async (budgetId: string, items: Partial<BudgetItem>[]): Promise<BudgetItem[]> => {
    return api.post(`/budget/${budgetId}/items/batch`, items);
  },

  updateItem: async (itemId: string, data: Partial<BudgetItem>): Promise<BudgetItem> => {
    return api.put(`/budget/items/${itemId}`, data);
  },

  deleteItem: async (itemId: string): Promise<void> => {
    return api.delete(`/budget/items/${itemId}`);
  },

  submit: async (id: string): Promise<Budget> => {
    return api.post(`/budget/${id}/submit`);
  },

  approve: async (id: string): Promise<Budget> => {
    return api.post(`/budget/${id}/approve`);
  },

  reject: async (id: string, reason: string): Promise<Budget> => {
    return api.post(`/budget/${id}/reject`, { reason });
  },

  getExecutionStatus: async (id: string): Promise<any> => {
    return api.get(`/budget/${id}/execution`);
  },
};
