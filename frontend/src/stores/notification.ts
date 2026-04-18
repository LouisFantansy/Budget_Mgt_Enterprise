import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification } from '@/types'
import * as notificationApi from '@/api/modules/notification'

export const useNotificationStore = defineStore('notification', () => {
  // ===================== State =====================
  const notifications = ref<Notification[]>([])
  const unreadCount = ref<number>(0)

  // ===================== Getters =====================
  const hasUnread = computed(() => unreadCount.value > 0)

  // ===================== Actions =====================
  async function fetchNotifications(params?: Record<string, any>) {
    const res = await notificationApi.getNotifications(params)
    notifications.value = res.data.items
  }

  async function fetchUnreadCount() {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.data
  }

  async function markAsRead(id: number) {
    await notificationApi.markAsRead(id)
    const notification = notifications.value.find((n) => n.id === id)
    if (notification && !notification.isRead) {
      notification.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllAsRead() {
    await notificationApi.markAllAsRead()
    notifications.value.forEach((n) => {
      n.isRead = true
    })
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }
})
