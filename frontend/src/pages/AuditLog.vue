<template>
  <div class="page-container">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="filters.operator"
        placeholder="操作人"
        clearable
        style="width: 150px"
      />
      <el-select v-model="filters.module" placeholder="模块" clearable style="width: 140px">
        <el-option label="预算管理" value="budget" />
        <el-option label="审批管理" value="approval" />
        <el-option label="报表分析" value="report" />
        <el-option label="系统管理" value="system" />
        <el-option label="认证" value="auth" />
      </el-select>
      <el-select v-model="filters.action" placeholder="操作类型" clearable style="width: 140px">
        <el-option label="创建" value="create" />
        <el-option label="更新" value="update" />
        <el-option label="删除" value="delete" />
        <el-option label="登录" value="login" />
        <el-option label="登出" value="logout" />
        <el-option label="审批" value="approve" />
        <el-option label="驳回" value="reject" />
        <el-option label="导出" value="export" />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
      />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>搜索
      </el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>导出
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="auditLogs"
      border
      stripe
      style="margin-top: 16px"
      row-key="id"
    >
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-content" v-if="row.detail || row.beforeValue || row.afterValue">
            <div v-if="row.detail" class="detail-item">
              <span class="detail-label">操作详情：</span>
              <span>{{ row.detail }}</span>
            </div>
            <div v-if="row.beforeValue" class="detail-item">
              <span class="detail-label">修改前：</span>
              <pre class="json-display">{{ formatJson(row.beforeValue) }}</pre>
            </div>
            <div v-if="row.afterValue" class="detail-item">
              <span class="detail-label">修改后：</span>
              <pre class="json-display">{{ formatJson(row.afterValue) }}</pre>
            </div>
          </div>
          <div v-else class="expand-content">
            <span style="color: #999">无详细信息</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作人" min-width="120">
        <template #default="{ row }">
          {{ row.user?.realName || row.user?.username || `用户#${row.userId}` }}
        </template>
      </el-table-column>
      <el-table-column label="模块" min-width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ getModuleLabel(row.resource) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作类型" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action) as any" size="small">
            {{ getActionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resourceType" label="对象类型" min-width="120" />
      <el-table-column prop="resourceId" label="对象ID" min-width="100" />
      <el-table-column prop="ip" label="IP地址" min-width="140" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import * as auditApi from '@/api/modules/audit'
import { download } from '@/api/client'
import type { AuditLog } from '@/types'
import { formatDateTime } from '@/utils/format'
import dayjs from 'dayjs'

// ===================== 扩展 AuditLog 类型 =====================
interface AuditLogItem extends AuditLog {
  resourceType?: string
  beforeValue?: string
  afterValue?: string
}

// ===================== 状态 =====================
const loading = ref(false)
const auditLogs = ref<AuditLogItem[]>([])

// 筛选
const filters = reactive({
  operator: '',
  module: '',
  action: '',
  dateRange: null as [string, string] | null,
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// ===================== 方法 =====================

async function fetchAuditLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filters.operator) params.operator = filters.operator
    if (filters.module) params.module = filters.module
    if (filters.action) params.action = filters.action
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }

    const res = await auditApi.getAuditLogs(params)
    auditLogs.value = res.data.items
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || '获取审计日志失败')
  } finally {
    loading.value = false
  }
}

// 模块标签
function getModuleLabel(resource: string) {
  const map: Record<string, string> = {
    budget: '预算管理',
    approval: '审批管理',
    report: '报表分析',
    system: '系统管理',
    auth: '认证',
    user: '用户管理',
    department: '部门管理',
    role: '角色管理',
  }
  return map[resource] || resource
}

// 操作类型标签
function getActionLabel(action: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    login: '登录',
    logout: '登出',
    approve: '审批',
    reject: '驳回',
    export: '导出',
    import: '导入',
  }
  return map[action] || action
}

function getActionType(action: string) {
  const map: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    login: '',
    logout: 'info',
    approve: 'success',
    reject: 'danger',
    export: '',
    import: '',
  }
  return map[action] || 'info'
}

// 格式化 JSON
function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchAuditLogs()
}

// 重置
function handleReset() {
  filters.operator = ''
  filters.module = ''
  filters.action = ''
  filters.dateRange = null
  pagination.page = 1
  fetchAuditLogs()
}

// 分页
function handleSizeChange(size: number) {
  pagination.pageSize = size
  fetchAuditLogs()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchAuditLogs()
}

// 导出
async function handleExport() {
  try {
    const params: Record<string, any> = {}
    if (filters.operator) params.operator = filters.operator
    if (filters.module) params.module = filters.module
    if (filters.action) params.action = filters.action
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }

    const filename = `审计日志_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    await download('/audit-logs/export', filename, { params })
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '导出失败')
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchAuditLogs()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.expand-content {
  padding: 12px 20px;

  .detail-item {
    margin-bottom: 8px;

    .detail-label {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-right: 8px;
    }
  }

  .json-display {
    background: #f5f7fa;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }
}
</style>
