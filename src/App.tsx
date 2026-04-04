import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { BudgetList } from './pages/BudgetList'
import { BudgetDetail } from './pages/BudgetDetail'
import { BudgetCreate } from './pages/BudgetCreate'
import { BudgetCreateAdvanced } from './pages/BudgetCreateAdvanced'
import { BudgetAdjust } from './pages/BudgetAdjust'
import { BudgetSummary } from './pages/BudgetSummary'
import { DepartmentList } from './pages/DepartmentList'
import { PurchaseImport } from './pages/PurchaseImport'
import { SettlementImport } from './pages/SettlementImport'
import { Mapping } from './pages/Mapping'
import { Approval } from './pages/Approval'
import { Analysis } from './pages/Analysis'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { PurchaseRequestList } from './pages/PurchaseRequestList'
import { PurchaseRequestDetail } from './pages/PurchaseRequestDetail'
import { PurchaseRequestCreate } from './pages/PurchaseRequestCreate'
import { BudgetUsageTracker } from './pages/BudgetUsageTracker'
import { UserManagement } from './pages/UserManagement'
import { RoleManagement } from './pages/RoleManagement'
import { AuditLog } from './pages/AuditLog'
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="departments" element={<DepartmentList />} />
          <Route path="budgets" element={<BudgetList />} />
          <Route path="budgets/create" element={<BudgetCreate />} />
          <Route path="budgets/create-advanced" element={<BudgetCreateAdvanced />} />
          <Route path="budgets/:id" element={<BudgetDetail />} />
          <Route path="budgets/:id/adjust" element={<BudgetAdjust />} />
          <Route path="budgets/summary" element={<BudgetSummary />} />
          <Route path="budgets/usage" element={<BudgetUsageTracker />} />
          <Route path="purchase" element={<PurchaseRequestList />} />
          <Route path="purchase/create" element={<PurchaseRequestCreate />} />
          <Route path="purchase/:id" element={<PurchaseRequestDetail />} />
          <Route path="import/purchase" element={<PurchaseImport />} />
          <Route path="import/settlement" element={<SettlementImport />} />
          <Route path="mapping" element={<Mapping />} />
          <Route path="approval" element={<Approval />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="settings" element={<Settings />} />
          {/* 系统管理 */}
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="audit-logs" element={<AuditLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App