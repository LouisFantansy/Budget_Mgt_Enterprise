<template>
  <div class="page-container">
    <div class="page-header">
      <h2>预算模板管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建模板
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="templates" v-loading="loading" stripe>
        <el-table-column prop="name" label="模板名称" min-width="200" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag :type="row.category === 'OPEX' ? 'success' : 'warning'">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年度" width="80" />
        <el-table-column prop="creator_name" label="创建人" width="120" />
        <el-table-column prop="field_count" label="字段数" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleClone(row)">克隆</el-button>
            <el-button link type="success" @click="handleTrigger(row)">下发任务</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="90vw"
      top="5vh"
      class="template-dialog"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="如：2026年OPEX自编预算模板" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算年度" prop="year">
              <el-input-number v-model="form.year" :min="2024" :max="2030" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算类别" prop="category">
              <el-radio-group v-model="form.category">
                <el-radio-button label="OPEX">OPEX</el-radio-button>
                <el-radio-button label="CAPEX">CAPEX</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="集团分摊">
              <el-switch v-model="form.is_group_allocation" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="模板说明">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="section-header">
        <span class="section-title">字段配置</span>
        <el-button type="primary" size="small" @click="handleAddField">
          <el-icon><Plus /></el-icon>添加字段
        </el-button>
      </div>

      <el-table :data="fieldList" border size="small" class="field-table" style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column prop="field_code" label="字段编码" width="140">
          <template #default="{ row }">
            <el-input v-model="row.field_code" size="small" :disabled="!!row.id" placeholder="英文编码" />
          </template>
        </el-table-column>
        <el-table-column prop="field_name" label="字段名称" width="140">
          <template #default="{ row }">
            <el-input v-model="row.field_name" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="field_type" label="类型" width="140">
          <template #default="{ row }">
            <el-select v-model="row.field_type" size="small" style="width: 100%">
              <el-option v-for="opt in FIELD_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="is_required" label="必填" width="70">
          <template #default="{ row }">
            <el-checkbox v-model="row.is_required" />
          </template>
        </el-table-column>
        <el-table-column prop="is_visible" label="可见" width="70">
          <template #default="{ row }">
            <el-checkbox v-model="row.is_visible" />
          </template>
        </el-table-column>
        <el-table-column prop="is_editable" label="可编辑" width="80">
          <template #default="{ row }">
            <el-checkbox v-model="row.is_editable" />
          </template>
        </el-table-column>
        <el-table-column prop="default_value" label="默认值" width="100">
          <template #default="{ row }">
            <el-input v-model="row.default_value" size="small" placeholder="-" />
          </template>
        </el-table-column>
        <el-table-column prop="width" label="宽度" width="80">
          <template #default="{ row }">
            <el-input v-model="row.width" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="formula" label="公式" width="150">
          <template #header>
            <span>公式</span>
            <el-tooltip placement="top">
              <template #content>
                <div style="max-width: 280px">
                  支持公式（简单表达式）：<br/>
                  • unit_price * quantity — 金额计算<br/>
                  • sum(month_amt_1~12) — 年度金额合计<br/>
                  • sum(month_qty_1~12) — 年度数量合计<br/>
                  使用其他字段编码作为变量名
                </div>
              </template>
              <el-icon style="margin-left: 4px; cursor: pointer"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <el-input v-model="row.formula" size="small" placeholder="公式" />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" align="center">
          <template #default="{ $index }">
            <el-button link size="small" :disabled="$index === 0" @click="moveField($index, -1)">↑</el-button>
            <el-button link size="small" :disabled="$index === fieldList.length - 1" @click="moveField($index, 1)">↓</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="removeField($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 下发任务对话框 -->
    <el-dialog v-model="triggerDialogVisible" title="下发编制任务" width="500px">
      <el-form label-width="100px">
        <el-form-item label="目标部门">
          <el-select v-model="triggerDeptIds" multiple placeholder="选择要下发的二级部门">
            <el-option
              v-for="dept in secondaryDepartments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="triggerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTrigger" :loading="triggering">确认下发</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { budgetTemplateApi } from '@/api/modules/budgetTemplate'
import type { BudgetTemplate, TemplateField } from '@/api/modules/budgetTemplate'
import { getDepartmentList } from '@/api/modules/department'

const loading = ref(false)
const saving = ref(false)
const triggering = ref(false)
const templates = ref<BudgetTemplate[]>([])
const dialogVisible = ref(false)
const triggerDialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const formRef = ref()
const triggerDeptIds = ref<string[]>([])
const secondaryDepartments = ref<any[]>([])
const currentTriggerTemplate = ref<BudgetTemplate | null>(null)
const originalFieldIds = ref<string[]>([])

