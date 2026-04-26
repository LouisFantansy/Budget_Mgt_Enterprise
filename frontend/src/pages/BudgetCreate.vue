<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑预算' : '创建预算' }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-card class="form-card">
      <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="预算年度" prop="year">
              <el-select v-model="form.year" placeholder="选择年度">
                <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预算类别" prop="category">
              <el-radio-group v-model="form.category">
                <el-radio-button label="OPEX">OPEX</el-radio-button>
                <el-radio-button label="CAPEX">CAPEX</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预算来源" prop="source">
              <el-select v-model="form.source" placeholder="选择来源">
                <el-option label="自编" value="SELF_COMPILED" />
                <el-option label="集团分摊" value="GROUP_ALLOCATION" />
                <el-option label="SS Public" value="SS_PUBLIC" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门" prop="department">
              <el-select v-model="form.department" placeholder="选择部门" filterable>
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联模板" prop="template">
              <el-select v-model="form.template" placeholder="选择模板" @change="onTemplateChange" filterable>
                <el-option
                  v-for="t in filteredTemplates"
                  :key="t.id"
                  :label="t.name"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="编制说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="section-header">
        <span class="section-title">预算条目</span>
        <el-button type="primary" size="small" @click="addItem">
          <el-icon><Plus /></el-icon>添加条目
        </el-button>
      </div>

      <!-- 动态字段表格 -->
      <div v-if="templateFields.length > 0" class="table-wrapper">
        <el-table :data="items" border size="small" class="item-table" :max-height="600">
          <el-table-column type="index" width="45" fixed="left" />
          <el-table-column label="操作" width="70" fixed="left">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>

          <!-- 普通字段列 -->
          <template v-for="field in regularFields" :key="field.field_code">
            <el-table-column :label="field.field_name" :width="field.width || 120" :min-width="field.width || 120">
              <template #default="{ row, $index }">
                <!-- 文本输入 -->
                <el-autocomplete
                  v-if="field.field_type === 'TEXT' && field.field_code === 'item_name'"
                  v-model="row.fieldData[field.field_code]"
                  size="small"
                  :placeholder="field.field_name"
                  :fetch-suggestions="(query: string, cb: any) => queryPurchaseHistory(query, cb, $index)"
                  @select="(item: any) => handleHistorySelect(item, $index)"
                  @blur="onItemChange($index)"
                  style="width: 100%"
                  value-key="description"
                />
                <el-input
                  v-else-if="field.field_type === 'TEXT'"
                  v-model="row.fieldData[field.field_code]"
                  size="small"
                  :placeholder="field.field_name"
                  @blur="onItemChange($index)"
                />
                <!-- 数值输入 -->
                <el-input-number
                  v-else-if="field.field_type === 'NUMBER'"
                  v-model="row.fieldData[field.field_code]"
                  size="small"
                  :controls="false"
                  :precision="2"
                  style="width: 100%"
                  @change="onItemChange($index)"
                />
                <!-- 下拉选择 -->
                <el-select
                  v-else-if="field.field_type === 'SELECT'"
                  v-model="row.fieldData[field.field_code]"
                  size="small"
                  style="width: 100%"
                  filterable
                  allow-create
                  @change="onItemChange($index)"
                >
                  <el-option
                    v-for="opt in getFieldOptions(field)"
                    :key="opt"
                    :label="opt"
                    :value="opt"
                  />
                </el-select>
                <!-- 日期选择 -->
                <el-date-picker
                  v-else-if="field.field_type === 'DATE'"
                  v-model="row.fieldData[field.field_code]"
                  size="small"
                  type="date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
                <!-- 公式计算（只读） -->
                <el-input
                  v-else-if="field.field_type === 'FORMULA'"
                  v-model="row.computedFields[field.field_code]"
                  size="small"
                  readonly
                  :placeholder="field.formula || '自动计算'"
                />
              </template>
            </el-table-column>
          </template>

          <!-- 月度金额列（展开为12个月） -->
          <template v-if="monthAmtFields.length > 0">
            <el-table-column label="月度金额" align="center">
              <el-table-column
                v-for="m in 12"
                :key="`m_${m}`"
                :label="`${m}月`"
                width="75"
                align="right"
              >
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.fieldData[`month_amt_${m}`]"
                    size="small"
                    :controls="false"
                    :precision="2"
                    style="width: 100%"
                    @change="onItemChange($index)"
                  />
                </template>
              </el-table-column>
            </el-table-column>
          </template>

          <!-- 月度数量列（展开为12个月） -->
          <template v-if="monthQtyFields.length > 0">
            <el-table-column label="月度数量" align="center">
              <el-table-column
                v-for="m in 12"
                :key="`q_${m}`"
                :label="`${m}月`"
                width="70"
                align="right"
              >
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.fieldData[`month_qty_${m}`]"
                    size="small"
                    :controls="false"
                    :precision="0"
                    style="width: 100%"
                    @change="onItemChange($index)"
                  />
                </template>
              </el-table-column>
            </el-table-column>
          </template>

          <!-- 年度合计公式列 -->
          <template v-for="field in yearTotalFields" :key="field.field_code">
            <el-table-column :label="field.field_name" :width="field.width || 120" align="right" fixed="right">
              <template #default="{ row }">
                <el-input
                  v-model="row.computedFields[field.field_code]"
                  size="small"
                  readonly
                  class="formula-input"
                />
              </template>
            </el-table-column>
          </template>
        </el-table>
      </div>

      <el-empty v-else-if="form.template" description="模板暂无字段配置" />
      <el-empty v-else description="请先选择预算模板" />

      <!-- 预算汇总 -->
      <div v-if="items.length > 0" class="budget-summary">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="条目数">{{ items.length }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatAmount(totalAmount) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="form-actions">
        <el-button type="primary" @click="handleSave" :loading="saving">保存草稿</el-button>
        <el-button type="success" @click="handleSubmit" :loading="submitting">送审</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { budgetApi, purchaseHistoryApi } from '@/api/modules/budget'
import { budgetTemplateApi } from '@/api/modules/budgetTemplate'
import { getDepartmentList } from '@/api/modules/department'
import type { BudgetItem, BudgetSource } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const formRef = ref()
const saving = ref(false)
const submitting = ref(false)

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

const form = ref({
  year: currentYear,
  category: 'OPEX' as 'OPEX' | 'CAPEX',
  source: 'SELF_COMPILED' as BudgetSource,
  department: '',
  template: '',
  remark: ''
})

const items = ref<any[]>([])
const departments = ref<any[]>([])
const templates = ref<any[]>([])
const templateFields = ref<any[]>([])

const rules = {
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  source: [{ required: true, message: '请选择来源', trigger: 'change' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  template: [{ required: true, message: '请选择模板', trigger: 'change' }]
}

// 按类型分组的字段
const regularFields = computed(() => templateFields.value.filter(
  f => !['MONTH_QTY', 'MONTH_AMT'].includes(f.field_type) && !isYearTotalField(f)
))
const monthAmtFields = computed(() => templateFields.value.filter(f => f.field_type === 'MONTH_AMT'))
const monthQtyFields = computed(() => templateFields.value.filter(f => f.field_type === 'MONTH_QTY'))
const yearTotalFields = computed(() => templateFields.value.filter(f => isYearTotalField(f)))

function isYearTotalField(field: any) {
  return field.field_type === 'FORMULA' && field.formula?.includes('sum(month')
}

const filteredTemplates = computed(() => {
  return templates.value.filter(t => {
    if (form.value.category && t.category !== form.value.category) return false
    if (form.value.year && t.year !== form.value.year) return false
    return true
  })
})

const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => {
    const qty = Number(item.fieldData['quantity'] || 0)
    return sum + qty
  }, 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => {
    const amt = Number(item.computedFields['amount'] || item.computedFields['year_total'] || 0)
    return sum + amt
  }, 0)
})

