import api from './api';

export type Ledger = 'PR' | 'PO' | 'ACTUAL';

export const analysisService = {
  getVariance: async (params: {
    year: number;
    budgetType?: string;
    organizationId?: string;
    ledger?: Ledger;
  }) => {
    return api.get('/analysis/variance', { params });
  },
};

