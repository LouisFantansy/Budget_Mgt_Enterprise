import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '../types';

interface NotificationState {
  // 状态
  unreadCount: number;
  notifications: Notification[];
  
  // 操作
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      // 初始状态
      unreadCount: 0,
      notifications: [],

      // 设置未读数量
      setUnreadCount: (count) => set({ unreadCount: count }),

      // 增加未读数量
      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

      // 减少未读数量
      decrementUnread: () => set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),

      // 添加新通知
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 100), // 保留最近100条
        unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
      })),

      // 设置通知列表
      setNotifications: (notifications) => set({ notifications }),

      // 标记为已读
      markAsRead: (id) => set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        if (notification && !notification.isRead) {
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }
        return state;
      }),

      // 清空通知
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        unreadCount: state.unreadCount,
      }),
    }
  )
);
