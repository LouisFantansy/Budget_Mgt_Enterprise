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
  // 预算管理（新架构）
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
    path: '/budgets/summary',
    name: 'BudgetSummary',
    component: () => import('@/pages/BudgetSummary.vue'),
    meta: { title: '预算汇总', requiresAuth: true, roles: ['FIRST_BUDGET_ADMIN', 'FIRST_BUDGET_HOST', 'FIRST_DEPT_HEAD'] },
  },
  // 预算模板管理
  {
    path: '/budget-templates',
    name: 'BudgetTemplateList',
    component: () => import('@/pages/BudgetTemplateList.vue'),
    meta: { title: '预算模板管理', requiresAuth: true, roles: ['FIRST_BUDGET_ADMIN'] },
  },
  // 专题需求收集表
  {
    path: '/special-requirements',
    name: 'SpecialRequirementList',
    component: () => import('@/pages/SpecialRequirementList.vue'),
    meta: { title: '专题需求收集', requiresAuth: true },
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
    meta: { title: '部门管理', requiresAuth: true, roles: ['ADMIN', 'FIRST_BUDGET_ADMIN'] },
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('@/pages/UserManagement.vue'),
    meta: { title: '用户管理', requiresAuth: true, roles: ['ADMIN', 'FIRST_BUDGET_ADMIN'] },
  },
  {
    path: '/roles',
    name: 'RoleManagement',
    component: () => import('@/pages/RoleManagement.vue'),
    meta: { title: '角色管理', requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/audit-logs',
    name: 'AuditLog',
    component: () => import('@/pages/AuditLog.vue'),
    meta: { title: '审计日志', requiresAuth: true, roles: ['ADMIN', 'FIRST_BUDGET_ADMIN'] },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '系统设置', requiresAuth: true },
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

  if (to.meta.title) {
    document.title = `${to.meta.title} - 企业级预算管理系统`
  }

  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  if (requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.path === '/login' && isAuthenticated) {
    next('/')
    return
  }

  // 角色权限检查
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = authStore.userRoles
    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role))
    if (!hasAllowedRole) {
      next('/')
      return
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
