import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import * as authApi from '@/api/modules/auth'

export const useAuthStore = defineStore('auth', () => {
  // ===================== State =====================
  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshTokenValue = ref<string>(localStorage.getItem('refreshToken') || '')
  const user = ref<User | null>(null)

  // ===================== Getters =====================
  const isAuthenticated = computed(() => !!token.value)
  const userRoles = computed(() => user.value?.roles?.map((r) => r.code) || [])
  const userPermissions = computed(() => user.value?.permissions || [])

  /**
   * 检查是否拥有指定角色
   */
  function hasRole(roleCode: string): boolean {
    if (!user.value) return false
    return user.value.roles?.some((r) => r.code === roleCode) ?? false
  }

  /** 一级部门预算管理员 */
  const isFirstBudgetAdmin = computed(() => hasRole('FIRST_BUDGET_ADMIN'))
  /** 一级部门预算管理员主办 */
  const isFirstBudgetHost = computed(() => hasRole('FIRST_BUDGET_HOST'))
  /** 一级部门负责人 */
  const isFirstDeptHead = computed(() => hasRole('FIRST_DEPT_HEAD'))
  /** 主二级部门预算管理员 */
  const isSecondBudgetAdminPrimary = computed(() => hasRole('SECOND_BUDGET_ADMIN_PRIMARY'))
  /** 次二级部门预算管理员 */
  const isSecondBudgetAdminSecondary = computed(() => hasRole('SECOND_BUDGET_ADMIN_SECONDARY'))
  /** 二级部门负责人 */
  const isSecondDeptHead = computed(() => hasRole('SECOND_DEPT_HEAD'))
  /** 工程师 */
  const isEngineer = computed(() => hasRole('ENGINEER'))
  /** 系统管理员 */
  const isAdmin = computed(() => hasRole('ADMIN'))

  /** 是否为一级别部门角色（可看全部数据） */
  const isFirstLevel = computed(() => isFirstBudgetAdmin.value || isFirstBudgetHost.value || isFirstDeptHead.value)
  /** 是否为二级部门角色（只看本部门） */
  const isSecondLevel = computed(() => isSecondBudgetAdminPrimary.value || isSecondBudgetAdminSecondary.value || isSecondDeptHead.value)
  /** 是否为预算管理员（可编辑预算） */
  const isBudgetAdmin = computed(() => isFirstBudgetAdmin.value || isSecondBudgetAdminPrimary.value || isSecondBudgetAdminSecondary.value)

  // ===================== Actions =====================
  async function login(username: string, password: string) {
    const res = await authApi.login({ username, password })
    // 后端返回嵌套数据结构，需要解包
    const nestedData = (res.data as any)?.data
    const responseData = nestedData || res.data
    const { token: newToken, refreshToken: newRefreshToken, user: userInfo } = responseData

    token.value = newToken
    refreshTokenValue.value = newRefreshToken
    user.value = userInfo

    localStorage.setItem('token', newToken)
    localStorage.setItem('refreshToken', newRefreshToken)
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 即使接口失败也要清除本地状态
    } finally {
      token.value = ''
      refreshTokenValue.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  async function refresh() {
    const res = await authApi.refreshToken(refreshTokenValue.value)
    const { token: newToken, refreshToken: newRefreshToken } = res.data

    token.value = newToken
    refreshTokenValue.value = newRefreshToken
    localStorage.setItem('token', newToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  async function fetchUserInfo() {
    const res = await authApi.getUserInfo()
    user.value = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
  }

  // 初始化时从 localStorage 恢复用户信息
  function initFromStorage() {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        user.value = null
      }
    }
  }

  // 初始化
  initFromStorage()

  return {
    token,
    refreshToken: refreshTokenValue,
    user,
    isAuthenticated,
    userRoles,
    userPermissions,
    hasRole,
    isFirstBudgetAdmin,
    isFirstBudgetHost,
    isFirstDeptHead,
    isSecondBudgetAdminPrimary,
    isSecondBudgetAdminSecondary,
    isSecondDeptHead,
    isEngineer,
    isAdmin,
    isFirstLevel,
    isSecondLevel,
    isBudgetAdmin,
    login,
    logout,
    refresh,
    fetchUserInfo,
  }
})
