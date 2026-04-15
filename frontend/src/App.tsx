import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import BudgetList from './pages/budget/BudgetList';
import BudgetCreate from './pages/budget/BudgetCreate';
import DataImport from './pages/execution/DataImport';
import VarianceAnalysis from './pages/analysis/VarianceAnalysis';
import OrganizationList from './pages/master/OrganizationList';
import AccountList from './pages/master/AccountList';
import UserManagement from './pages/system/UserManagement';

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="budget" element={<Navigate to="/budget/list" replace />} />
        <Route path="budget/list" element={<BudgetList />} />
        <Route path="budget/create" element={<BudgetCreate />} />
        <Route path="execution/import" element={<DataImport />} />
        <Route path="analysis/variance" element={<VarianceAnalysis />} />
        <Route path="master/organization" element={<OrganizationList />} />
        <Route path="master/accounts" element={<AccountList />} />
        <Route path="system/users" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
