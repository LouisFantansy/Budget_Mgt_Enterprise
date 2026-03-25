import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';

// 预算管理页面
import BudgetList from './pages/budget/BudgetList';
import BudgetCreate from './pages/budget/BudgetCreate';
import BudgetDetail from './pages/budget/BudgetDetail';

// 执行管理页面
import ExecutionMonitor from './pages/execution/ExecutionMonitor';
import DataImport from './pages/execution/DataImport';

// 分析报表页面
import VarianceAnalysis from './pages/analysis/VarianceAnalysis';
import ReportCenter from './pages/analysis/ReportCenter';

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
    <Layout>
      <Routes>
        {/* 仪表板 */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 预算管理 */}
        <Route path="/budget" element={<BudgetList />} />
        <Route path="/budget/create" element={<BudgetCreate />} />
        <Route path="/budget/:id" element={<BudgetDetail />} />
        
        {/* 执行管理 */}
        <Route path="/execution" element={<ExecutionMonitor />} />
        <Route path="/execution/import" element={<DataImport />} />
        
        {/* 分析报表 */}
        <Route path="/analysis/variance" element={<VarianceAnalysis />} />
        <Route path="/analysis/report" element={<ReportCenter />} />
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
