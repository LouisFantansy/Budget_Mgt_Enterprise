<template>
  <div class="page-container">
    <div class="page-header">
      <h2>专题需求收集</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建需求表
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="requirements" v-loading="loading" stripe>
        <el-table-column prop="template_name" label="模板" min-width="160" />
        <el-table-column prop="department_name" label="部门" width="140" />
        <el-table-column prop="year" label="年度" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="filled_by_name" label="填写人" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'DRAFT'" link type="success" @click="handleSubmit(row)">提交</el-button>
            <el-button v-if="row.status === 'SUBMITTED' && authStore.isFirstBudgetAdmin" link type="warning" @click="handleApprove(row)">审批</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑需求表' : '新建需求表'"
      width="700px"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求模板" prop="templateId">
              <el-select v-model="form.templateId" placeholder="选择模板" @change="onTemplateChange" filterable>
                <el-option
                  v-for="t in templates"
                  :key="t.id"
                  :label="t.name"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门" prop="departmentId">
              <el-select v-model="form.departmentId" placeholder="选择部门" filterable>
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年度" prop="year">
              <el-input-number v-model="form.year" :min="2024" :max="2030" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联预算">
              <el-select v-model="form.linkedBudgetId" placeholder="选择关联预算（可选）" filterable clearable>
                <el-option
                  v-for="b in budgets"
                  :key="b.id"
                  :label="`${b.budgetNo || b.id} - ${b.department?.name || ''}`"
                  :value="b.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <div class="section-title">表单数据</div>
        <el-form-item
          v-for="field in templateFields"
          :key="field.fieldCode"
          :label="field.fieldName"
          :required="field.isRequired"
        >
          <el-input
            v-if="field.fieldType === 'TEXT'"
            v-model="form.formData[field.fieldCode]"
            :placeholder="field.fieldName"
          />
          <el-input-number
            v-else-if="field.fieldType === 'NUMBER'"
            v-model="form.formData[field.fieldCode]"
            :controls="false"
            style="width: 100%"
          />
          <el-select
            v-else-if="field.fieldType === 'SELECT'"
            v-model="form.formData[field.fieldCode]"
            style="width: 100%"
            filterable
            allow-create
          >
            <el-option
              v-for="opt in (field.options || [])"
              :key="opt.optionValue"
              :label="opt.optionLabel"
              :value="opt.optionValue"
            />
          </el-select>
          <el-date-picker
            v-else-if="field.fieldType === 'DATE'"
            v-model="form.formData[field.fieldCode]"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
          <el-switch
            v-else-if="field.fieldType === 'BOOLEAN'"
            v-model="form.formData[field.fieldCode]"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { specialRequirementApi } from '@/api/modules/specialRequirement'
import { budgetTemplateApi } from '@/api/modules/budgetTemplate'
import { getDepartmentList } from '@/api/modules/department'
import { budgetApi } from '@/api/modules/budget'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const requirements = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const formRef = ref()

const templates = ref<any[]>([])
const departments = ref<any[]>([])
const budgets = ref<any[]>([])
const templateFields = ref<any[]>([])

const form = ref({
  templateId: '',
  departmentId: '',
  year: new Date().getFullYear(),
  linkedBudgetId: '',
  formData: {} as Record<string, any>
})

const formRules = {
  templateId: [{ required: true, message: '请选择模板', trigger: 'change' }],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }]
}

async function loadRequirements() {
  loading.value = true
  try {
    const res = await specialRequirementApi.getRequirements()
    const inner = (res as any).data?.data || (res as any).data
    const data = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
    requirements.value = data.map((r: any) => ({
      ...r,
      template_name: r.template_name || r.templateName,
      department_name: r.department_name || r.departmentName,
      filled_by_name: r.filled_by_name || r.filledByName,
      created_at: r.created_at || r.createdAt
    }))
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
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

async function loadDepartments() {
  try {
    const res = await getDepartmentList({ type: 'SECOND' })
    const inner = (res as any).data?.data || (res as any).data
    departments.value = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
  } catch (error) {
    console.error('加载部门失败', error)
  }
}

async function loadBudgets() {
  try {
    const res = await budgetApi.getList({ pageSize: 100 })
    const inner = (res as any).data?.data || (res as any).data
    budgets.value = inner?.data?.items || inner?.data?.results || inner?.items || inner?.results || inner?.data || inner || []
  } catch (error) {
    console.error('加载预算失败', error)
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
  } catch (error) {
    console.error('加载模板字段失败', error)
  }
}

function handleCreate() {
  isEdit.value = false
  currentId.value = ''
  form.value = {
    templateId: '',
    departmentId: '',
    year: new Date().getFullYear(),
    linkedBudgetId: '',
    formData: {}
  }
  templateFields.value = []
  dialogVisible.value = true
}

async function handleEdit(row: any) {
  isEdit.value = true
  currentId.value = row.id
  try {
    const res = await specialRequirementApi.getRequirement(row.id)
    const data = (res as any).data || {}
    form.value = {
      templateId: data.templateId || data.template_id || '',
      departmentId: data.departmentId || data.department_id || '',
      year: data.year || new Date().getFullYear(),
      linkedBudgetId: data.linkedBudgetId || data.linked_budget_id || '',
      formData: data.formData || data.form_data || {}
    }
    await onTemplateChange(form.value.templateId)
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload: any = {
      template_id: form.value.templateId,
      department_id: form.value.departmentId,
      year: form.value.year,
      linked_budget_id: form.value.linkedBudgetId || null,
      form_data: form.value.formData
    }
    if (isEdit.value) {
      await specialRequirementApi.updateRequirement(currentId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await specialRequirementApi.createRequirement(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadRequirements()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleSubmit(row: any) {
  try {
    await specialRequirementApi.submitRequirement(row.id)
    ElMessage.success('提交成功')
    loadRequirements()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

async function handleApprove(row: any) {
  try {
    const action = await ElMessageBox.confirm('请选择审批结果', '审批', {
      confirmButtonText: '通过',
      cancelButtonText: '驳回',
      distinguishCancelAndClose: true,
      type: 'warning'
    }).then(() => 'APPROVE').catch((action) => action === 'cancel' ? 'REJECT' : null)

    if (!action) return
    await specialRequirementApi.approveRequirement(row.id, action as 'APPROVE' | 'REJECT')
    ElMessage.success(action === 'APPROVE' ? '审批通过' : '已驳回')
    loadRequirements()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('操作失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确认删除该需求表？', '提示', { type: 'warning' })
    await specialRequirementApi.deleteRequirement(row.id)
    ElMessage.success('删除成功')
    loadRequirements()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

function statusType(status: string): 'info' | 'warning' | 'success' | 'danger' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    DRAFT: 'info',
    SUBMITTED: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    APPROVED: '已通过',
    REJECTED: '已驳回'
  }
  return map[status] || status
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
  loadRequirements()
  loadTemplates()
  loadDepartments()
  loadBudgets()
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
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}
</style>
