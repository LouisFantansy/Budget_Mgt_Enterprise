import { get, put } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { Notification } from '@/types'

export const notificationApi = {
  getNotifications: (params?: Record<string, any>): Promise<ApiResponse<PaginatedData<Notification>>> => {
    return get('/notifications/', { params })
  },

  getUnreadCount: (): Promise<ApiResponse<number>> => {
    return get('/notifications/unread-count/')
  },

  markAsRead: (id: number): Promise<ApiResponse<void>> => {
    return put(`/notifications/${id}/read/`)
  },

  markAllAsRead: (): Promise<ApiResponse<void>> => {
    return put('/notifications/read-all/')
  },
}

// 兼容旧版导出
export const getNotifications = notificationApi.getNotifications
export const getUnreadCount = notificationApi.getUnreadCount
export const markAsRead = notificationApi.markAsRead
export const markAllAsRead = notificationApi.markAllAsRead