function formatAmount(val: number) {
  if (!val) return '¥0.00'
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadDepartments() {
  try {
    const res = await getDepartmentList({ type: 'SECOND' })
    const inner = (res as any).data?.data || (res as any).data
    departments.value = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
  } catch (error) {
    console.error('加载部门失败', error)
  }
}

async function loadTemplates() {
  try {
    const res = await budgetTemplateApi.getTemplates()
    const inner = (res as any).data?.data || (res as any).data
    templates.value = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
  } catch (error) {
    console.error('加载模板失败', error)
  }
}

async function onTemplateChange(templateId: string) {
  if (!templateId) {
    templateFields.value = []
    return
  }
  try {
    const res = await budgetTemplateApi.getTemplate(templateId)
    const data = (res as any).data || {}
    templateFields.value = (data.fields || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    // 清空现有条目，根据新模板重新初始化
    items.value = []
  } catch (error) {
    ElMessage.error('加载模板字段失败')
  }
}

function getFieldOptions(field: any) {
  if (field.field_code === 'unit') {
    return ['个', '台', '套', '件', '米', '公斤', '升', '盒', '箱', '次', '人月', '人天']
  }
  if (field.field_code === 'supplier') {
    return ['Dell', 'HP', 'Lenovo', 'HuaWei', '浪潮', 'Supermicro', 'Synopsys', 'Cadence', 'Mentor', 'AWS', 'Azure']
  }
  return field.options?.map((o: any) => o.option_label || o.option_value) || []
}

async function queryPurchaseHistory(queryString: string, cb: any, _itemIndex: number) {
  if (!queryString || queryString.length < 2) {
    cb([])
    return
  }
  try {
    const res = await purchaseHistoryApi.suggest(queryString)
    const data = (res as any).data || []
    cb(data.map((item: any) => ({
      value: item.description,
      ...item
    })))
  } catch (error) {
    cb([])
  }
}

function handleHistorySelect(item: any, itemIndex: number) {
  const row = items.value[itemIndex]
  if (!row) return
  if (item.specification) row.fieldData['specification'] = item.specification
  if (item.supplier) row.fieldData['supplier'] = item.supplier
  if (item.suggested_price) row.fieldData['unit_price'] = Number(item.suggested_price)
  if (item.unit) row.fieldData['unit'] = item.unit
  onItemChange(itemIndex)
  ElMessage.success(`已推荐：${item.description}，单价 ¥${item.suggested_price || '-'}`)
}

function addItem() {
  if (!form.value.template) {
    ElMessage.warning('请先选择预算模板')
    return
  }
  const newItem: any = {
    id: '',
    budgetId: '',
    itemNo: items.value.length + 1,
    fieldData: {},
    computedFields: {},
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  // 设置默认值
  for (const field of templateFields.value) {
    if (field.default_value) {
      newItem.fieldData[field.field_code] = field.default_value
    }
  }
  items.value.push(newItem)
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  // 重新编号
  items.value.forEach((item, idx) => { item.itemNo = idx + 1 })
}

function onItemChange(index: number) {
  const item = items.value[index]
  if (!item) return

  // 计算公式字段
  for (const field of templateFields.value) {
    if (field.field_type === 'FORMULA' && field.formula) {
      const formula = field.formula
      if (formula.includes('unit_price') && formula.includes('quantity')) {
        const price = Number(item.fieldData['unit_price'] || 0)
        const qty = Number(item.fieldData['quantity'] || 0)
        item.computedFields[field.field_code] = (price * qty).toFixed(2)
      }
      if (formula.includes('sum(month_amt')) {
        let total = 0
        for (let m = 1; m <= 12; m++) {
          total += Number(item.fieldData[`month_amt_${m}`] || 0)
        }
        item.computedFields[field.field_code] = total.toFixed(2)
      }
      if (formula.includes('sum(month_qty')) {
        let total = 0
        for (let m = 1; m <= 12; m++) {
          total += Number(item.fieldData[`month_qty_${m}`] || 0)
        }
        item.computedFields[field.field_code] = total.toFixed(2)
      }
    }
  }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (items.value.length === 0) {
    ElMessage.warning('请至少添加一条预算条目')
    return
  }

  saving.value = true
  try {
    const data: any = {
      ...form.value,
      items: items.value.map(item => ({
        item_no: item.itemNo,
        field_data: item.fieldData,
        computed_fields: item.computedFields
      }))
    }
    if (isEdit.value) {
      await budgetApi.update(route.params.id as string, data)
      ElMessage.success('更新成功')
    } else {
      await budgetApi.create(data)
      ElMessage.success('创建成功')
    }
    router.push('/budgets')
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (items.value.length === 0) {
    ElMessage.warning('请至少添加一条预算条目')
    return
  }

  submitting.value = true
  try {
    // 先保存
    const data: any = {
      ...form.value,
      items: items.value.map(item => ({
        item_no: item.itemNo,
        field_data: item.fieldData,
        computed_fields: item.computedFields
      }))
    }
    let budgetId = route.params.id as string
    if (!isEdit.value) {
      const res = await budgetApi.create(data)
      budgetId = (res as any).data?.id
    } else {
      await budgetApi.update(budgetId, data)
    }
    // 再提交审批
    await budgetApi.submit(budgetId)
    ElMessage.success('送审成功')
    router.push('/budgets')
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '送审失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDepartments()
  loadTemplates()
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
}
.form-card {
  border-radius: 12px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 12px;
}
.item-table {
  min-width: 1200px;
}
.budget-summary {
  margin: 16px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}
.formula-input {
  :deep(.el-input__wrapper) {
    background-color: #f5f7fa;
  }
}
</style>

