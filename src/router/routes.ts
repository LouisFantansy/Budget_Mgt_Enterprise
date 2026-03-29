import { lazy } from 'react';

// 懒加载页面组件
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Login = lazy(() => import('../pages/Login'));
const BudgetList = lazy(() => import('../pages/BudgetList'));
const BudgetCreate = lazy(() => import('../pages/BudgetCreate'));
const BudgetCreateAdvanced = lazy(() => import('../pages/BudgetCreateAdvanced'));
const BudgetDetail = lazy(() => import('../pages/BudgetDetail'));
const BudgetAdjust = lazy(() => import('../pages/BudgetAdjust'));
const BudgetSummary = lazy(() => import('../pages/BudgetSummary'));
const BudgetUsageTracker = lazy(() => import('../pages/BudgetUsageTracker'));
const PurchaseRequestList = lazy(() => import('../pages/PurchaseRequestList'));
const PurchaseRequestCreate = lazy(() => import('../pages/PurchaseRequestCreate'));
const PurchaseRequestDetail = lazy(() => import('../pages/PurchaseRequestDetail'));
const PurchaseImport = lazy(() => import('../pages/PurchaseImport'));
const SettlementImport = lazy(() => import('../pages/SettlementImport'));
const Approval = lazy(() => import('../pages/Approval'));
const Analysis = lazy(() => import('../pages/Analysis'));
const Mapping = lazy(() => import('../pages/Mapping'));
const DepartmentList = lazy(() => import('../pages/DepartmentList'));
const Settings = lazy(() => import('../pages/Settings'));

// 路由配置
export const routes = [
  {
    path: '/login',
    element: <Login />,
    requiresAuth: false,
  },
  {
    path: '/',
    element: <Dashboard />,
    requiresAuth: true,
  },
  {
    path: '/budgets',
    element: <BudgetList />,
    requiresAuth: true,
  },
  {
    path: '/budgets/create',
    element: <BudgetCreate />,
    requiresAuth: true,
  },
  {
    path: '/budgets/create-advanced',
    element: <BudgetCreateAdvanced />,
    requiresAuth: true,
  },
  {
    path: '/budgets/:id',
    element: <BudgetDetail />,
    requiresAuth: true,
  },
  {
    path: '/budgets/:id/adjust',
    element: <BudgetAdjust />,
    requiresAuth: true,
  },
  {
    path: '/budgets/summary',
    element: <BudgetSummary />,
    requiresAuth: true,
  },
  {
    path: '/budgets/usage',
    element: <BudgetUsageTracker />,
    requiresAuth: true,
  },
  {
    path: '/purchases',
    element: <PurchaseRequestList />,
    requiresAuth: true,
  },
  {
    path: '/purchases/create',
    element: <PurchaseRequestCreate />,
    requiresAuth: true,
  },
  {
    path: '/purchases/:id',
    element: <PurchaseRequestDetail />,
    requiresAuth: true,
  },
  {
    path: '/purchases/import',
    element: <PurchaseImport />,
    requiresAuth: true,
  },
  {
    path: '/settlements/import',
    element: <SettlementImport />,
    requiresAuth: true,
  },
  {
    path: '/approvals',
    element: <Approval />,
    requiresAuth: true,
  },
  {
    path: '/analysis',
    element: <Analysis />,
    requiresAuth: true,
  },
  {
    path: '/mapping',
    element: <Mapping />,
    requiresAuth: true,
  },
  {
    path: '/departments',
    element: <DepartmentList />,
    requiresAuth: true,
  },
  {
    path: '/settings',
    element: <Settings />,
    requiresAuth: true,
  },
];
