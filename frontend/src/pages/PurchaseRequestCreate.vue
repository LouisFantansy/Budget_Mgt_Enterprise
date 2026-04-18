<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑采购申请' : '创建采购申请' }}</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" style="max-width: 900px">
      <!-- 基本信息 -->
      <el-card header="基本信息" shadow="never" style="margin-bottom: 20px">
        <el-form-item label="关联预算" prop="budgetId">
          <el-select
            v-model="formData.budgetId"
            placeholder="搜索并选择已审批预算"
            filterable
            remote
            :remote-method="searchBudgets"
            :loading="budgetSearchLoading"
            style="width: 100%"
            @change="handleBudgetChange"
          >
            <el-option
              v-for="b in budgetOptions"
              :key="b.id"
              :label="`${b.code} - ${b.name} (可用: ${formatMoney(b.remainingAmount)})`"
              :value="b.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="selectedBudget" label="预算明细项" prop="budgetItemId">
          <el-select
            v-model="formData.budgetItemId"
            placeholder="选择预算明细项（可选）"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in selectedBudget.items"
              :key="item.id"
              :label="`${item.category} - ${formatMoney(item.remainingAmount)}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <!-- 预算信息提示 -->
        <el-alert
          v-if="selectedBudget"
          :title="`预算总额: ${formatMoney(selectedBudget.totalAmount)} | 已使用: ${formatMoney(selectedBudget.usedAmount)} | 可用: ${formatMoney(selectedBudget.remainingAmount)}`"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 12px"
        />

        <el-alert
          v-if="isOverBudget"
          :title="`采购总额 ${formatMoney(totalAmount)} 超过可用预算 ${formatMoney(selectedBudget!.remainingAmount)}`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 12px"
        />

        <el-form-item label="用途说明" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入采购用途说明" />
        </el-form-item>

        <el-form-item label="紧急程度" prop="urgency">
          <el-radio-group v-model="formData.urgency">
            <el-radio label="LOW">低</el-radio>
            <el-radio label="NORMAL">普通</el-radio>
            <el-radio label="HIGH">高</el-radio>
            <el-radio label="URGENT">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-card>

      <!-- 采购明细 -->
      <el-card header="采购明细" shadow="never" style="margin-bottom: 20px">
        <div style="margin-bottom: 12px">
          <el-button type="primary" size="small" @click="addItem">
            <el-icon><Plus /></el-icon>添加行
          </el-button>
        </div>

        <el-table :data="formData.items" border style="width: 100%">
          <el-table-column label="物品名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="物品名称" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.specification" placeholder="规格型号" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="130">
            <template #default="{ row }">
              <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">
              {{ formatMoney(row.quantity * row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column label="供应商" min-width="130">
            <template #default="{ row }">
              <el-input v-model="row.supplier" placeholder="供应商" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="交付日期" width="160">
            <template #default="{ row }">
              <el-date-picker v-model="row.deliveryDate" type="date" placeholder="交付日期" size="small" style="width: 100%" value-format="YYYY-MM-DD" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="备注" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>合计：</span>
          <span class="total-amount">{{ formatMoney(totalAmount) }}</span>
        </div>
      </el-card>

      <!-- 底部操作 -->
      <div class="form-footer">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="info" :loading="submitLoading" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交审批</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { purchaseApi } from '@/api/modules/purchase'
import { budgetApi } from '@/api/modules/budget'
import type { Budget } from '@/types'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.query.editId)

// ===================== 状态 =====================
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const budgetSearchLoading = ref(false)
const budgetOptions = ref<Budget[]>([])
const selectedBudget = ref<Budget | null>(null)

interface PurchaseItemForm {
  name: string
  specification: string
  quantity: number
  unitPrice: number
  supplier: string
  deliveryDate: string
  remark: string
}

const formData = reactive({
  budgetId: null as number | null,
  budgetItemId: null as number | null,
  description: '',
  urgency: 'NORMAL' as string,
  items: [] as PurchaseItemForm[],
})

const formRules: FormRules = {
  budgetId: [{ required: true, message: '请选择关联预算', trigger: 'change' }],
  description: [{ required: true, message: '请输入用途说明', trigger: 'blur' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
}

const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
})

const isOverBudget = computed(() => {
  if (!selectedBudget.value) return false
  return totalAmount.value > selectedBudget.value.remainingAmount
})

// ===================== 方法 =====================
async function searchBudgets(query: string) {
  if (!query) return
  budgetSearchLoading.value = true
  try {
    const res = await budgetApi.getList({ search: query, status: 'APPROVED', pageSize: 20 })
    budgetOptions.value = res.data.items
  } catch (error: any) {
    ElMessage.error(error?.message || '搜索预算失败')
  } finally {
    budgetSearchLoading.value = false
  }
}

async function handleBudgetChange(budgetId: number) {
  try {
    const res = await budgetApi.getById(budgetId)
    selectedBudget.value = res.data
    formData.budgetItemId = null
  } catch (error: any) {
    ElMessage.error(error?.message || '获取预算详情失败')
  }
}

function addItem() {
  formData.items.push({
    name: '',
    specification: '',
    quantity: 1,
    unitPrice: 0,
    supplier: '',
    deliveryDate: '',
    remark: '',
  })
}

function removeItem(index: number) {
  formData.items.splice(index, 1)
}

function validateItems(): boolean {
  if (formData.items.length === 0) {
    ElMessage.warning('请至少添加一条采购明细')
    return false
  }
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i]
    if (!item.name) {
      ElMessage.warning(`第${i + 1}行：请输入物品名称`)
      return false
    }
    if (item.unitPrice <= 0) {
      ElMessage.warning(`第${i + 1}行：单价必须大于0`)
      return false
    }
  }
  return true
}

async function handleSaveDraft() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!validateItems()) return

  submitLoading.value = true
  try {
    const payload = {
      ...formData,
      status: 'DRAFT',
      totalAmount: totalAmount.value,
      items: formData.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
    }
    if (isEdit.value) {
      await purchaseApi.update(route.query.editId as string, payload)
      ElMessage.success('保存成功')
    } else {
      await purchaseApi.create(payload)
      ElMessage.success('保存成功')
    }
    router.push('/purchase')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!validateItems()) return
  if (isOverBudget.value) {
    ElMessage.warning('采购总额超过可用预算，请调整后再提交')
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      ...formData,
      totalAmount: totalAmount.value,
      items: formData.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
    }
    let createdId: number | string
    if (isEdit.value) {
      await purchaseApi.update(route.query.editId as string, payload)
      createdId = route.query.editId as string
    } else {
      const res = await purchaseApi.create(payload)
      createdId = res.data.id
    }
    await purchaseApi.submit(createdId)
    ElMessage.success('提交审批成功')
    router.push('/purchase')
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

async function loadEditData(id: string) {
  try {
    const res = await purchaseApi.getById(id)
    const data = res.data
    formData.budgetId = data.budgetId
    formData.description = data.description || ''
    formData.urgency = data.urgency || 'NORMAL'
    formData.items = (data.items || []).map((item: any) => ({
      name: item.name,
      specification: item.specification || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      supplier: item.supplier || '',
      deliveryDate: item.deliveryDate || '',
      remark: item.remark || '',
    }))
    if (data.budgetId) {
      handleBudgetChange(data.budgetId)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载数据失败')
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  if (isEdit.value) {
    loadEditData(route.query.editId as string)
  }
  addItem() // 默认添加一行
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
  padding-top: 20px;
}
</style>
