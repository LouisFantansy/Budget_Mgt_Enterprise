import { get, post, put, del } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { Department } from '@/types'

export function getDepartmentList(params?: Record<string, any>): Promise<ApiResponse<PaginatedData<Department>>> {
  return get('/departments/', { params })
}

export function getDepartmentTree(): Promise<ApiResponse<Department[]>> {
  return get('/departments/tree/')
}

export function getDepartmentById(id: number): Promise<ApiResponse<Department>> {
  return get(`/departments/${id}/`)
}

export function createDepartment(data: Partial<Department> & Record<string, any>): Promise<ApiResponse<Department>> {
  return post('/departments/', data)
}

export function updateDepartment(id: number, data: Partial<Department> & Record<string, any>): Promise<ApiResponse<Department>> {
  return put(`/departments/${id}/`, data)
}

export function deleteDepartment(id: number): Promise<ApiResponse<void>> {
  return del(`/departments/${id}/`)
}
