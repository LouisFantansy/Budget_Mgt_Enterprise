import { get, post, put, del } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { User } from '@/types'

export function getUserList(params?: Record<string, any>): Promise<ApiResponse<PaginatedData<User>>> {
  return get('/users/', { params })
}

export function getUserById(id: number): Promise<ApiResponse<User>> {
  return get(`/users/${id}/`)
}

export function createUser(data: Record<string, any>): Promise<ApiResponse<User>> {
  return post('/users/', data)
}

export function updateUser(id: number, data: Partial<User> & Record<string, any>): Promise<ApiResponse<User>> {
  return put(`/users/${id}/`, data)
}

export function deleteUser(id: number): Promise<ApiResponse<void>> {
  return del(`/users/${id}/`)
}

export function resetPassword(id: number, newPassword: string): Promise<ApiResponse<{ password: string }>> {
  return post(`/users/${id}/reset-password/`, { newPassword })
}

export function assignRoles(id: number, roleIds: number[]): Promise<ApiResponse<void>> {
  return post(`/users/${id}/roles/`, { roleIds })
}
