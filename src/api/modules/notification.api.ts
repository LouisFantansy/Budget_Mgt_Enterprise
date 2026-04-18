import { apiClient } from '../client';
import type { ApiResponse, PaginatedResult, PaginationQuery, Notification, NotificationType } from '../../types';

// 通知查询参数
export interface NotificationListQuery extends PaginationQuery {
  type?: NotificationType;
  isRead?: boolean;
}

// 未读数量响应
export interface UnreadCountData {
  count: number;
  byType: Record<string, number>;
}

// API 响应类型
export type NotificationApiResponse = ApiResponse<Notification>;
export type NotificationListApiResponse = ApiResponse<PaginatedResult<Notification>>;
export type UnreadCountApiResponse = ApiResponse<UnreadCountData>;

/**
 * 通知 API
 */
export const notificationApi = {
  /**
   * 获取通知列表
   */
  getList: (params?: NotificationListQuery): Promise<NotificationListApiResponse> => {
    return apiClient.get('/notifications/', { params });
  },

  /**
   * 标记为已读
   */
  markAsRead: (id: string): Promise<NotificationApiResponse> => {
    return apiClient.put(`/notifications/${id}/read`);
  },

  /**
   * 全部标记为已读
   */
  markAllAsRead: (): Promise<ApiResponse<null>> => {
    return apiClient.put('/notifications/read-all/');
  },

  /**
   * 获取未读数量
   */
  getUnreadCount: (): Promise<UnreadCountApiResponse> => {
    return apiClient.get('/notifications/unread-count/');
  },
};
