<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="sidebar-container">
      <AppSidebar :collapsed="sidebarCollapsed" />
      <div class="collapse-btn" @click="toggleSidebar">
        <el-icon :size="16">
          <DArrowLeft v-if="!sidebarCollapsed" />
          <DArrowRight v-else />
        </el-icon>
      </div>
    </el-aside>

    <!-- 右侧区域 -->
    <el-container class="main-container">
      <!-- 头部 -->
      <el-header class="header-container" height="60px">
        <AppHeader />
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'

const sidebarCollapsed = ref(false)

const sidebarWidth = computed(() =>
  sidebarCollapsed.value ? '64px' : '220px'
)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar-container {
  background-color: #304156;
  transition: width var(--transition-duration);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  :deep(.el-menu) {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.collapse-btn {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #bfcbd9;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

.main-container {
  overflow: hidden;
}

.header-container {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-sm);
  padding: 0;
}

.main-content {
  background: var(--color-bg-page);
  overflow-y: auto;
  padding: 0;
}
</style>
