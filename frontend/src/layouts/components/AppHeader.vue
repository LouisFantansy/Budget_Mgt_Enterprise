<template>
  <div class="app-header">
    <div class="header-left">
      <div class="logo-area" @click="router.push('/')">
        <img src="@/assets/logo.svg" alt="Logo" class="logo-icon" />
        <span class="system-title">企业级预算管理系统</span>
      </div>
    </div>

    <div class="header-right">
      <!-- 通知铃铛 -->
      <el-popover
        placement="bottom-end"
        :width="360"
        trigger="click"
        @show="handlePopoverShow"
      >
        <template #reference>
          <el-badge :value="notificationStore.unreadCount" :hidden="!notificationStore.hasUnread" :max="99" class="notification-badge">
            <el-icon class="header-icon"><Bell /></el-icon>
          </el-badge>
        </template>

        <div class="notification-panel">
          <div class="notification-header">
            <span class="notification-title">通知</span>
            <el-button v-if="notificationStore.hasUnread" type="primary" link size="small" @click="handleMarkAllRead">
              全部已读
            </el-button>
          </div>

          <div class="notification-list" v-if="notificationStore.notifications.length > 0">
            <div
              v-for="item in notificationStore.notifications.slice(0, 10)"
              :key="item.id"
              class="notification-item"
              :class="{ unread: !item.isRead }"
              @click="handleNotificationClick(item)"
            >
              <div class="notification-item-content">
                <div class="notification-item-title">{{ item.title }}</div>
                <div class="notification-item-text">{{ item.content }}</div>
                <div class="notification-item-time">{{ formatDateTimeShort(item.createdAt) }}</div>
              </div>
              <div v-if="!item.isRead" class="notification-dot" />
            </div>
          </div>
          <el-empty v-else description="暂无通知" :image-size="60" />

          <div class="notification-footer" v-if="notificationStore.notifications.length > 0">
            <el-button type="primary" link @click="router.push('/approval'); notificationPopoverVisible = false">查看全部</el-button>
          </div>
        </div>
      </el-popover>

      <!-- 用户下拉菜单 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="authStore.user?.avatar" icon="UserFilled" />
          <span class="username">{{ authStore.user?.realName || authStore.user?.username || '用户' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人信息</el-dropdown-item>
            <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, ArrowDown, UserFilled } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { formatDateTimeShort } from '@/utils/format'
import type { Notification } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const notificationPopoverVisible = ref(false)

let pollingTimer: ReturnType<typeof setInterval> | null = null

async function handlePopoverShow() {
  try {
    await notificationStore.fetchNotifications({ pageSize: 10 })
  } catch {
    // 静默处理
  }
}

async function handleNotificationClick(item: Notification) {
  if (!item.isRead) {
    try {
      await notificationStore.markAsRead(item.id)
    } catch {
      // 静默处理
    }
  }
  // 根据通知类型跳转
  if (item.type === 'APPROVAL') {
    router.push('/approval')
  }
}

async function handleMarkAllRead() {
  try {
    await notificationStore.markAllAsRead()
    ElMessage.success('已全部标记为已读')
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'changePassword':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await authStore.logout()
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

// 轮询获取未读数量
function startPolling() {
  notificationStore.fetchUnreadCount()
  pollingTimer = setInterval(() => {
    notificationStore.fetchUnreadCount()
  }, 60000) // 每60秒轮询一次
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-area {
  display: flex;
  align-items: center;
  cursor: pointer;

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .system-title {
    margin-left: 10px;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-regular);

  &:hover {
    color: var(--color-primary);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);

  &:hover {
    background-color: var(--color-bg-page);
  }

  .username {
    font-size: 14px;
    color: var(--color-text-primary);
  }
}

.notification-panel {
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .notification-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .notification-list {
    max-height: 400px;
    overflow-y: auto;

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 4px;
      border-bottom: 1px solid var(--el-border-color-extra-light);
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      &.unread {
        background-color: var(--el-color-primary-light-9);
      }

      .notification-item-content {
        flex: 1;
        min-width: 0;

        .notification-item-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }

        .notification-item-text {
          font-size: 13px;
          color: var(--el-text-color-regular);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .notification-item-time {
          font-size: 12px;
          color: var(--el-text-color-placeholder);
        }
      }

      .notification-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--el-color-primary);
        margin-top: 6px;
        margin-left: 8px;
        flex-shrink: 0;
      }
    }
  }

  .notification-footer {
    text-align: center;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
