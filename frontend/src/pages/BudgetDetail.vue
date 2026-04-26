<template>
  <div class="page-container">
    <div class="page-header">
      <h2>预算详情</h2>
      <div class="header-actions">
        <el-button v-if="budget?.status === 'DRAFT'" type="primary" @click="handleSubmit">送审</el-button>
        <el-button v-if="budget?.status === 'APPROVED' || budget?.status === 'REJECTED'" type="primary" @click="handleRevise">修订</el-button>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </div>

    <el-card v-if="budget" class="detail-card">
      <template #header>
        <div class="detail-header">
          <span class="budget-no">{{ budget.budgetNo || '未编号' }}</span>
          <el-tag :type="statusType(budget.status)">{{ statusLabel(budget.status) }}</el-tag>
          <el-tag class="version-tag">{{ budget.versionLabel }}</el-tag>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="预算年度">{{ budget.year }}</el-descriptions-item>
        <el-descriptions-item label="预算类别">
          <el-tag>{{ budget.category }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预算来源">{{ sourceLabel(budget.source) }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ budget.department?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预算总额">{{ formatAmount(budget.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="条目数量">{{ budget.items?.length || 0 }}</el-descriptions-item>
        <el-descriptions-item label="编制说明" :span="3">{{ budget.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="section-title">预算条目</div>
      <el-table :data="budget.items" border size="small">
        <el-table-column type="index" width="50" />
        <el-table-column prop="itemNo" label="序号" width="80" />
        <el-table-column label="数据" min-width="300">
          <template #default="{ row }">
            <pre class="json-preview">{{ JSON.stringify(row.fieldData, null, 2) }}</pre>
          </template>
        </el-table-column>
        <el-table-column prop="internalComment" label="内部评论" min-width="150" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { budgetApi } from '@/api/modules/budget'
import type { Budget } from '@/types'

const route = useRoute()
const router = useRouter()
const budget = ref<Budget | null>(null)

async function loadBudget() {
  try {
    const res = await budgetApi.getById(route.params.id as string)
    budget.value = res.data
  } catch (error) {
    ElMessage.error('加载预算详情失败')
  }
}

async function handleSubmit() {
  if (!budget.value) return
  try {
    await budgetApi.submit(budget.value.id)
    ElMessage.success('送审成功')
    loadBudget()
  } catch (error) {
    ElMessage.error('送审失败')
  }
}

async function handleRevise() {
  if (!budget.value) return
  try {
    const res = await budgetApi.revise(budget.value.id)
    ElMessage.success('修订成功，新版本：' + res.data.versionLabel)
    router.push(`/budgets/${res.data.id}`)
  } catch (error) {
    ElMessage.error('修订失败')
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

onMounted(loadBudget)
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
.header-actions {
  display: flex;
  gap: 10px;
}
.detail-card {
  border-radius: 12px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.budget-no {
  font-size: 18px;
  font-weight: 600;
}
.version-tag {
  margin-left: auto;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}
.json-preview {
  margin: 0;
  font-size: 12px;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  max-height: 120px;
  overflow: auto;
}
</style>
