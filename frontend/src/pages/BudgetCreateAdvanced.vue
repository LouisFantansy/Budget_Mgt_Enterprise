<template>
  <div class="page-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>高级创建预算</span>
          <el-button type="primary" link @click="goSimple">
            使用普通创建
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>

      <!-- 步骤条 -->
      <el-steps :active="currentStep" finish-status="success" class="steps-bar">
        <el-step title="基本信息" />
        <el-step title="预算明细" />
        <el-step title="月度计划" />
        <el-step title="预览确认" />
      </el-steps>

      <!-- 步骤 1: 基本信息 -->
      <div v-if="currentStep === 0" class="step-content">
        <el-form
          ref="step1FormRef"
          :model="formData"
          :rules="step1Rules"
          label-width="100px"
        >
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
              <el-form-item label="总金额">
                <el-input-number
                  v-model="formData.totalAmount"
                  :min="0"
                  :precision="2"
                  :step="1000"
                  style="width: 100%"
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
              :rows="3"
              placeholder="请输入备注信息"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤 2: 预算明细 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="section-header">
          <el-button type="primary" size="small" @click="addItem">
            <el-icon><Plus /></el-icon>添加明细
          </el-button>
        </div>

        <el-table :data="formData.items" border style="width: 100%">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column label="名称" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="名称" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="费用类别" width="100">
            <template #default="{ row }">
              <el-input v-model="row.category" placeholder="类别" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" width="100">
            <template #default="{ row }">
              <el-input v-model="row.specification" placeholder="规格" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110" align="right">
            <template #default="{ row }">
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
          <el-table-column label="数量" width="80" align="right">
            <template #default="{ row }">
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
          <el-table-column label="小计" width="110" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatMoney(row.totalPrice || 0) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用途" min-width="100">
            <template #default="{ row }">
              <el-input v-model="row.purpose" placeholder="用途" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="供应商" width="100">
            <template #default="{ row }">
              <el-input v-model="row.supplier" placeholder="供应商" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="交付日期" width="120">
            <template #default="{ row }">
              <el-date-picker
                v-model="row.deliveryDate"
                type="date"
                placeholder="日期"
                size="small"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeItem($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span class="total-label">总金额：</span>
          <span class="total-amount">{{ formatMoney(totalAmount) }}</span>
        </div>
      </div>

      <!-- 步骤 3: 月度计划 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="section-header">
          <span class="section-title">为每个明细项分配月度计划</span>
          <div class="quick-actions">
            <el-dropdown @command="handleQuickDistribute">
              <el-button type="primary" size="small">
                快捷分配<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="equal">平均分配</el-dropdown-item>
                  <el-dropdown-item command="q1">第一季度集中</el-dropdown-item>
                  <el-dropdown-item command="q4">第四季度集中</el-dropdown-item>
                  <el-dropdown-item command="front">上半年集中</el-dropdown-item>
                  <el-dropdown-item command="back">下半年集中</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <el-alert
          v-if="!allItemsValid"
          title="请确保每个明细项的月度分配总额等于其小计金额"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <div v-for="(item, index) in formData.items" :key="index" class="monthly-plan-item">
          <div class="item-header">
            <span class="item-name">{{ item.name || `明细项 ${index + 1}` }}</span>
            <span class="item-total">小计: {{ formatMoney(item.totalPrice || 0) }}</span>
            <span :class="['item-allocated', getAllocateStatusClass(item)]">
              已分配: {{ formatMoney(getAllocatedTotal(item)) }}
            </span>
          </div>
          <el-row :gutter="8">
            <el-col :span="2" v-for="month in 12" :key="month">
              <el-form-item :label="`${month}月`" label-width="36px">
                <el-input-number
                  v-model="item.monthlyPlan[month]"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                  @change="validateMonthlyPlan(item)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 步骤 4: 预览确认 -->
      <div v-if="currentStep === 3" class="step-content">
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="预算名称">{{ formData.name }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ getDepartmentName(formData.departmentId) }}</el-descriptions-item>
          <el-descriptions-item label="预算类型">
            <el-tag :type="formData.type === 'OPEX' ? 'primary' : 'success'">
              {{ formData.type === 'OPEX' ? '运营支出' : '资本支出' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="年度">{{ formData.year }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatMoney(totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="付款主体">{{ formData.paymentEntity || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="preview-section">
          <h4>预算明细</h4>
          <el-table :data="formData.items" border size="small">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column prop="category" label="类别" width="80" />
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">{{ formatMoney(row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="60" align="right" />
            <el-table-column label="小计" width="110" align="right">
              <template #default="{ row }">{{ formatMoney(row.totalPrice) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div class="preview-section">
          <h4>月度计划分布</h4>
          <v-chart class="chart" :option="monthlyChartOption" autoresize />
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="step-actions">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 3" @click="goBack">取消</el-button>
        <el-button v-if="currentStep === 3" type="info" :loading="saveLoading" @click="handleSaveDraft">保存草稿</el-button>
        <el-button v-if="currentStep === 3" type="primary" :loading="submitLoading" @click="handleSubmit">提交审批</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, ArrowRight, ArrowDown } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { budgetApi } from '@/api/modules/budget'
import { getDepartmentTree } from '@/api/modules/department'
import type { Department } from '@/types'
import { formatMoney } from '@/utils/format'

// 注册 ECharts 组件
use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()

// ===================== 状态 =====================
const currentStep = ref(0)
const step1FormRef = ref<FormInstance>()
const saveLoading = ref(false)
const submitLoading = ref(false)
const departmentTree = ref<Department[]>([])

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
  monthlyPlan: Record<number, number>
  paymentEntity?: string
  group?: string
  accountCode?: string
  project?: string
  sortOrder?: number
}

// 步骤1验证规则
const step1Rules: FormRules = {
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

// 检查所有明细项的月度分配是否有效
const allItemsValid = computed(() => {
  return formData.items.every(item => {
    const allocated = getAllocatedTotal(item)
    return Math.abs(allocated - (item.totalPrice || 0)) < 0.01
  })
})

// 月度计划图表配置
const monthlyChartOption = computed(() => {
  const monthlyData = new Array(12).fill(0)
  formData.items.forEach(item => {
    for (let i = 1; i <= 12; i++) {
      monthlyData[i - 1] += item.monthlyPlan[i] || 0
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}<br/>金额: ${formatMoney(params[0].value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`
      }
    },
    series: [
      {
        name: '预算金额',
        type: 'bar',
        barWidth: '60%',
        data: monthlyData,
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
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

// 获取部门名称
function getDepartmentName(id: number | null): string {
  if (!id) return '-'
  const findDept = (depts: Department[]): string => {
    for (const dept of depts) {
      if (dept.id === id) return dept.name
      if (dept.children) {
        const name = findDept(dept.children)
        if (name) return name
      }
    }
    return '-'
  }
  return findDept(departmentTree.value)
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
    monthlyPlan: {},
    sortOrder: formData.items.length,
  })
}

// 删除明细项
function removeItem(index: number) {
  formData.items.splice(index, 1)
}

// 更新明细项小计
function updateItemTotal(item: BudgetItemForm) {
  item.totalPrice = (item.unitPrice || 0) * (item.quantity || 0)
}

// 获取已分配总额
function getAllocatedTotal(item: BudgetItemForm): number {
  return Object.values(item.monthlyPlan).reduce((sum, val) => sum + (val || 0), 0)
}

// 获取分配状态样式
function getAllocateStatusClass(item: BudgetItemForm): string {
  const allocated = getAllocatedTotal(item)
  const total = item.totalPrice || 0
  const diff = Math.abs(allocated - total)
  if (diff < 0.01) return 'valid'
  if (allocated > total) return 'error'
  return 'warning'
}

// 验证月度计划
function validateMonthlyPlan(item: BudgetItemForm) {
  // 自动验证，不需要额外操作
}

// 快捷分配
function handleQuickDistribute(command: string) {
  formData.items.forEach(item => {
    const total = item.totalPrice || 0
    const plan: Record<number, number> = {}
    
    switch (command) {
      case 'equal':
        // 平均分配
        for (let i = 1; i <= 12; i++) {
          plan[i] = Math.floor((total / 12) * 100) / 100
        }
        // 调整最后一月使总和正确
        const equalSum = Object.values(plan).reduce((s, v) => s + v, 0)
        plan[12] = Math.floor((plan[12] + (total - equalSum)) * 100) / 100
        break
      case 'q1':
        // 第一季度集中
        for (let i = 1; i <= 3; i++) plan[i] = Math.floor((total / 3) * 100) / 100
        break
      case 'q4':
        // 第四季度集中
        for (let i = 10; i <= 12; i++) plan[i] = Math.floor((total / 3) * 100) / 100
        break
      case 'front':
        // 上半年集中
        for (let i = 1; i <= 6; i++) plan[i] = Math.floor((total / 6) * 100) / 100
        break
      case 'back':
        // 下半年集中
        for (let i = 7; i <= 12; i++) plan[i] = Math.floor((total / 6) * 100) / 100
        break
    }
    
    item.monthlyPlan = plan
  })
  ElMessage.success('已按所选方式分配')
}

// 下一步
async function nextStep() {
  if (currentStep.value === 0) {
    const valid = await step1FormRef.value?.validate().catch(() => false)
    if (!valid) return
  }
  
  if (currentStep.value === 1) {
    if (formData.items.length === 0) {
      ElMessage.warning('请至少添加一项预算明细')
      return
    }
    // 验证明细项
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
      if (!item.name) {
        ElMessage.warning(`第 ${i + 1} 项明细名称不能为空`)
        return
      }
      if (item.unitPrice <= 0) {
        ElMessage.warning(`第 ${i + 1} 项单价必须大于0`)
        return
      }
    }
  }
  
  if (currentStep.value === 2) {
    if (!allItemsValid.value) {
      ElMessage.warning('请确保每个明细项的月度分配总额等于其小计金额')
      return
    }
  }
  
  currentStep.value++
}

// 上一步
function prevStep() {
  currentStep.value--
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
      monthly_plan: item.monthlyPlan,
      sort_order: index,
    })),
  }
}

// 保存草稿
async function handleSaveDraft() {
  saveLoading.value = true
  try {
    await budgetApi.create(buildSubmitData() as any)
    ElMessage.success('保存草稿成功')
    router.push('/budgets')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 提交审批
async function handleSubmit() {
  submitLoading.value = true
  try {
    const res = await budgetApi.create(buildSubmitData() as any)
    const budgetId = res.data.id
    await budgetApi.submit(budgetId)
    ElMessage.success('提交审批成功')
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

// 跳转到普通创建
function goSimple() {
  router.push('/budgets/create')
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchDepartmentTree()
  // 默认添加一行
  if (formData.items.length === 0) {
    addItem()
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

.steps-bar {
  margin: 24px 0 32px;
}

.step-content {
  min-height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .quick-actions {
    display: flex;
    gap: 8px;
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

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #EBEEF5;
}

.monthly-plan-item {
  margin-bottom: 24px;
  padding: 16px;
  background: #F5F7FA;
  border-radius: 4px;

  .item-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;

    .item-name {
      font-weight: 600;
      color: #303133;
    }

    .item-total {
      color: #606266;
    }

    .item-allocated {
      font-weight: 500;

      &.valid {
        color: #67C23A;
      }

      &.warning {
        color: #E6A23C;
      }

      &.error {
        color: #F56C6C;
      }
    }
  }
}

.preview-section {
  margin-top: 24px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.chart {
  height: 300px;
  width: 100%;
}

:deep(.el-table) {
  .el-input__wrapper,
  .el-input-number {
    width: 100%;
  }
}
</style>
