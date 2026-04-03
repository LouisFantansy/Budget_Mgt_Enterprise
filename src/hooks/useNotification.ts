import { useState, useCallback, useEffect } from 'react';
import { notificationApi } from '../api/modules/notification.api';
import type { NotificationListQuery } from '../api/modules/notification.api';
import type { Notification, PaginatedResult } from '../types';
import { useNotificationStore } from '../store/notificationStore';

interface UseNotificationState {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

interface UseNotificationReturn extends UseNotificationState {
  fetchNotifications: (params?: NotificationListQuery) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<number>;
  clearError: () => void;
  reset: () => void;
}

const initialState: UseNotificationState = {
  notifications: [],
  pagination: null,
  loading: false,
  error: null,
};

/**
 * 通知管理 Hook
 */
export const useNotification = (): UseNotificationReturn => {
  const [state, setState] = useState<UseNotificationState>(initialState);
  const { unreadCount, setUnreadCount, decrementUnread } = useNotificationStore();

  /**
   * 获取通知列表
   */
  const fetchNotifications = useCallback(async (params?: NotificationListQuery) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await notificationApi.getList(params);
      const result: PaginatedResult<Notification> = response.data;
      setState((prev) => ({
        ...prev,
        notifications: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '获取通知列表失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 标记为已读
   */
  const markAsRead = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await notificationApi.markAsRead(id);
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        loading: false,
      }));
      decrementUnread();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '标记已读失败',
      }));
      throw error;
    }
  }, [decrementUnread]);

  /**
   * 全部标记为已读
   */
  const markAllAsRead = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await notificationApi.markAllAsRead();
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        loading: false,
      }));
      setUnreadCount(0);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '全部标记已读失败',
      }));
      throw error;
    }
  }, [setUnreadCount]);

  /**
   * 获取未读数量
   */
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const response = await notificationApi.getUnreadCount();
      const count = response.data.count;
      setUnreadCount(count);
      return count;
    } catch (error: any) {
      console.error('获取未读数量失败:', error);
      throw error;
    }
  }, [setUnreadCount]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // 初始化时获取未读数量
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchUnreadCount,
    clearError,
    reset,
  };
};
