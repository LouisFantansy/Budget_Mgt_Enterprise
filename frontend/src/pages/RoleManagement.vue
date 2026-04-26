<template>
  <div class="page-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="filteredRoleList" border stripe style="margin-top: 16px">
      <el-table-column prop="code" label="角色编码" min-width="200">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="角色名称" min-width="180">
        <template #default="{ row }">
          {{ (ROLE_LABELS as Record<string, string>)[row.code] || row.name }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
      <el-table-column label="系统内置" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isSystem ? 'danger' : 'info'" size="small">
            {{ row.isSystem ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户数量" width="100">
        <template #default="{ row }">
          {{ row.userCount || 0 }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 角色说明卡片 -->
    <el-row :gutter="16" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>角色权限说明</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="role in roleList" :key="role.id" :label="(ROLE_LABELS as Record<string, string>)[role.code] || role.name">
              {{ role.description || getDefaultDescription(role.code) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { get } from '@/api/client'
import type { Role } from '@/types'
import { ROLE_LABELS } from '@/utils/constants'

// ===================== 状态 =====================
const loading = ref(false)
const roleList = ref<Role[]>([])
const searchQuery = ref('')

// 搜索过滤
const filteredRoleList = computed(() => {
  if (!searchQuery.value) return roleList.value
  const query = searchQuery.value.toLowerCase()
  return roleList.value.filter(
    r => r.code.toLowerCase().includes(query) ||
         r.name.toLowerCase().includes(query) ||
         ((ROLE_LABELS as Record<string, string>)[r.code] || '').includes(query)
  )
})

function getDefaultDescription(code: string): string {
  const map: Record<string, string> = {
    FIRST_BUDGET_ADMIN: '负责一级部门预算模板配置、跨部门预算修改留痕、全局预算审批',
    FIRST_BUDGET_HOST: '协助一级部门预算管理员处理预算编制工作',
    FIRST_DEPT_HEAD: '审批一级部门及下属二级部门的预算申请',
    SECOND_BUDGET_ADMIN_PRIMARY: '负责二级部门预算编制、提交审批',
    SECOND_BUDGET_ADMIN_SECONDARY: '协助主二级部门预算管理员处理预算编制',
    SECOND_DEPT_HEAD: '审批本二级部门预算申请',
    ENGINEER: '查看本部门预算、提交采购申请（未来扩展）',
    ADMIN: '系统管理、用户管理、角色权限配置',
  }
  return map[code] || ''
}

// ===================== 方法 =====================
async function fetchRoleList() {
  loading.value = true
  try {
    const res = await get<Role[]>('/roles/')
    roleList.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取角色列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 前端过滤，无需请求
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchRoleList()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .toolbar-left {
    display: flex;
    gap: 12px;
  }
}
</style>
