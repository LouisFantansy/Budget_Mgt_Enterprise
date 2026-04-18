<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
        <span class="page-title">预算调整</span>
      </div>
    </div>

    <el-skeleton :rows="10" animated v-if="loading" />

    <template v-else-if="budget">
      <!-- 原预算信息（只读） -->
      <el-card class="detail-card">
        <template #header>
          <span class="card-title">原预算信息</span>
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
          <el-descriptions-item label="当前状态">
            <el-tag :type="getBudgetStatusType(budget.status) as any" size="small">
              {{ getBudgetStatusLabel(budget.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="20" style="margin-top: 16px">
          <el-col :span="6">
            <div class="amount-box">
              <div class="amount-label">原总金额</div>
              <div class="amount-value">{{ formatMoney(budget.totalAmount) }}</div>
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
              <div class="amount-label">当前可用</div>
              <div class="amount-value available">{{ formatMoney(getAvailableAmount()) }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 调整表单 -->
      <el-card class="detail-card">
        <template #header>
          <span class="card-title">调整信息</span>
        </template>

        <el-form
          ref="formRef"
          :model="adjustForm"
          :rules="formRules"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="调整后金额" prop="adjustedAmount">
                <el-input-number
                  v-model="adjustForm.adjustedAmount"
                  :min="0"
                  :precision="2"
                  :step="1000"
                  style="width: 100%"
                  @change="calculateDifference"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="调整类型">
                <el-tag :type="adjustType.type" size="large">
                  {{ adjustType.label }}
                </el-tag>
                <span class="diff-amount" :class="adjustType.class">
                  {{ diffAmount > 0 ? '+' : '' }}{{ formatMoney(diffAmount) }}
                </span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="调整原因" prop="reason">
            <el-input
              v-model="adjustForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入调整原因（必填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 明细调整 -->
          <div class="section-title">
            <span>明细调整（可选）</span>
          </div>

          <el-alert
            title="如需调整明细项金额，请在下表中修改。调整后明细总额应等于调整后总金额。"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />

          <el-table :data="adjustForm.items" border style="width: 100%">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="category" label="费用类别" width="100" />
            <el-table-column label="原金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.originalAmount) }}
              </template>
            </el-table-column>
            <el-table-column label="调整后金额" width="150" align="right">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.adjustedAmount"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                  @change="validateItemsTotal"
                />
              </template>
            </el-table-column>
            <el-table-column label="差异" width="120" align="right">
              <template #default="{ row }">
                <span :class="getItemDiffClass(row)">
                  {{ getItemDiff(row) > 0 ? '+' : '' }}{{ formatMoney(getItemDiff(row)) }}
                </span>
              </template>
            </el-table-column>
          </el-table>

          <div class="items-total-row">
            <span>明细合计: {{ formatMoney(itemsTotal) }}</span>
            <span v-if="!itemsTotalValid" class="items-total-error">
              （与调整后金额不符，差额: {{ formatMoney(itemsDiff) }}）
            </span>
          </div>
        </el-form>

        <!-- 底部操作 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" :loading="submitLoading" :disabled="!isFormValid" @click="handleSubmit">
            提交调整
          </el-button>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="预算不存在或已被删除" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { budgetApi } from '@/api/modules/budget'
import type { Budget, BudgetItem } from '@/types'
import { formatMoney } from '@/utils/format'
import { BUDGET_STATUS_MAP } from '@/utils/constants'

const route = useRoute()
const router = useRouter()

// ===================== 状态 =====================
const loading = ref(false)
const submitLoading = ref(false)
const budget = ref<Budget | null>(null)
const formRef = ref<FormInstance>()

// 调整表单
const adjustForm = reactive({
  adjustedAmount: 0,
  reason: '',
  items: [] as AdjustItemForm[],
})

// 明细调整项类型
interface AdjustItemForm {
  id: number
  name: string
  category: string
  originalAmount: number
  adjustedAmount: number
}

// 表单验证规则
const formRules: FormRules = {
  adjustedAmount: [
    { required: true, message: '请输入调整后金额', trigger: 'blur' },
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' },
    { min: 5, max: 500, message: '长度在 5 到 500 个字符', trigger: 'blur' },
  ],
}

// ===================== 计算属性 =====================
const budgetId = computed(() => route.params.id as string)

// 金额差异
const diffAmount = computed(() => {
  if (!budget.value) return 0
  return adjustForm.adjustedAmount - budget.value.totalAmount
})

// 调整类型
const adjustType = computed(() => {
  const diff = diffAmount.value
  if (diff > 0) {
    return { label: '增加预算', type: 'success' as const, class: 'increase' }
  } else if (diff < 0) {
    return { label: '减少预算', type: 'danger' as const, class: 'decrease' }
  }
  return { label: '金额不变', type: 'info' as const, class: '' }
})

// 明细合计
const itemsTotal = computed(() => {
  return adjustForm.items.reduce((sum, item) => sum + (item.adjustedAmount || 0), 0)
})

// 明细差额
const itemsDiff = computed(() => {
  return itemsTotal.value - adjustForm.adjustedAmount
})

// 明细总额是否有效
const itemsTotalValid = computed(() => {
  return Math.abs(itemsDiff.value) < 0.01
})

// 表单是否有效
const isFormValid = computed(() => {
  return adjustForm.reason.length >= 5 && itemsTotalValid.value
})

// ===================== 方法 =====================

// 获取预算详情
async function fetchBudgetDetail() {
  loading.value = true
  try {
    const res = await budgetApi.getById(budgetId.value)
    budget.value = res.data
    
    // 初始化调整表单
    adjustForm.adjustedAmount = budget.value.totalAmount
    adjustForm.items = (budget.value.items || []).map(item => ({
      id: item.id,
      name: item.name || '',
      category: item.category || '',
      originalAmount: item.totalPrice || item.plannedAmount || item.unitPrice * item.quantity || 0,
      adjustedAmount: item.totalPrice || item.plannedAmount || item.unitPrice * item.quantity || 0,
    }))
  } catch (error: any) {
    ElMessage.error(error?.message || '获取预算详情失败')
  } finally {
    loading.value = false
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

// 计算可用金额
function getAvailableAmount(): number {
  if (!budget.value) return 0
  const total = budget.value.totalAmount || 0
  const used = budget.value.usedAmount || 0
  const frozen = budget.value.frozenAmount || 0
  return total - used - frozen
}

// 计算差异
function calculateDifference() {
  // 自动计算，不需要额外操作
}

// 获取明细项差异
function getItemDiff(item: AdjustItemForm): number {
  return item.adjustedAmount - item.originalAmount
}

// 获取明细项差异样式类
function getItemDiffClass(item: AdjustItemForm): string {
  const diff = getItemDiff(item)
  if (diff > 0) return 'increase'
  if (diff < 0) return 'decrease'
  return ''
}

// 验证明细总额
function validateItemsTotal() {
  // 自动验证，不需要额外操作
}

// 提交调整
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (!itemsTotalValid.value) {
    ElMessage.warning('明细调整总额与调整后总金额不符，请检查')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要提交预算调整吗？调整后金额将从 ${formatMoney(budget.value?.totalAmount || 0)} 变为 ${formatMoney(adjustForm.adjustedAmount)}`,
      '确认提交调整',
      { type: 'warning' }
    )

    submitLoading.value = true
    
    // 构建调整数据
    const adjustData = {
      adjusted_amount: adjustForm.adjustedAmount,
      reason: adjustForm.reason,
      items: adjustForm.items.map(item => ({
        id: item.id,
        adjusted_amount: item.adjustedAmount,
      })),
    }
    
    await budgetApi.adjust(budgetId.value, adjustData)
    ElMessage.success('预算调整已提交')
    router.push(`/budgets/${budgetId.value}`)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '提交调整失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 返回
function goBack() {
  router.push(`/budgets/${budgetId.value}`)
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
  padding: 16px;
  background: #F5F7FA;
  border-radius: 4px;

  .amount-label {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
  }

  .amount-value {
    font-size: 20px;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    color: #303133;

    &.used {
      color: #E6A23C;
    }

    &.frozen {
      color: #909399;
    }

    &.available {
      color: #67C23A;
    }
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.diff-amount {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Courier New', monospace;

  &.increase {
    color: #67C23A;
  }

  &.decrease {
    color: #F56C6C;
  }
}

.increase {
  color: #67C23A;
}

.decrease {
  color: #F56C6C;
}

.items-total-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  margin-top: 8px;
  font-size: 14px;
  color: #606266;

  .items-total-error {
    color: #F56C6C;
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #EBEEF5;
}

:deep(.el-table) {
  .el-input-number {
    width: 100%;
  }
}
</style>
