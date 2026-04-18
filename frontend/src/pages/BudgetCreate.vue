<template>
  <div class="page-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>{{ isEditMode ? '编辑预算' : '创建预算' }}</span>
          <el-button v-if="!isEditMode" type="primary" link @click="goAdvanced">
            使用高级创建
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="budget-form"
      >
        <!-- 基本信息 -->
        <div class="section-title">基本信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入预算名称" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentId">
              <el-tree-select
                v-model="formData.departmentId"
                :data="departmentTree"
                placeholder="选择部门"
                clearable
                :props="{ label: 'name' }"
                node-key="id"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="预算类型" prop="type">
              <el-radio-group v-model="formData.type">
                <el-radio label="OPEX">运营支出</el-radio>
                <el-radio label="CAPEX">资本支出</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年度" prop="year">
              <el-date-picker
                v-model="formData.year"
                type="year"
                placeholder="选择年度"
                style="width: 100%"
                value-format="YYYY"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input-number
                v-model="formData.totalAmount"
                :min="0"
                :precision="2"
                :step="1000"
                style="width: 100%"
                placeholder="自动计算"
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="付款主体">
              <el-input v-model="formData.paymentEntity" placeholder="请输入付款主体" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="组别">
              <el-input v-model="formData.group" placeholder="请输入组别" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="会计科目">
              <el-input v-model="formData.accountCode" placeholder="请输入会计科目" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 预算明细 -->
        <div class="section-title">
          <span>预算明细</span>
          <el-button type="primary" size="small" @click="addItem">
            <el-icon><Plus /></el-icon>添加明细
          </el-button>
        </div>

        <el-table :data="formData.items" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="名称" min-width="150">
            <template #default="{ row, $index }">
              <el-input v-model="row.name" placeholder="名称" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="费用类别" width="120">
            <template #default="{ row, $index }">
              <el-input v-model="row.category" placeholder="类别" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" width="120">
            <template #default="{ row, $index }">
              <el-input v-model="row.specification" placeholder="规格" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="功能描述" min-width="150">
            <template #default="{ row, $index }">
              <el-input v-model="row.function" placeholder="功能描述" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="130" align="right">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.unitPrice"
                :min="0"
                :precision="2"
                :controls="false"
                size="small"
                style="width: 100%"
                @change="updateItemTotal(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100" align="right">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :precision="0"
                :controls="false"
                size="small"
                style="width: 100%"
                @change="updateItemTotal(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatMoney(row.totalPrice || 0) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用途" min-width="120">
            <template #default="{ row, $index }">
              <el-input v-model="row.purpose" placeholder="用途" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="供应商" width="120">
            <template #default="{ row, $index }">
              <el-input v-model="row.supplier" placeholder="供应商" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="交付日期" width="140">
            <template #default="{ row, $index }">
              <el-date-picker
                v-model="row.deliveryDate"
                type="date"
                placeholder="选择日期"
                size="small"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeItem($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 合计行 -->
        <div class="total-row">
          <span class="total-label">总金额：</span>
          <span class="total-amount">{{ formatMoney(totalAmount) }}</span>
        </div>

        <!-- 底部操作 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="info" :loading="saveLoading" @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交审批</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, ArrowRight } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { budgetApi } from '@/api/modules/budget'
import { getDepartmentTree } from '@/api/modules/department'
import type { Budget, Department } from '@/types'
import { formatMoney } from '@/utils/format'

const route = useRoute()
const router = useRouter()

// ===================== 状态 =====================
const formRef = ref<FormInstance>()
const saveLoading = ref(false)
const submitLoading = ref(false)
const departmentTree = ref<Department[]>([])
const budgetId = ref<string>('')

// 是否为编辑模式
const isEditMode = computed(() => {
  return route.path.includes('/edit')
})

// 表单数据
const formData = reactive({
  name: '',
  departmentId: null as number | null,
  type: 'OPEX' as 'OPEX' | 'CAPEX',
  year: new Date().getFullYear().toString(),
  totalAmount: 0,
  paymentEntity: '',
  group: '',
  accountCode: '',
  remark: '',
  items: [] as BudgetItemForm[],
})

// 预算明细项类型
interface BudgetItemForm {
  name: string
  category: string
  specification: string
  function: string
  unitPrice: number
  quantity: number
  totalPrice: number
  purpose: string
  supplier: string
  deliveryDate: string
  paymentEntity?: string
  group?: string
  accountCode?: string
  monthlyPlan?: Record<string, number>
  project?: string
  sortOrder?: number
}

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入预算名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  type: [{ required: true, message: '请选择预算类型', trigger: 'change' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
}

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
})

// ===================== 方法 =====================

// 获取部门树
async function fetchDepartmentTree() {
  try {
    const res = await getDepartmentTree()
    departmentTree.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取部门列表失败')
  }
}

// 添加明细项
function addItem() {
  formData.items.push({
    name: '',
    category: '',
    specification: '',
    function: '',
    unitPrice: 0,
    quantity: 1,
    totalPrice: 0,
    purpose: '',
    supplier: '',
    deliveryDate: '',
    sortOrder: formData.items.length,
  })
}

