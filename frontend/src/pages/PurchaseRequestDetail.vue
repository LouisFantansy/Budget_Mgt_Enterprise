<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>采购申请详情</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <template v-if="detail">
      <!-- 基本信息 -->
      <el-card header="基本信息" shadow="never" style="margin-bottom: 20px">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="申请编号">{{ detail.code }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ detail.creator?.realName || detail.creator?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ detail.department?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联预算">{{ detail.budget?.code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detail.status) as any" size="small">{{ getStatusLabel(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag :type="getUrgencyType(detail.urgency || '') as any" size="small">{{ getUrgencyLabel(detail.urgency || '') }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatMoney(detail.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="用途说明" :span="3">{{ detail.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 采购明细 -->
      <el-card header="采购明细" shadow="never" style="margin-bottom: 20px">
        <el-table :data="detail.items" border>
          <el-table-column prop="name" label="物品名称" min-width="150" />
          <el-table-column prop="specification" label="规格型号" min-width="120" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="单价" width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.totalPrice) }}</template>
          </el-table-column>
          <el-table-column prop="category" label="分类" min-width="100" />
        </el-table>
        <div class="total-row">
          合计：<span class="total-amount">{{ formatMoney(detail.totalAmount) }}</span>
        </div>
      </el-card>

      <!-- 审批记录 -->
      <el-card header="审批记录" shadow="never" style="margin-bottom: 20px">
        <el-timeline v-if="approvalSteps.length > 0">
          <el-timeline-item
            v-for="step in approvalSteps"
            :key="step.id"
            :type="getStepTimelineType(step.status) as any"
            :timestamp="step.approvedAt ? formatDateTime(step.approvedAt) : ''"
            placement="top"
          >
            <p style="margin: 0; font-weight: 500">{{ step.stepName }}</p>
            <p style="margin: 4px 0 0; color: var(--el-text-color-secondary)">
              审批人：{{ step.approver?.realName || step.approver?.username || '待指定' }} |
              状态：<el-tag :type="getStepStatusType(step.status) as any" size="small">{{ getStepStatusLabel(step.status) }}</el-tag>
            </p>
            <p v-if="step.comment" style="margin: 4px 0 0; color: var(--el-text-color-regular)">
              意见：{{ step.comment }}
            </p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审批记录" />
      </el-card>

      <!-- 操作按钮 -->
      <div class="form-footer" v-if="showActions">
        <el-button v-if="detail.status === 'DRAFT'" type="primary" @click="router.push(`/purchase/create?editId=${detail.id}`)">编辑</el-button>
        <el-button v-if="detail.status === 'DRAFT'" type="success" @click="handleSubmit">提交审批</el-button>
        <el-button v-if="canCancel" type="warning" @click="handleCancel">取消申请</el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { purchaseApi } from '@/api/modules/purchase'
import type { PurchaseRequest, ApprovalStep } from '@/types'
import { formatDateTime, formatMoney } from '@/utils/format'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const detail = ref<PurchaseRequest | null>(null)
const approvalSteps = ref<ApprovalStep[]>([])

const showActions = computed(() => {
  if (!detail.value) return false
  return ['DRAFT', 'PENDING_APPROVAL', 'IN_APPROVAL'].includes(detail.value.status)
})

const canCancel = computed(() => {
  if (!detail.value) return false
  return ['PENDING_APPROVAL', 'IN_APPROVAL'].includes(detail.value.status)
})

async function fetchDetail() {
  loading.value = true
  try {
    const id = route.params.id
    const res = await purchaseApi.getById(id as string)
    detail.value = res.data
    approvalSteps.value = res.data.currentApprovalStep
      ? [res.data.currentApprovalStep]
      : (res.data.approvalSteps || [])
  } catch (error: any) {
    ElMessage.error(error?.message || '获取详情失败')
  } finally {
    loading.value = false
  }
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'info', PENDING_APPROVAL: 'warning', IN_APPROVAL: 'warning',
    APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'info',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿', PENDING_APPROVAL: '待审批', IN_APPROVAL: '审批中',
    APPROVED: '已审批', REJECTED: '已驳回', CANCELLED: '已取消',
  }
  return map[status] || status
}

function getUrgencyType(urgency: string) {
  const map: Record<string, string> = { LOW: 'info', NORMAL: '', HIGH: 'warning', URGENT: 'danger' }
  return map[urgency] || 'info'
}

function getUrgencyLabel(urgency: string) {
  const map: Record<string, string> = { LOW: '低', NORMAL: '普通', HIGH: '高', URGENT: '紧急' }
  return map[urgency] || urgency
}

function getStepTimelineType(status: string) {
  const map: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', SKIPPED: 'info' }
  return map[status] || 'info'
}

function getStepStatusType(status: string) {
  const map: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', SKIPPED: 'info' }
  return map[status] || 'info'
}

function getStepStatusLabel(status: string) {
  const map: Record<string, string> = { PENDING: '待处理', APPROVED: '已通过', REJECTED: '已驳回', SKIPPED: '已跳过' }
  return map[status] || status
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm('确定要提交此采购申请进行审批吗？', '确认提交', { type: 'warning' })
    await purchaseApi.submit(detail.value!.id)
    ElMessage.success('提交成功')
    fetchDetail()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '提交失败')
  }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定要取消此采购申请吗？', '确认取消', { type: 'warning' })
    await purchaseApi.cancel(detail.value!.id)
    ElMessage.success('取消成功')
    fetchDetail()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '取消失败')
  }
}

onMounted(() => {
  fetchDetail()
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

  h2 {
    margin: 0;
    font-size: 18px;
  }
}

.total-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;

  .total-amount {
    color: var(--el-color-danger);
    margin-left: 8px;
  }
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
