import { useAuthStore } from '@/stores/auth'

/**
 * 检查用户是否拥有指定权限
 */
export function hasPermission(permission: string): boolean {
  const authStore = useAuthStore()
  if (!authStore.user) return false
  if (authStore.user.roles?.some((r) => r.code === 'SUPER_ADMIN')) return true
  return authStore.user.permissions?.some((p) => p === permission) ?? false
}

/**
 * 检查用户是否拥有指定角色
 */
export function hasRole(roleCode: string): boolean {
  const authStore = useAuthStore()
  if (!authStore.user) return false
  return authStore.user.roles?.some((r) => r.code === roleCode) ?? false
}

/**
 * 检查用户是否拥有任一权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(p))
}

/**
 * 检查用户是否拥有所有权限
 */
export function hasAllPermissions(permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(p))
}
