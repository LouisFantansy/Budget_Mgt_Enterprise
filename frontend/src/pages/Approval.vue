<template>
  <div class="page-container">
    <div class="page-header">
      <h2>审批中心</h2>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange as any">
      <!-- 待我审批 -->
      <el-tab-pane label="待我审批" name="pending">
        <el-table v-loading="pendingLoading" :data="pendingList" border stripe>
          <el-table-column label="目标类型" width="100">
            <template #default="{ row }">
              <el-tag :type="(row.targetType === 'BUDGET' ? 'primary' : 'success') as any" size="small">
                {{ row.targetType === 'BUDGET' ? '预算' : '采购' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetCode" label="编号" min-width="140" />
          <el-table-column prop="targetName" label="名称/用途" min-width="180" show-overflow-tooltip />
          <el-table-column label="金额" min-width="130" align="right">
            <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="currentStepName" label="当前步骤" width="120" />
          <el-table-column label="发起时间" min-width="160">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="success" link size="small" @click="handleApprove(row)">审批</el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pendingPagination.page"
            v-model:page-size="pendingPagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pendingPagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchPendingList"
            @current-change="fetchPendingList"
          />
        </div>
      </el-tab-pane>

      <!-- 我发起的 -->
      <el-tab-pane label="我发起的" name="initiated">
        <el-table v-loading="initiatedLoading" :data="initiatedList" border stripe>
          <el-table-column label="目标类型" width="100">
            <template #default="{ row }">
              <el-tag :type="(row.targetType === 'BUDGET' ? 'primary' : 'success') as any" size="small">
                {{ row.targetType === 'BUDGET' ? '预算' : '采购' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetCode" label="编号" min-width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getApprovalStatusType(row.status) as any" size="small">
                {{ getApprovalStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="currentStepName" label="当前步骤" width="120" />
          <el-table-column label="发起时间" min-width="160">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'IN_PROGRESS'" type="warning" link size="small" @click="handleWithdraw(row)">撤回</el-button>
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="initiatedPagination.page"
            v-model:page-size="initiatedPagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="initiatedPagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchInitiatedList"
            @current-change="fetchInitiatedList"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approvalDialogVisible" :title="approvalAction === 'approve' ? '审批通过' : '驳回审批'" width="600px" destroy-on-close>
      <!-- 审批对象详情 -->
      <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
        <el-descriptions-item label="类型">{{ currentApproval?.targetType === 'BUDGET' ? '预算' : '采购' }}</el-descriptions-item>
        <el-descriptions-item label="编号">{{ currentApproval?.targetCode }}</el-descriptions-item>
        <el-descriptions-item label="名称" :span="2">{{ currentApproval?.targetName }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ currentApproval ? formatMoney(currentApproval.amount) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前步骤">{{ currentApproval?.currentStepName }}</el-descriptions-item>
      </el-descriptions>

      <el-form ref="approvalFormRef" :model="approvalForm" :rules="approvalFormRules" label-width="80px">
        <el-form-item label="审批意见" prop="comment">
          <el-input v-model="approvalForm.comment" type="textarea" :rows="3" :placeholder="approvalAction === 'reject' ? '请输入驳回原因（必填）' : '请输入审批意见（选填）'" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button v-if="approvalAction === 'approve'" type="success" :loading="approvalLoading" @click="submitApproval">通过</el-button>
        <el-button v-else type="danger" :loading="approvalLoading" @click="submitApproval">驳回</el-button>
      </template>
    </el-dialog>

    <!-- 审批详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="审批详情" width="600px" destroy-on-close>
      <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
        <el-descriptions-item label="类型">{{ detailData?.targetType === 'BUDGET' ? '预算' : '采购' }}</el-descriptions-item>
        <el-descriptions-item label="编号">{{ detailData?.targetCode }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getApprovalStatusType(detailData?.status) as any" size="small">
            {{ getApprovalStatusLabel(detailData?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="金额">{{ detailData ? formatMoney(detailData.amount) : '-' }}</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin: 16px 0 8px">审批流程</h4>
      <el-timeline>
        <el-timeline-item
          v-for="step in detailData?.steps || []"
          :key="step.id"
          :type="getStepTimelineType(step.status) as any"
          :timestamp="step.approvedAt ? formatDateTime(step.approvedAt) : ''"
          placement="top"
        >
          <p style="margin: 0; font-weight: 500">{{ step.stepName }}</p>
          <p style="margin: 4px 0 0; color: var(--el-text-color-secondary)">
            {{ step.approver?.realName || '待指定' }} |
            <el-tag :type="getStepStatusType(step.status) as any" size="small">{{ getStepStatusLabel(step.status) }}</el-tag>
          </p>
          <p v-if="step.comment" style="margin: 4px 0 0; color: var(--el-text-color-regular)">
            意见：{{ step.comment }}
          </p>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { approvalApi } from '@/api/modules/approval'
import { formatDateTime, formatMoney } from '@/utils/format'

// ===================== 状态 =====================
const activeTab = ref('pending')

// 待审批
const pendingLoading = ref(false)
const pendingList = ref<any[]>([])
const pendingPagination = reactive({ page: 1, pageSize: 20, total: 0 })

// 我发起的
const initiatedLoading = ref(false)
const initiatedList = ref<any[]>([])
const initiatedPagination = reactive({ page: 1, pageSize: 20, total: 0 })

// 审批弹窗
const approvalDialogVisible = ref(false)
const approvalAction = ref<'approve' | 'reject'>('approve')
const approvalLoading = ref(false)
const currentApproval = ref<any>(null)
const approvalFormRef = ref<FormInstance>()
const approvalForm = reactive({ comment: '' })
const approvalFormRules = computed<FormRules>(() => ({
  comment: approvalAction.value === 'reject'
    ? [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
    : [],
}))

// 详情弹窗
const detailDialogVisible = ref(false)
const detailData = ref<any>(null)

// ===================== 方法 =====================
async function fetchPendingList() {
  pendingLoading.value = true
  try {
    const res = await approvalApi.getList({
      page: pendingPagination.page,
      pageSize: pendingPagination.pageSize,
      status: 'PENDING',
    })
    pendingList.value = res.data.items || []
    pendingPagination.total = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || '获取待审批列表失败')
  } finally {
    pendingLoading.value = false
  }
}

async function fetchInitiatedList() {
  initiatedLoading.value = true
  try {
    const res = await approvalApi.getMyApprovals({
      page: initiatedPagination.page,
      pageSize: initiatedPagination.pageSize,
    })
    initiatedList.value = res.data.items || []
    initiatedPagination.total = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || '获取我发起的列表失败')
  } finally {
    initiatedLoading.value = false
  }
}

function handleTabChange(tab: string) {
  if (tab === 'pending') fetchPendingList()
  else fetchInitiatedList()
}

function getApprovalStatusType(status?: string) {
  const map: Record<string, string> = { PENDING: 'warning', IN_PROGRESS: '', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'info' }
  return map[status || ''] || 'info'
}

function getApprovalStatusLabel(status?: string) {
  const map: Record<string, string> = { PENDING: '待审批', IN_PROGRESS: '审批中', APPROVED: '已通过', REJECTED: '已驳回', CANCELLED: '已取消' }
  return map[status || ''] || status || '-'
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

function handleApprove(row: any) {
  approvalAction.value = 'approve'
  currentApproval.value = row
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

function handleReject(row: any) {
  approvalAction.value = 'reject'
  currentApproval.value = row
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

async function submitApproval() {
  const valid = await approvalFormRef.value?.validate().catch(() => false)
  if (!valid) return

  approvalLoading.value = true
  try {
    const data = { comment: approvalForm.comment }
    if (approvalAction.value === 'approve') {
      await approvalApi.approve(currentApproval.value.id, data)
      ElMessage.success('审批通过')
    } else {
      await approvalApi.reject(currentApproval.value.id, data)
      ElMessage.success('已驳回')
    }
    approvalDialogVisible.value = false
    fetchPendingList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    approvalLoading.value = false
  }
}

async function handleWithdraw(row: any) {
  try {
    await ElMessageBox.confirm('确定要撤回此审批吗？', '确认撤回', { type: 'warning' })
    await approvalApi.withdraw(row.id)
    ElMessage.success('撤回成功')
    fetchInitiatedList()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '撤回失败')
  }
}

async function handleViewDetail(row: any) {
  try {
    const res = await approvalApi.getById(row.id)
    detailData.value = res.data
    detailDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '获取详情失败')
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchPendingList()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 18px;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