const form = ref({
  name: '',
  year: new Date().getFullYear(),
  category: 'OPEX' as 'OPEX' | 'CAPEX',
  is_group_allocation: false,
  description: ''
})

const fieldList = ref<any[]>([])

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }]
}

const FIELD_TYPE_OPTIONS = [
  { value: 'TEXT', label: '文本输入' },
  { value: 'NUMBER', label: '数值输入' },
  { value: 'SELECT', label: '下拉选择' },
  { value: 'FORMULA', label: '公式计算' },
  { value: 'DATE', label: '日期选择' },
  { value: 'MONTH_QTY', label: '月度数量（1-12月）' },
  { value: 'MONTH_AMT', label: '月度金额（1-12月）' }
]

function fieldTypeLabel(type: string) {
  const found = FIELD_TYPE_OPTIONS.find(o => o.value === type)
  return found?.label || type
}

function statusType(status: string) {
  const map: Record<string, any> = {
    DRAFT: 'info',
    ACTIVE: 'success',
    ARCHIVED: ''
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    ACTIVE: '已启用',
    ARCHIVED: '已归档'
  }
  return map[status] || status
}

async function loadTemplates() {
  loading.value = true
  try {
    const res = await budgetTemplateApi.getTemplates()
    const inner = (res as any).data?.data || (res as any).data
    const data = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
    templates.value = data.map((t: any) => ({
      ...t,
      creator_name: t.creator_name || t.creatorName,
      field_count: t.field_count || t.fieldCount,
      created_at: t.created_at || t.createdAt
    }))
  } catch (error) {
    ElMessage.error('加载模板失败')
  } finally {
    loading.value = false
  }
}

async function loadDepartments() {
  try {
    const res = await getDepartmentList({ type: 'SECOND' })
    const inner = (res as any).data?.data || (res as any).data
    secondaryDepartments.value = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
  } catch (error) {
    console.error('加载部门失败', error)
  }
}

function handleCreate() {
  isEdit.value = false
  currentId.value = ''
  originalFieldIds.value = []
  form.value = {
    name: '',
    year: new Date().getFullYear(),
    category: 'OPEX',
    is_group_allocation: false,
    description: ''
  }
  fieldList.value = [
    { field_code: 'item_name', field_name: '项目名称', field_type: 'TEXT', is_required: true, is_visible: true, is_editable: true, width: '150', sort_order: 1 },
    { field_code: 'specification', field_name: '规格型号', field_type: 'TEXT', is_required: false, is_visible: true, is_editable: true, width: '150', sort_order: 2 },
    { field_code: 'supplier', field_name: '供应商', field_type: 'SELECT', is_required: false, is_visible: true, is_editable: true, width: '120', sort_order: 3 },
    { field_code: 'unit', field_name: '单位', field_type: 'SELECT', is_required: true, is_visible: true, is_editable: true, width: '80', sort_order: 4 },
    { field_code: 'quantity', field_name: '数量', field_type: 'NUMBER', is_required: true, is_visible: true, is_editable: true, width: '80', sort_order: 5 },
    { field_code: 'unit_price', field_name: '单价', field_type: 'NUMBER', is_required: true, is_visible: true, is_editable: true, width: '100', sort_order: 6 },
    { field_code: 'amount', field_name: '金额', field_type: 'FORMULA', is_required: false, is_visible: true, is_editable: false, width: '100', formula: 'unit_price * quantity', sort_order: 7 },
    { field_code: 'purpose', field_name: '用途说明', field_type: 'TEXT', is_required: false, is_visible: true, is_editable: true, width: '200', sort_order: 8 },
  ] as any[]
  // OPEX默认添加月度金额字段
  addMonthFields()
  dialogVisible.value = true
}

function addMonthFields() {
  const baseSort = fieldList.value.length
  for (let i = 1; i <= 12; i++) {
    fieldList.value.push({
      field_code: `month_amt_${i}`,
      field_name: `${i}月金额`,
      field_type: 'MONTH_AMT',
      is_required: false,
      is_visible: true,
      is_editable: true,
      width: '90',
      sort_order: baseSort + i
    })
  }
  // 年度合计公式字段
  fieldList.value.push({
    field_code: 'year_total',
    field_name: '年度合计',
    field_type: 'FORMULA',
    is_required: false,
    is_visible: true,
    is_editable: false,
    width: '120',
    formula: 'sum(month_amt_1~12)',
    sort_order: baseSort + 13
  })
}

