<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
        <span class="page-title">预算详情</span>
        <el-tag :type="getBudgetStatusType(budget?.status) as any" size="small">
          {{ getBudgetStatusLabel(budget?.status) }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button v-if="canEdit" type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>编辑
        </el-button>
        <el-button v-if="canSubmit" type="success" @click="handleSubmit">
          <el-icon><Check /></el-icon>提交审批
        </el-button>
        <el-button v-if="canAdjust" type="warning" @click="handleAdjust">
          <el-icon><ScaleToOriginal /></el-icon>调整
        </el-button>
        <el-button v-if="canDelete" type="danger" @click="handleDelete">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>
    </div>

    <el-skeleton :rows="10" animated v-if="loading" />

    <template v-else-if="budget">
      <!-- 基本信息 -->
      <el-card class="detail-card">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="预算编号">{{ budget.code }}</el-descriptions-item>
          <el-descriptions-item label="预算名称">{{ budget.name }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ budget.department?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预算类型">
            <el-tag :type="budget.type === 'OPEX' ? 'primary' : 'success'" size="small">
              {{ budget.type === 'OPEX' ? '运营支出' : '资本支出' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="年度">{{ budget.year }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getBudgetStatusType(budget.status) as any" size="small">
              {{ getBudgetStatusLabel(budget.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ budget.creator?.realName || budget.creator?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(budget.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(budget.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="付款主体" :span="1">{{ budget.paymentEntity || '-' }}</el-descriptions-item>
          <el-descriptions-item label="组别" :span="1">{{ budget.group || '-' }}</el-descriptions-item>
          <el-descriptions-item label="会计科目" :span="1">{{ budget.accountCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ budget.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 金额概览 -->
      <el-card class="detail-card">
        <template #header>
          <span class="card-title">金额概览</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="amount-box">
              <div class="amount-label">总金额</div>
              <div class="amount-value total">{{ formatMoney(budget.totalAmount) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-box">
              <div class="amount-label">已使用</div>
              <div class="amount-value used">{{ formatMoney(budget.usedAmount || 0) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-box">
              <div class="amount-label">冻结中</div>
              <div class="amount-value frozen">{{ formatMoney(budget.frozenAmount || 0) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-box">
              <div class="amount-label">可用金额</div>
              <div class="amount-value available" :class="getAvailableClass()">
                {{ formatMoney(getAvailableAmount()) }}
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="usage-progress">
          <div class="progress-label">
            <span>预算使用率</span>
            <span>{{ getUsageRate() }}%</span>
          </div>
          <el-progress 
            :percentage="getUsageRate()" 
            :status="getUsageStatus()"
            :stroke-width="16"
          />
        </div>
      </el-card>

      <!-- 预算明细 -->
      <el-card class="detail-card">
        <template #header>
          <span class="card-title">预算明细</span>
        </template>
        <el-table :data="budget.items" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="名称" min-width="150" />
          <el-table-column prop="category" label="费用类别" width="100" />
          <el-table-column prop="specification" label="规格型号" width="120" />
          <el-table-column prop="function" label="功能描述" min-width="150" show-overflow-tooltip />
          <el-table-column label="单价" width="120" align="right">
            <template #default="{ row }">
              {{ formatMoney(row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">
              <strong>{{ formatMoney(row.totalPrice || row.unitPrice * row.quantity) }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="purpose" label="用途" min-width="120" show-overflow-tooltip />
          <el-table-column prop="supplier" label="供应商" width="120" />
          <el-table-column label="交付日期" width="120">
            <template #default="{ row }">
              {{ row.deliveryDate ? formatDate(row.deliveryDate) : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 审批记录 -->
      <el-card class="detail-card" v-if="approvalHistory.length > 0">
        <template #header>
          <span class="card-title">审批记录</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in approvalHistory"
            :key="index"
            :type="getTimelineItemType(record.status) as any"
            :icon="getTimelineItemIcon(record.status)"
            :timestamp="record.createdAt ? formatDateTime(record.createdAt) : '-'"
          >
            <div class="timeline-content">
              <div class="timeline-title">{{ record.stepName }}</div>
              <div class="timeline-info">
                <span>审批人: {{ record.approver?.realName || record.approver?.username || '-' }}</span>
                <el-tag :type="getApprovalStatusType(record.status) as any" size="small">
                  {{ getApprovalStatusLabel(record.status) }}
                </el-tag>
              </div>
              <div v-if="record.comment" class="timeline-comment">
                备注: {{ record.comment }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <el-empty v-else description="预算不存在或已被删除" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Check, Delete, ScaleToOriginal, CircleCheck, CircleClose, Remove } from '@element-plus/icons-vue'
import { budgetApi } from '@/api/modules/budget'
import type { Budget, ApprovalStep } from '@/types'
import { formatMoney, formatDate, formatDateTime } from '@/utils/format'
import { BUDGET_STATUS_MAP } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ===================== 状态 =====================
const loading = ref(false)
const budget = ref<Budget | null>(null)
const approvalHistory = ref<ApprovalStep[]>([])

// ===================== 计算属性 =====================
const budgetId = computed(() => route.params.id as string)

const canEdit = computed(() => {
  if (!budget.value) return false
  return budget.value.status === 'DRAFT' && (isOwner() || authStore.hasRole('SUPER_ADMIN'))
})

const canSubmit = computed(() => {
  if (!budget.value) return false
  return budget.value.status === 'DRAFT' && (isOwner() || authStore.hasRole('SUPER_ADMIN'))
})

const canAdjust = computed(() => {
  if (!budget.value) return false
  return (budget.value.status === 'APPROVED' || budget.value.status === 'ACTIVE') && 
         (authStore.hasRole('SUPER_ADMIN') || authStore.hasRole('BUDGET_ADMIN'))
})

const canDelete = computed(() => {
  if (!budget.value) return false
  return budget.value.status === 'DRAFT' && (isOwner() || authStore.hasRole('SUPER_ADMIN'))
})

// ===================== 方法 =====================

// 获取预算详情
async function fetchBudgetDetail() {
  loading.value = true
  try {
    const res = await budgetApi.getById(budgetId.value)
    budget.value = res.data
    // 模拟审批记录（实际应从后端获取）
    if (budget.value.status !== 'DRAFT') {
      fetchApprovalHistory()
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取预算详情失败')
  } finally {
    loading.value = false
  }
}

// 获取审批历史
async function fetchApprovalHistory() {
  // 这里应该调用审批相关的API
  // 暂时使用模拟数据
  if (budget.value?.status === 'PENDING_APPROVAL') {
    approvalHistory.value = [
      {
        id: 1,
        approvalFlowId: 1,
        stepOrder: 1,
        stepName: '部门经理审批',
        approverType: 'ROLE',
        status: 'PENDING',
        createdAt: budget.value.createdAt,
      } as ApprovalStep,
    ]
  } else if (budget.value?.status === 'APPROVED') {
    approvalHistory.value = [
      {
        id: 1,
        approvalFlowId: 1,
        stepOrder: 1,
        stepName: '部门经理审批',
        approverType: 'ROLE',
        status: 'APPROVED',
        approvedAt: budget.value.updatedAt,
        createdAt: budget.value.createdAt,
      } as ApprovalStep,
      {
        id: 2,
        approvalFlowId: 1,
        stepOrder: 2,
        stepName: '财务审批',
        approverType: 'ROLE',
        status: 'APPROVED',
        approvedAt: budget.value.updatedAt,
        createdAt: budget.value.createdAt,
      } as ApprovalStep,
    ]
  } else if (budget.value?.status === 'REJECTED') {
    approvalHistory.value = [
      {
        id: 1,
        approvalFlowId: 1,
        stepOrder: 1,
        stepName: '部门经理审批',
        approverType: 'ROLE',
        status: 'REJECTED',
        comment: '预算金额超出部门年度限额',
        approvedAt: budget.value.updatedAt,
        createdAt: budget.value.createdAt,
      } as ApprovalStep,
    ]
  }
}

// 获取状态标签
function getBudgetStatusType(status?: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (!status) return 'info'
  return BUDGET_STATUS_MAP[status]?.type || 'info'
}

function getBudgetStatusLabel(status?: string): string {
  if (!status) return '-'
  return BUDGET_STATUS_MAP[status]?.label || status
}

// 获取审批状态标签
function getApprovalStatusType(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const typeMap: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    SKIPPED: 'info',
  }
  return typeMap[status] || 'info'
}

function getApprovalStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    PENDING: '待处理',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    SKIPPED: '已跳过',
  }
  return labelMap[status] || status
}

// 时间线样式
function getTimelineItemType(status: string): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const typeMap: Record<string, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    SKIPPED: 'info',
  }
  return typeMap[status] || ''
}

function getTimelineItemIcon(status: string) {
  const iconMap: Record<string, any> = {
    PENDING: Remove,
    APPROVED: CircleCheck,
    REJECTED: CircleClose,
    SKIPPED: Remove,
  }
  return iconMap[status] || Remove
}

// 计算可用金额
function getAvailableAmount(): number {
  if (!budget.value) return 0
  const total = budget.value.totalAmount || 0
  const used = budget.value.usedAmount || 0
  const frozen = budget.value.frozenAmount || 0
  return total - used - frozen
}

// 获取可用金额样式类
function getAvailableClass(): string {
  const available = getAvailableAmount()
  const total = budget.value?.totalAmount || 1
  const ratio = available / total
  if (ratio < 0.1) return 'danger'
  if (ratio < 0.3) return 'warning'
  return ''
}

// 计算使用率
function getUsageRate(): number {
  if (!budget.value || !budget.value.totalAmount) return 0
  const used = budget.value.usedAmount || 0
  return Math.round((used / budget.value.totalAmount) * 100)
}

// 获取使用率状态
function getUsageStatus(): '' | 'success' | 'warning' | 'exception' {
  const rate = getUsageRate()
  if (rate >= 100) return 'exception'
  if (rate >= 80) return 'warning'
  return 'success'
}

// 检查是否为所有者
function isOwner(): boolean {
  if (!budget.value) return false
  return budget.value.createdBy === authStore.user?.id
}

// 返回列表
function goBack() {
  router.push('/budgets')
}

// 编辑预算
function handleEdit() {
  router.push(`/budgets/${budgetId.value}/edit`)
}

// 提交审批
async function handleSubmit() {
  try {
    await ElMessageBox.confirm(
      `确定要提交预算 "${budget.value?.name}" 进行审批吗？`,
      '确认提交审批',
      { type: 'warning' }
    )
    await budgetApi.submit(budgetId.value)
    ElMessage.success('提交审批成功')
    fetchBudgetDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '提交审批失败')
    }
  }
}

// 调整预算
function handleAdjust() {
  router.push(`/budgets/${budgetId.value}/adjust`)
}

// 删除预算
async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除预算 "${budget.value?.name}" 吗？此操作不可恢复。`,
      '确认删除',
      { type: 'warning' }
    )
    await budgetApi.delete(budgetId.value)
    ElMessage.success('删除成功')
    router.push('/budgets')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchBudgetDetail()
})
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.detail-card {
  margin-bottom: 20px;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.amount-box {
  text-align: center;
  padding: 20px;
  background: #F5F7FA;
  border-radius: 4px;

  .amount-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
  }

  .amount-value {
    font-size: 24px;
    font-weight: 600;
    font-family: 'Courier New', monospace;

    &.total {
      color: #409EFF;
    }

    &.used {
      color: #E6A23C;
    }

    &.frozen {
      color: #909399;
    }

    &.available {
      color: #67C23A;

      &.warning {
        color: #E6A23C;
      }

      &.danger {
        color: #F56C6C;
      }
    }
  }
}

.usage-progress {
  margin-top: 24px;
  padding: 16px;
  background: #F5F7FA;
  border-radius: 4px;

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: #606266;
  }
}

.timeline-content {
  .timeline-title {
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }

  .timeline-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .timeline-comment {
    font-size: 13px;
    color: #909399;
    font-style: italic;
  }
}
</style>
