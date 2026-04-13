import api from './api';
import { BudgetAdjustment } from '../types';

export const adjustmentService = {
  getAll: async (params?: { budgetId?: string; status?: string }): Promise<BudgetAdjustment[]> => {
    return api.get('/adjustment', { params });
  },

  getById: async (id: string): Promise<BudgetAdjustment> => {
    return api.get(`/adjustment/${id}`);
  },

  create: async (data: Partial<BudgetAdjustment>): Promise<BudgetAdjustment> => {
    return api.post('/adjustment', data);
  },

  submit: async (id: string): Promise<BudgetAdjustment> => {
    return api.post(`/adjustment/${id}/submit`);
  },

  approve: async (id: string): Promise<BudgetAdjustment> => {
    return api.post(`/adjustment/${id}/approve`);
  },

  reject: async (id: string, reason: string): Promise<BudgetAdjustment> => {
    return api.post(`/adjustment/${id}/reject`, { reason });
  },
};