async function handleEdit(row: BudgetTemplate) {
  isEdit.value = true
  currentId.value = row.id
  try {
    const res = await budgetTemplateApi.getTemplate(row.id)
    const inner = (res as any).data?.data || (res as any).data || {}
    const data = inner.data || inner
    form.value = {
      name: data.name || '',
      year: data.year || new Date().getFullYear(),
      category: data.category || 'OPEX',
      is_group_allocation: data.is_group_allocation || false,
      description: data.description || ''
    }
    const fields = data.fields || []
    originalFieldIds.value = fields.map((f: any) => f.id).filter(Boolean)
    fieldList.value = fields.map((f: any, idx: number) => ({
      id: f.id,
      field_code: f.field_code,
      field_name: f.field_name,
      field_type: f.field_type,
      is_required: f.is_required,
      is_visible: f.is_visible,
      is_editable: f.is_editable,
      width: f.width || '120',
      formula: f.formula || '',
      default_value: f.default_value || '',
      sort_order: f.sort_order ?? idx + 1
    })) as any[]
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载模板详情失败')
  }
}

function handleAddField() {
  // 检查编码是否重复
  const newCode = `field_${fieldList.value.length + 1}`
  const exists = fieldList.value.some(f => f.field_code === newCode)
  fieldList.value.push({
    field_code: exists ? `field_${Date.now()}` : newCode,
    field_name: '新字段',
    field_type: 'TEXT',
    is_required: false,
    is_visible: true,
    is_editable: true,
    width: '120',
    sort_order: fieldList.value.length + 1
  })
}

function removeField(index: number) {
  fieldList.value.splice(index, 1)
}

function moveField(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= fieldList.value.length) return
  const temp = fieldList.value[index]
  fieldList.value[index] = fieldList.value[newIndex]
  fieldList.value[newIndex] = temp
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 字段编码重复校验
  const codes = fieldList.value.map(f => f.field_code)
  const duplicates = codes.filter((item, index) => codes.indexOf(item) !== index)
  if (duplicates.length > 0) {
    ElMessage.error(`字段编码重复: ${[...new Set(duplicates)].join(', ')}`)
    return
  }

  // 字段编码空值校验
  const emptyCode = fieldList.value.find(f => !f.field_code?.trim())
  if (emptyCode) {
    ElMessage.error('存在字段编码为空的字段，请填写')
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      fields: fieldList.value.map((f, idx) => ({
        ...f,
        sort_order: idx + 1
      }))
    }
    if (isEdit.value) {
      await budgetTemplateApi.updateTemplate(currentId.value, payload)
      // 后端update不处理字段，需要逐个调用字段API
      await syncFields(currentId.value)
      ElMessage.success('更新成功')
    } else {
      const res = await budgetTemplateApi.createTemplate(payload)
      const newId = (res as any).data?.id || (res as any).data?.data?.id
      if (newId) {
        await syncFields(newId)
      }
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadTemplates()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function syncFields(templateId: string) {
  const currentIds = fieldList.value.map(f => f.id).filter(Boolean)
  const deletedIds = originalFieldIds.value.filter(id => !currentIds.includes(id))

  // 先删除已移除的字段
  for (const fieldId of deletedIds) {
    await budgetTemplateApi.deleteField(templateId, fieldId)
  }

  // 再更新/新增字段
  for (const field of fieldList.value) {
    if (field.id) {
      await budgetTemplateApi.updateField(templateId, field.id, field)
    } else {
      await budgetTemplateApi.addField(templateId, field)
    }
  }
}

async function handleClone(row: BudgetTemplate) {
  try {
    await budgetTemplateApi.cloneTemplate(row.id)
    ElMessage.success('克隆成功')
    loadTemplates()
  } catch (error) {
    ElMessage.error('克隆失败')
  }
}

function handleTrigger(row: BudgetTemplate) {
  currentTriggerTemplate.value = row
  triggerDeptIds.value = []
  triggerDialogVisible.value = true
  loadDepartments()
}

async function confirmTrigger() {
  if (!triggerDeptIds.value.length) {
    ElMessage.warning('请选择目标部门')
    return
  }
  triggering.value = true
  try {
    await budgetTemplateApi.triggerTask(currentTriggerTemplate.value!.id, {
      department_ids: triggerDeptIds.value
    })
    ElMessage.success('任务下发成功')
    triggerDialogVisible.value = false
    loadTemplates()
  } catch (error) {
    ElMessage.error('下发失败')
  } finally {
    triggering.value = false
  }
}

async function handleDelete(row: BudgetTemplate) {
  try {
    await ElMessageBox.confirm('确认删除该模板？', '提示', { type: 'warning' })
    await budgetTemplateApi.deleteTemplate(row.id)
    ElMessage.success('删除成功')
    loadTemplates()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
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

onMounted(() => {
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
.table-card {
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
.field-table {
  margin-bottom: 12px;
}

:deep(.template-dialog .el-dialog__body) {
  max-height: 80vh;
  overflow-y: auto;
  padding-top: 10px;
}

:deep(.template-dialog .el-dialog__header) {
  padding-bottom: 12px;
  margin-right: 0;
}
</style>
