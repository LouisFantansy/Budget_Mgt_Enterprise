import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: '登录', layout: 'blank', requiresAuth: false },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { title: '仪表盘', requiresAuth: true },
  },
  // 预算管理
  {
    path: '/budgets',
    name: 'BudgetList',
    component: () => import('@/pages/BudgetList.vue'),
    meta: { title: '预算列表', requiresAuth: true },
  },
  {
    path: '/budgets/create',
    name: 'BudgetCreate',
    component: () => import('@/pages/BudgetCreate.vue'),
    meta: { title: '创建预算', requiresAuth: true },
  },
  {
    path: '/budgets/create-advanced',
    name: 'BudgetCreateAdvanced',
    component: () => import('@/pages/BudgetCreateAdvanced.vue'),
    meta: { title: '高级创建', requiresAuth: true },
  },
  {
    path: '/budgets/:id',
    name: 'BudgetDetail',
    component: () => import('@/pages/BudgetDetail.vue'),
    meta: { title: '预算详情', requiresAuth: true },
  },
  {
    path: '/budgets/:id/edit',
    name: 'BudgetEdit',
    component: () => import('@/pages/BudgetCreate.vue'),
    meta: { title: '编辑预算', requiresAuth: true },
  },
  {
    path: '/budgets/:id/adjust',
    name: 'BudgetAdjust',
    component: () => import('@/pages/BudgetAdjust.vue'),
    meta: { title: '预算调整', requiresAuth: true },
  },
  {
    path: '/budgets/summary',
    name: 'BudgetSummary',
    component: () => import('@/pages/BudgetSummary.vue'),
    meta: { title: '预算汇总', requiresAuth: true },
  },
  {
    path: '/budgets/usage',
    name: 'BudgetUsageTracker',
    component: () => import('@/pages/BudgetUsageTracker.vue'),
    meta: { title: '使用追踪', requiresAuth: true },
  },
  // 采购管理
  {
    path: '/purchase',
    name: 'PurchaseRequestList',
    component: () => import('@/pages/PurchaseRequestList.vue'),
    meta: { title: '采购申请列表', requiresAuth: true },
  },
  {
    path: '/purchase/create',
    name: 'PurchaseRequestCreate',
    component: () => import('@/pages/PurchaseRequestCreate.vue'),
    meta: { title: '创建采购申请', requiresAuth: true },
  },
  {
    path: '/purchase/:id',
    name: 'PurchaseRequestDetail',
    component: () => import('@/pages/PurchaseRequestDetail.vue'),
    meta: { title: '采购申请详情', requiresAuth: true },
  },
  // 数据导入
  {
    path: '/import/purchase',
    name: 'PurchaseImport',
    component: () => import('@/pages/PurchaseImport.vue'),
    meta: { title: '采购订单导入', requiresAuth: true },
  },
  {
    path: '/import/settlement',
    name: 'SettlementImport',
    component: () => import('@/pages/SettlementImport.vue'),
    meta: { title: '结算单导入', requiresAuth: true },
  },
  {
    path: '/mapping',
    name: 'Mapping',
    component: () => import('@/pages/Mapping.vue'),
    meta: { title: '三单匹配', requiresAuth: true },
  },
  // 审批中心
  {
    path: '/approval',
    name: 'Approval',
    component: () => import('@/pages/Approval.vue'),
    meta: { title: '审批中心', requiresAuth: true },
  },
  // 报表分析
  {
    path: '/analysis',
    name: 'Analysis',
    component: () => import('@/pages/Analysis.vue'),
    meta: { title: '报表分析', requiresAuth: true },
  },
  // 系统管理
  {
    path: '/departments',
    name: 'DepartmentList',
    component: () => import('@/pages/DepartmentList.vue'),
    meta: { title: '部门管理', requiresAuth: true, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('@/pages/UserManagement.vue'),
    meta: { title: '用户管理', requiresAuth: true, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  },
  {
    path: '/roles',
    name: 'RoleManagement',
    component: () => import('@/pages/RoleManagement.vue'),
    meta: { title: '角色管理', requiresAuth: true, roles: ['SUPER_ADMIN'] },
  },
  {
    path: '/audit-logs',
    name: 'AuditLog',
    component: () => import('@/pages/AuditLog.vue'),
    meta: { title: '审计日志', requiresAuth: true, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '系统设置', requiresAuth: true, roles: ['SUPER_ADMIN'] },
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  NProgress.start()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 企业级预算管理系统`
  }

  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  
  // 直接从 localStorage 读取 token，确保与 API 拦截器一致
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  if (requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
