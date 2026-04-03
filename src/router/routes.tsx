import { lazy } from 'react';

// 懒加载页面组件 - 使用命名导入
const Dashboard = lazy(() => import('../pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.Login })));
const BudgetList = lazy(() => import('../pages/BudgetList').then(module => ({ default: module.BudgetList })));
const BudgetCreate = lazy(() => import('../pages/BudgetCreate').then(module => ({ default: module.BudgetCreate })));
const BudgetCreateAdvanced = lazy(() => import('../pages/BudgetCreateAdvanced').then(module => ({ default: module.BudgetCreateAdvanced })));
const BudgetDetail = lazy(() => import('../pages/BudgetDetail').then(module => ({ default: module.BudgetDetail })));
const BudgetAdjust = lazy(() => import('../pages/BudgetAdjust').then(module => ({ default: module.BudgetAdjust })));
const BudgetSummary = lazy(() => import('../pages/BudgetSummary').then(module => ({ default: module.BudgetSummary })));
const BudgetUsageTracker = lazy(() => import('../pages/BudgetUsageTracker').then(module => ({ default: module.BudgetUsageTracker })));
const PurchaseRequestList = lazy(() => import('../pages/PurchaseRequestList').then(module => ({ default: module.PurchaseRequestList })));
const PurchaseRequestCreate = lazy(() => import('../pages/PurchaseRequestCreate').then(module => ({ default: module.PurchaseRequestCreate })));
const PurchaseRequestDetail = lazy(() => import('../pages/PurchaseRequestDetail').then(module => ({ default: module.PurchaseRequestDetail })));
const PurchaseImport = lazy(() => import('../pages/PurchaseImport').then(module => ({ default: module.PurchaseImport })));
const SettlementImport = lazy(() => import('../pages/SettlementImport').then(module => ({ default: module.SettlementImport })));
const Approval = lazy(() => import('../pages/Approval').then(module => ({ default: module.Approval })));
const Analysis = lazy(() => import('../pages/Analysis').then(module => ({ default: module.Analysis })));
const Mapping = lazy(() => import('../pages/Mapping').then(module => ({ default: module.Mapping })));
const DepartmentList = lazy(() => import('../pages/DepartmentList').then(module => ({ default: module.DepartmentList })));
const Settings = lazy(() => import('../pages/Settings').then(module => ({ default: module.Settings })));
// New pages for Task #9
const AuditLog = lazy(() => import('../pages/AuditLog').then(module => ({ default: module.AuditLog })));
const UserManagement = lazy(() => import('../pages/UserManagement').then(module => ({ default: module.UserManagement })));
const RoleManagement = lazy(() => import('../pages/RoleManagement').then(module => ({ default: module.RoleManagement })));

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
  // New routes for Task #9
  {
    path: '/audit-logs',
    element: <AuditLog />,
    requiresAuth: true,
  },
  {
    path: '/users',
    element: <UserManagement />,
    requiresAuth: true,
  },
  {
    path: '/roles',
    element: <RoleManagement />,
    requiresAuth: true,
  },
];
