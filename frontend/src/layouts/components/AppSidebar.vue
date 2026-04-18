<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapsed"
    :collapse-transition="false"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
    router
  >
    <!-- 仪表盘 -->
    <el-menu-item index="/">
      <el-icon><Odometer /></el-icon>
      <template #title>仪表盘</template>
    </el-menu-item>

    <!-- 预算管理 -->
    <el-sub-menu index="budget">
      <template #title>
        <el-icon><Wallet /></el-icon>
        <span>预算管理</span>
      </template>
      <el-menu-item index="/budgets">预算列表</el-menu-item>
      <el-menu-item index="/budgets/create">创建预算</el-menu-item>
      <el-menu-item index="/budgets/create-advanced">高级创建</el-menu-item>
      <el-menu-item index="/budgets/summary">预算汇总</el-menu-item>
      <el-menu-item index="/budgets/usage">使用追踪</el-menu-item>
    </el-sub-menu>

    <!-- 采购管理 -->
    <el-sub-menu index="purchase">
      <template #title>
        <el-icon><ShoppingCart /></el-icon>
        <span>采购管理</span>
      </template>
      <el-menu-item index="/purchase">采购申请列表</el-menu-item>
      <el-menu-item index="/purchase/create">创建采购申请</el-menu-item>
    </el-sub-menu>

    <!-- 数据导入 -->
    <el-sub-menu index="import">
      <template #title>
        <el-icon><Upload /></el-icon>
        <span>数据导入</span>
      </template>
      <el-menu-item index="/import/purchase">采购订单导入</el-menu-item>
      <el-menu-item index="/import/settlement">结算单导入</el-menu-item>
      <el-menu-item index="/mapping">三单匹配</el-menu-item>
    </el-sub-menu>

    <!-- 审批中心 -->
    <el-menu-item index="/approval">
      <el-icon><Stamp /></el-icon>
      <template #title>审批中心</template>
    </el-menu-item>

    <!-- 报表分析 -->
    <el-menu-item index="/analysis">
      <el-icon><DataAnalysis /></el-icon>
      <template #title>报表分析</template>
    </el-menu-item>

    <!-- 系统管理 -->
    <el-sub-menu index="system">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>系统管理</span>
      </template>
      <el-menu-item index="/departments">部门管理</el-menu-item>
      <el-menu-item index="/users">用户管理</el-menu-item>
      <el-menu-item index="/roles">角色管理</el-menu-item>
      <el-menu-item index="/audit-logs">审计日志</el-menu-item>
      <el-menu-item index="/settings">系统设置</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Odometer,
  Wallet,
  ShoppingCart,
  Upload,
  Stamp,
  DataAnalysis,
  Setting,
} from '@element-plus/icons-vue'

defineProps<{
  collapsed: boolean
}>()

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped lang="scss">
.el-menu {
  border-right: none;
  height: 100%;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
}
</style>
