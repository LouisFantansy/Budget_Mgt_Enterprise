import { get, post, put, del } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { User } from '@/types'

export function login(data: { username: string; password: string }): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
  return post('/auth/login/', data)
}

export function register(data: {
  username: string
  password: string
  realName: string
  email: string
  departmentId?: number
}): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
  return post('/auth/register/', data)
}

export function logout(): Promise<ApiResponse<void>> {
  return post('/auth/logout/')
}

export function refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
  return post('/auth/refresh/', { refreshToken })
}

export function getUserInfo(): Promise<ApiResponse<User>> {
  return get('/auth/me/')
}

export function changePassword(data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<void>> {
  return put('/auth/password/', data)
}

export function updateProfile(data: { realName?: string; email?: string; phone?: string }): Promise<ApiResponse<User>> {
  return put('/auth/profile/', data)
}
