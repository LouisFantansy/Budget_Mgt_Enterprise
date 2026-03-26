import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './components/Layout.css'
import './pages/Login.css'
import './pages/Dashboard.css'
import './pages/BudgetList.css'
import './pages/BudgetDetail.css'
import './pages/BudgetCreate.css'
import './pages/BudgetAdjust.css'
import './pages/PurchaseImport.css'
import './pages/Settings.css'
import './pages/DepartmentList.css'
import './pages/BudgetCreateAdvanced.css'
import './pages/BudgetSummary.css'
import './pages/PurchaseRequestList.css'
import './pages/PurchaseRequestDetail.css'
import './pages/PurchaseRequestCreate.css'
import './pages/BudgetUsageTracker.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)