// 删除明细项
function removeItem(index: number) {
  formData.items.splice(index, 1)
  updateTotalAmount()
}

// 更新明细项小计
function updateItemTotal(item: BudgetItemForm) {
  item.totalPrice = (item.unitPrice || 0) * (item.quantity || 0)
  updateTotalAmount()
}

// 更新总金额
function updateTotalAmount() {
  formData.totalAmount = totalAmount.value
}

// 验证表单
async function validateForm(): Promise<boolean> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return false

  if (formData.items.length === 0) {
    ElMessage.warning('请至少添加一项预算明细')
    return false
  }

  // 验证明细项
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i]
    if (!item.name) {
      ElMessage.warning(`第 ${i + 1} 项明细名称不能为空`)
      return false
    }
    if (item.unitPrice <= 0) {
      ElMessage.warning(`第 ${i + 1} 项单价必须大于0`)
      return false
    }
  }

  return true
}

// 构建提交数据
function buildSubmitData() {
  return {
    name: formData.name,
    department_id: formData.departmentId,
    type: formData.type,
    year: parseInt(formData.year),
    total_amount: totalAmount.value,
    payment_entity: formData.paymentEntity,
    group: formData.group,
    account_code: formData.accountCode,
    remark: formData.remark,
    items: formData.items.map((item, index) => ({
      name: item.name,
      category: item.category,
      specification: item.specification,
      function: item.function,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      payment_entity: item.paymentEntity || formData.paymentEntity,
      group: item.group || formData.group,
      account_code: item.accountCode || formData.accountCode,
      purpose: item.purpose,
      supplier: item.supplier,
      delivery_date: item.deliveryDate,
      sort_order: index,
    })),
  }
}

// 加载预算数据（编辑模式）
async function loadBudgetData() {
  if (!isEditMode.value) return
  
  budgetId.value = route.params.id as string
  try {
    const res = await budgetApi.getById(budgetId.value)
    const budget = res.data
    
    // 填充表单数据
    formData.name = budget.name
    formData.departmentId = budget.departmentId || null
    formData.type = (budget.type as 'OPEX' | 'CAPEX') || 'OPEX'
    formData.year = budget.year?.toString() || new Date().getFullYear().toString()
    formData.totalAmount = budget.totalAmount || 0
    formData.paymentEntity = budget.paymentEntity || ''
    formData.group = budget.group || ''
    formData.accountCode = budget.accountCode || ''
    formData.remark = budget.remark || ''
    
    // 填充明细项
    formData.items = (budget.items || []).map((item, index) => ({
      name: item.name || '',
      category: item.category || '',
      specification: item.specification || '',
      function: item.function || '',
      unitPrice: item.unitPrice || 0,
      quantity: item.quantity || 1,
      totalPrice: item.totalPrice || item.plannedAmount || item.unitPrice * item.quantity || 0,
      purpose: item.purpose || '',
      supplier: item.supplier || '',
      deliveryDate: item.deliveryDate || '',
      paymentEntity: item.paymentEntity || '',
      group: item.group || '',
      accountCode: item.accountCode || '',
      sortOrder: index,
    }))
  } catch (error: any) {
    ElMessage.error(error?.message || '加载预算数据失败')
    router.push('/budgets')
  }
}

// 保存草稿
async function handleSaveDraft() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (formData.items.length === 0) {
    ElMessage.warning('请至少添加一项预算明细')
    return
  }

  saveLoading.value = true
  try {
    if (isEditMode.value) {
      await budgetApi.update(budgetId.value, buildSubmitData() as any)
      ElMessage.success('更新成功')
    } else {
      await budgetApi.create(buildSubmitData() as any)
      ElMessage.success('保存草稿成功')
    }
    router.push('/budgets')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 提交审批
async function handleSubmit() {
  const valid = await validateForm()
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEditMode.value) {
      await budgetApi.update(budgetId.value, buildSubmitData() as any)
      await budgetApi.submit(budgetId.value)
      ElMessage.success('提交审批成功')
    } else {
      const res = await budgetApi.create(buildSubmitData() as any)
      const newBudgetId = res.data.id
      await budgetApi.submit(newBudgetId)
      ElMessage.success('提交审批成功')
    }
    router.push('/budgets')
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 返回列表
function goBack() {
  router.push('/budgets')
}

// 跳转到高级创建
function goAdvanced() {
  router.push('/budgets/create-advanced')
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchDepartmentTree()
  
  if (isEditMode.value) {
    loadBudgetData()
  } else {
    // 默认添加一行
    if (formData.items.length === 0) {
      addItem()
    }
  }
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.form-card {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;

  &:first-of-type {
    margin-top: 0;
  }
}

.budget-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
}

.amount-text {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 0;
  margin-top: 16px;
  border-top: 1px solid #EBEEF5;

  .total-label {
    font-size: 14px;
    color: #606266;
    margin-right: 8px;
  }

  .total-amount {
    font-size: 20px;
    font-weight: 600;
    color: #F56C6C;
    font-family: 'Courier New', monospace;
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
  .el-input__wrapper,
  .el-input-number {
    width: 100%;
  }
}
</style>
