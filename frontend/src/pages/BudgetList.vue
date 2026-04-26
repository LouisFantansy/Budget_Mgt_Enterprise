<template>
  <div class="page-container">
    <div class="page-header">
      <h2>预算列表</h2>
      <el-button type="primary" @click="$router.push('/budgets/create')">
        <el-icon><Plus /></el-icon>创建预算
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="年度">
          <el-select v-model="filterForm.year" placeholder="选择年度" clearable>
            <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="filterForm.category" placeholder="选择类别" clearable>
            <el-option label="OPEX" value="OPEX" />
            <el-option label="CAPEX" value="CAPEX" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filterForm.source" placeholder="选择来源" clearable>
            <el-option label="自编" value="SELF_COMPILED" />
            <el-option label="集团分摊" value="GROUP_ALLOCATION" />
            <el-option label="SS Public" value="SS_PUBLIC" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
            <el-option label="草稿" value="DRAFT" />
            <el-option label="待审批" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadBudgets">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="budgets" v-loading="loading" stripe>
        <el-table-column prop="budgetNo" label="预算编号" min-width="140" />
        <el-table-column prop="departmentName" label="部门" width="140" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120">
          <template #default="{ row }">
            <el-tag :type="sourceType(row.source)">{{ sourceLabel(row.source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="versionLabel" label="版本" width="100" />
        <el-table-column prop="totalAmount" label="总额" width="140">
          <template #default="{ row }">
            {{ formatAmount(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'DRAFT'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'DRAFT'" link type="success" @click="handleSubmit(row)">送审</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { budgetApi } from '@/api/modules/budget'
import type { Budget } from '@/types'

const router = useRouter()
const loading = ref(false)
const budgets = ref<Budget[]>([])

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

const filterForm = ref({
  year: currentYear,
  category: '',
  source: '',
  status: ''
})

async function loadBudgets() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (filterForm.value.year) params.year = filterForm.value.year
    if (filterForm.value.category) params.category = filterForm.value.category
    if (filterForm.value.source) params.source = filterForm.value.source
    if (filterForm.value.status) params.status = filterForm.value.status
    const res = await budgetApi.getList(params)
    const inner = (res as any).data?.data || (res as any).data
    budgets.value = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
  } catch (error) {
    ElMessage.error('加载预算列表失败')
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.value = { year: currentYear, category: '', source: '', status: '' }
  loadBudgets()
}

function handleView(row: Budget) {
  router.push(`/budgets/${row.id}`)
}

function handleEdit(row: Budget) {
  router.push(`/budgets/${row.id}/edit`)
}

async function handleSubmit(row: Budget) {
  try {
    await budgetApi.submit(row.id)
    ElMessage.success('送审成功')
    loadBudgets()
  } catch (error) {
    ElMessage.error('送审失败')
  }
}

function statusType(status: string): 'info' | 'warning' | 'success' | 'danger' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    DRAFT: 'info',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已驳回'
  }
  return map[status] || status
}

function sourceType(source: string): 'success' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'info'> = {
    SELF_COMPILED: 'success',
    GROUP_ALLOCATION: 'warning',
    SS_PUBLIC: 'info'
  }
  return map[source] || 'info'
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    SELF_COMPILED: '自编',
    GROUP_ALLOCATION: '集团分摊',
    SS_PUBLIC: 'SS Public'
  }
  return map[source] || source
}

function formatAmount(val: number) {
  if (!val) return '-'
  return '¥' + Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(loadBudgets)
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
}
.table-card {
  border-radius: 12px;
}
</style>
