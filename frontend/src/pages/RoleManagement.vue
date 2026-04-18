<template>
  <div class="page-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增角色
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="filteredRoleList" border stripe style="margin-top: 16px">
      <el-table-column prop="name" label="角色名" min-width="140" />
      <el-table-column prop="displayName" label="显示名" min-width="140">
        <template #default="{ row }">
          {{ row.displayName || row.name }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="系统内置" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isSystem ? 'danger' : 'info'" size="small">
            {{ row.isSystem ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限数量" width="100">
        <template #default="{ row }">
          {{ row.permissions?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            type="danger"
            link
            size="small"
            :disabled="row.isSystem"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="700px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="角色名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名（英文标识）" />
        </el-form-item>
        <el-form-item label="显示名" prop="displayName">
          <el-input v-model="formData.displayName" placeholder="请输入显示名" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="权限分配" prop="permissionIds">
          <div class="permission-group" v-for="group in permissionGroups" :key="group.module">
            <div class="group-title">{{ group.label }}</div>
            <el-checkbox-group v-model="formData.permissionIds">
              <el-checkbox
                v-for="perm in group.permissions"
                :key="perm.id"
                :label="perm.id"
              >
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { get, post, put, del } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Role, Permission } from '@/types'

// ===================== 扩展 Role 类型 =====================
interface RoleItem extends Role {
  displayName?: string
  isSystem?: boolean
}

// ===================== 状态 =====================
const loading = ref(false)
const roleList = ref<RoleItem[]>([])
const allPermissions = ref<Permission[]>([])
const searchQuery = ref('')

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  id: 0,
  name: '',
  displayName: '',
  description: '',
  permissionIds: [] as number[],
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '角色名只能包含大写字母和下划线', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
}

// ===================== 权限分组 =====================
interface PermissionGroup {
  module: string
  label: string
  permissions: Permission[]
}

const permissionGroups = computed<PermissionGroup[]>(() => {
  const moduleMap: Record<string, string> = {
    budget: '预算管理',
    purchase: '采购管理',
    approval: '审批管理',
    report: '报表分析',
    system: '系统管理',
  }
  const groups: PermissionGroup[] = []
  
  for (const [module, label] of Object.entries(moduleMap)) {
    const perms = allPermissions.value.filter(p => p.resource === module)
    if (perms.length > 0) {
      groups.push({ module, label, permissions: perms })
    }
  }
  
  // 如果没有权限数据，生成默认分组
  if (allPermissions.value.length === 0) {
    for (const [module, label] of Object.entries(moduleMap)) {
      groups.push({
        module,
        label,
        permissions: [
          { id: 0, name: `${label}-查看`, code: `${module}:view`, resource: module, action: 'view' },
          { id: 0, name: `${label}-创建`, code: `${module}:create`, resource: module, action: 'create' },
          { id: 0, name: `${label}-编辑`, code: `${module}:edit`, resource: module, action: 'edit' },
          { id: 0, name: `${label}-删除`, code: `${module}:delete`, resource: module, action: 'delete' },
        ],
      })
    }
  }
  
  return groups
})

// 搜索过滤
const filteredRoleList = computed(() => {
  if (!searchQuery.value) return roleList.value
  const query = searchQuery.value.toLowerCase()
  return roleList.value.filter(
    r => r.name.toLowerCase().includes(query) || 
         (r.displayName && r.displayName.toLowerCase().includes(query)) ||
         (r.description && r.description.toLowerCase().includes(query))
  )
})

// ===================== 方法 =====================

async function fetchRoleList() {
  loading.value = true
  try {
    const res = await get<RoleItem[]>('/roles')
    roleList.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取角色列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchPermissionList() {
  try {
    const res = await get<Permission[]>('/permissions')
    allPermissions.value = res.data
  } catch {
    // 权限列表加载失败不影响页面显示
  }
}

function handleSearch() {
  // 前端过滤，无需请求
}

function handleAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: RoleItem) {
  isEdit.value = true
  resetForm()
  formData.id = row.id
  formData.name = row.name
  formData.displayName = row.displayName || row.name
  formData.description = row.description || ''
  formData.permissionIds = row.permissions?.map(p => p.id) || []
  dialogVisible.value = true
}

function resetForm() {
  formData.id = 0
  formData.name = ''
  formData.displayName = ''
  formData.description = ''
  formData.permissionIds = []
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const submitData = {
      name: formData.name,
      displayName: formData.displayName,
      description: formData.description,
      permissionIds: formData.permissionIds,
    }

    if (isEdit.value) {
      await put(`/roles/${formData.id}`, submitData)
      ElMessage.success('更新角色成功')
    } else {
      await post('/roles', submitData)
      ElMessage.success('创建角色成功')
    }
    dialogVisible.value = false
    fetchRoleList()
  } catch (error: any) {
    ElMessage.error(error?.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: RoleItem) {
  if (row.isSystem) {
    ElMessage.warning('系统内置角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.displayName || row.name}" 吗？此操作不可撤销。`,
      '确认删除',
      { type: 'warning' }
    )
    await del(`/roles/${row.id}`)
    ElMessage.success('删除成功')
    fetchRoleList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchRoleList()
  fetchPermissionList()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .toolbar-left {
    display: flex;
    gap: 12px;
  }
}

.permission-group {
  margin-bottom: 12px;
  width: 100%;

  .group-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }
}
</style>
