import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * 权限检查 composable
 */
export function usePermission() {
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.user)

  function hasPermission(permission: string): boolean {
    if (!authStore.user) return false
    if (authStore.user.roles?.some((r) => r.code === 'SUPER_ADMIN')) return true
    return authStore.user.permissions?.some((p) => p === permission) ?? false
  }

  function hasRole(roleCode: string): boolean {
    if (!authStore.user) return false
    return authStore.user.roles?.some((r) => r.code === roleCode) ?? false
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => hasPermission(p))
  }

  return {
    isAuthenticated,
    currentUser,
    hasPermission,
    hasRole,
    hasAnyPermission,
  }
}
