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
   * 检查是否拥有指定权限
   * @param module 模块名 (如 'budget', 'purchase')
   * @param action 操作 (如 'view', 'create', 'edit', 'delete')
   */
  function hasPermission(module: string, action: string): boolean {
    if (!user.value) return false
    // 超级管理员拥有所有权限
    if (user.value.roles?.some((r) => r.code === 'SUPER_ADMIN')) return true
    const permissionCode = `${module}:${action}`
    return user.value.permissions?.includes(permissionCode) ?? false
  }

  /**
   * 检查是否拥有指定角色
   * @param roleName 角色代码 (如 'SUPER_ADMIN', 'BUDGET_ADMIN')
   */
  function hasRole(roleName: string): boolean {
    if (!user.value) return false
    return user.value.roles?.some((r) => r.code === roleName) ?? false
  }

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
    hasPermission,
    hasRole,
    login,
    logout,
    refresh,
    fetchUserInfo,
  }
})
