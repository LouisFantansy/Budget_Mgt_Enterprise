import { createSlice } from '@reduxjs/toolkit';

interface BudgetState {
  budgets: any[];
  currentBudget: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  budgets: [],
  currentBudget: null,
  loading: false,
  error: null,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setBudgets: (state, action) => {
      state.budgets = action.payload;
    },
    setCurrentBudget: (state, action) => {
      state.currentBudget = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setBudgets, setCurrentBudget, setLoading, setError } = budgetSlice.actions;
export default budgetSlice.reducer;
