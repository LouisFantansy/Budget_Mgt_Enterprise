<template>
  <div class="page-container">
    <div class="department-layout">
      <!-- 左侧：部门树 -->
      <div class="department-tree-panel">
        <div class="panel-header">
          <h3>部门结构</h3>
          <el-button type="primary" size="small" @click="handleAdd(null)">
            <el-icon><Plus /></el-icon>新增
          </el-button>
        </div>
        <el-input
          v-model="treeFilter"
          placeholder="搜索部门"
          clearable
          style="margin-bottom: 12px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-tree
          ref="treeRef"
          :data="departmentTree"
          :props="treeProps"
          node-key="id"
          highlight-current
          default-expand-all
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <span class="tree-node-label">
              <span>{{ node.label }}</span>
              <span class="tree-node-actions">
                <el-icon @click.stop="handleAdd(data)"><Plus /></el-icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 右侧：部门详情/编辑 -->
      <div class="department-detail-panel">
        <template v-if="selectedDepartment">
          <div class="detail-header">
            <h3>{{ isEditing ? '编辑部门' : '部门详情' }}</h3>
            <div>
              <el-button v-if="!isEditing" type="primary" size="small" @click="startEdit">编辑</el-button>
              <el-button v-if="isEditing" size="small" @click="cancelEdit">取消</el-button>
              <el-button v-if="isEditing" type="primary" size="small" :loading="submitLoading" @click="handleSaveEdit">保存</el-button>
              <el-button type="danger" size="small" @click="handleDelete">删除</el-button>
            </div>
          </div>

          <!-- 查看模式 -->
          <el-descriptions v-if="!isEditing" :column="2" border style="margin-top: 16px">
            <el-descriptions-item label="部门名称">{{ selectedDepartment.name }}</el-descriptions-item>
            <el-descriptions-item label="部门编码">{{ selectedDepartment.code }}</el-descriptions-item>
            <el-descriptions-item label="上级部门">
              {{ getParentName(selectedDepartment.parentId) || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedDepartment.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
                {{ selectedDepartment.status === 'ACTIVE' ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="预算金额">
              {{ formatMoney(selectedDepartment.budgetAmount || 0) }}
            </el-descriptions-item>
            <el-descriptions-item label="已用金额">
              {{ formatMoney(selectedDepartment.usedAmount || 0) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDateTime(selectedDepartment.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 编辑模式 -->
          <el-form v-if="isEditing" ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px" style="margin-top: 16px">
            <el-form-item label="部门名称" prop="name">
              <el-input v-model="editForm.name" placeholder="请输入部门名称" />
            </el-form-item>
            <el-form-item label="部门编码" prop="code">
              <el-input v-model="editForm.code" placeholder="请输入部门编码" />
            </el-form-item>
            <el-form-item label="上级部门" prop="parentId">
              <el-tree-select
                v-model="editForm.parentId"
                :data="departmentTree"
                placeholder="选择上级部门（留空为顶级）"
                clearable
                :props="{ label: 'name', value: 'id', children: 'children' } as any"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="editForm.status">
                <el-radio label="ACTIVE">启用</el-radio>
                <el-radio label="INACTIVE">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>

        <template v-else>
          <el-empty description="请在左侧选择一个部门" />
        </template>
      </div>
    </div>

    <!-- 新增部门弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增部门" width="600px" destroy-on-close>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="addForm.code" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="addForm.parentId"
            :data="departmentTree"
            placeholder="选择上级部门（留空为顶级）"
            clearable
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="addForm.status">
            <el-radio label="ACTIVE">启用</el-radio>
            <el-radio label="INACTIVE">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleAddSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as departmentApi from '@/api/modules/department'
import type { Department } from '@/types'
import { formatDateTime, formatMoney } from '@/utils/format'

// ===================== 状态 =====================
const loading = ref(false)
const departmentTree = ref<Department[]>([])
const selectedDepartment = ref<Department | null>(null)
const isEditing = ref(false)
const submitLoading = ref(false)
const addLoading = ref(false)

const treeRef = ref()
const treeFilter = ref('')
const treeProps = {
  label: 'name',
  children: 'children',
}

// 编辑表单
const editFormRef = ref<FormInstance>()
const editForm = reactive({
  id: 0,
  name: '',
  code: '',
  parentId: null as number | null,
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
})

const editRules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
}

// 新增弹窗
const addDialogVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  name: '',
  code: '',
  parentId: null as number | null,
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
})

const addRules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
}

// ===================== 方法 =====================

// 获取部门树
async function fetchDepartmentTree() {
  loading.value = true
  try {
    const res = await departmentApi.getDepartmentTree()
    departmentTree.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取部门列表失败')
  } finally {
    loading.value = false
  }
}

// 树搜索过滤
function filterNode(value: string, data: any) {
  if (!value) return true
  return data.name.includes(value)
}

watch(treeFilter, (val) => {
  treeRef.value?.filter(val)
})

// 获取上级部门名称
function getParentName(parentId?: number) {
  if (!parentId) return ''
  return findDepartmentName(departmentTree.value, parentId)
}

function findDepartmentName(depts: Department[], id: number): string {
  for (const dept of depts) {
    if (dept.id === id) return dept.name
    if (dept.children) {
      const found = findDepartmentName(dept.children, id)
      if (found) return found
    }
  }
  return ''
}

// 选择部门
function handleNodeClick(data: Department) {
  selectedDepartment.value = data
  isEditing.value = false
}

// 开始编辑
function startEdit() {
  if (!selectedDepartment.value) return
  isEditing.value = true
  editForm.id = selectedDepartment.value.id
  editForm.name = selectedDepartment.value.name
  editForm.code = selectedDepartment.value.code
  editForm.parentId = selectedDepartment.value.parentId || null
  editForm.status = selectedDepartment.value.status
}

// 取消编辑
function cancelEdit() {
  isEditing.value = false
}

// 保存编辑
async function handleSaveEdit() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await departmentApi.updateDepartment(editForm.id, {
      name: editForm.name,
      code: editForm.code,
      parentId: editForm.parentId || undefined,
      status: editForm.status,
    })
    ElMessage.success('更新部门成功')
    isEditing.value = false
    fetchDepartmentTree()
  } catch (error: any) {
    ElMessage.error(error?.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

// 删除部门
async function handleDelete() {
  if (!selectedDepartment.value) return
  const dept = selectedDepartment.value

  if (dept.children && dept.children.length > 0) {
    ElMessage.warning('该部门下有子部门，不可删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除部门 "${dept.name}" 吗？此操作不可撤销。`,
      '确认删除',
      { type: 'warning' }
    )
    await departmentApi.deleteDepartment(dept.id)
    ElMessage.success('删除成功')
    selectedDepartment.value = null
    fetchDepartmentTree()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 新增部门
function handleAdd(parent: Department | null) {
  addForm.name = ''
  addForm.code = ''
  addForm.parentId = parent?.id || null
  addForm.status = 'ACTIVE'
  addDialogVisible.value = true
}

async function handleAddSubmit() {
  const valid = await addFormRef.value?.validate().catch(() => false)
  if (!valid) return

  addLoading.value = true
  try {
    await departmentApi.createDepartment({
      name: addForm.name,
      code: addForm.code,
      parentId: addForm.parentId || undefined,
      status: addForm.status,
    })
    ElMessage.success('创建部门成功')
    addDialogVisible.value = false
    fetchDepartmentTree()
  } catch (error: any) {
    ElMessage.error(error?.message || '创建失败')
  } finally {
    addLoading.value = false
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchDepartmentTree()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  height: calc(100vh - 60px);
}

.department-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.department-tree-panel {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
    }
  }
}

.tree-node-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 14px;

  .tree-node-actions {
    display: none;
    margin-left: 8px;

    .el-icon {
      margin-left: 4px;
      cursor: pointer;
      color: var(--el-color-primary);

      &:hover {
        color: var(--el-color-primary-dark-2);
      }
    }
  }

  &:hover .tree-node-actions {
    display: inline-flex;
  }
}

.department-detail-panel {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
    }
  }
}
</style>
