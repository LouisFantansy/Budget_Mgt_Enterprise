<template>
  <div class="page-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名/姓名"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-tree-select
          v-model="filterDepartmentId"
          :data="departmentTree"
          placeholder="选择部门"
          clearable
          :props="{ label: 'name', value: 'id' } as any"
          style="width: 200px"
          @change="handleSearch"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px" @change="handleSearch">
          <el-option label="启用" value="ACTIVE" />
          <el-option label="禁用" value="INACTIVE" />
          <el-option label="锁定" value="LOCKED" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="userList" border stripe style="margin-top: 16px">
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="realName" label="姓名" min-width="100" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="手机" min-width="120" />
      <el-table-column label="部门" min-width="150">
        <template #default="{ row }">
          {{ row.department?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="角色" min-width="180">
        <template #default="{ row }">
          <el-tag v-for="role in row.roles" :key="role.id" size="small" style="margin-right: 4px; margin-bottom: 4px">
            {{ role.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status) as any" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后登录" min-width="160">
        <template #default="{ row }">
          {{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="primary" link size="small" @click="handleResetPassword(row)">重置密码</el-button>
          <el-button 
            :type="row.status === 'ACTIVE' ? 'danger' : 'success'" 
            link 
            size="small" 
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="formData.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-tree-select
            v-model="formData.departmentId"
            :data="departmentTree"
            placeholder="选择部门"
            clearable
            :props="{ label: 'name', value: 'id' } as any"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="formData.roleIds" multiple placeholder="选择角色" style="width: 100%">
            <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="ACTIVE">启用</el-radio>
            <el-radio label="INACTIVE">禁用</el-radio>
          </el-radio-group>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as userApi from '@/api/modules/user'
import * as departmentApi from '@/api/modules/department'
import type { User, Department, Role } from '@/types'
import { formatDateTime } from '@/utils/format'

// ===================== 状态 =====================
const loading = ref(false)
const userList = ref<User[]>([])
const departmentTree = ref<Department[]>([])
const roleList = ref<Role[]>([
  { id: 1, name: '超级管理员', code: 'SUPER_ADMIN', permissions: [], createdAt: '' },
  { id: 2, name: '系统管理员', code: 'SYSTEM_ADMIN', permissions: [], createdAt: '' },
  { id: 3, name: '预算管理员', code: 'BUDGET_ADMIN', permissions: [], createdAt: '' },
  { id: 4, name: '部门管理员', code: 'DEPT_ADMIN', permissions: [], createdAt: '' },
  { id: 5, name: '预算用户', code: 'BUDGET_USER', permissions: [], createdAt: '' },
  { id: 6, name: '查看者', code: 'VIEWER', permissions: [], createdAt: '' },
])

// 筛选条件
const searchQuery = ref('')
const filterDepartmentId = ref<number | null>(null)
const filterStatus = ref<string>('')

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  id: 0,
  username: '',
  realName: '',
  password: '',
  email: '',
  phone: '',
  departmentId: undefined as number | undefined,
  roleIds: [] as number[],
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'LOCKED',
})

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [
    { required: !isEdit.value, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
}

// ===================== 方法 =====================

// 获取用户列表
async function fetchUserList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (filterDepartmentId.value) {
      params.departmentId = filterDepartmentId.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    
    const res = await userApi.getUserList(params)
    userList.value = res.data.items
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取部门树
async function fetchDepartmentTree() {
  try {
    const res = await departmentApi.getDepartmentTree()
    departmentTree.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取部门列表失败')
  }
}

// 状态标签
function getStatusType(status: string) {
  const typeMap: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'danger',
    LOCKED: 'warning',
  }
  return typeMap[status] || 'info'
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    ACTIVE: '启用',
    INACTIVE: '禁用',
    LOCKED: '锁定',
  }
  return labelMap[status] || status
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchUserList()
}

// 重置
function handleReset() {
  searchQuery.value = ''
  filterDepartmentId.value = null
  filterStatus.value = ''
  pagination.page = 1
  fetchUserList()
}

// 分页
function handleSizeChange(size: number) {
  pagination.pageSize = size
  fetchUserList()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchUserList()
}

// 新增
function handleAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row: User) {
  isEdit.value = true
  resetForm()
  formData.id = row.id
  formData.username = row.username
  formData.realName = row.realName
  formData.email = row.email
  formData.phone = row.phone || ''
  formData.departmentId = row.departmentId
  formData.roleIds = row.roles?.map(r => r.id) || []
  formData.status = row.status
  dialogVisible.value = true
}

// 重置表单
function resetForm() {
  formData.id = 0
  formData.username = ''
  formData.realName = ''
  formData.password = ''
  formData.email = ''
  formData.phone = ''
  formData.departmentId = undefined
  formData.roleIds = []
  formData.status = 'ACTIVE'
  formRef.value?.resetFields()
}

// 提交
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await userApi.updateUser(formData.id, {
        realName: formData.realName,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId,
        status: formData.status,
      })
      // 更新角色
      if (formData.roleIds.length > 0) {
        await userApi.assignRoles(formData.id, formData.roleIds)
      }
      ElMessage.success('更新用户成功')
    } else {
      await userApi.createUser({
        username: formData.username,
        realName: formData.realName,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId!,
        roleIds: formData.roleIds,
        status: formData.status,
      })
      ElMessage.success('创建用户成功')
    }
    dialogVisible.value = false
    fetchUserList()
  } catch (error: any) {
    ElMessage.error(error?.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    submitLoading.value = false
  }
}

// 重置密码
async function handleResetPassword(row: User) {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${row.realName || row.username}" 的密码吗？`,
      '确认重置密码',
      { type: 'warning' }
    )
    const newPassword = '123456' // 默认密码
    await userApi.resetPassword(row.id, newPassword)
    ElMessage.success(`密码已重置为: ${newPassword}`)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '重置密码失败')
    }
  }
}

// 切换状态
async function handleToggleStatus(row: User) {
  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const actionText = newStatus === 'ACTIVE' ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}用户 "${row.realName || row.username}" 吗？`,
      `确认${actionText}`,
      { type: 'warning' }
    )
    await userApi.updateUser(row.id, { status: newStatus })
    ElMessage.success(`${actionText}成功`)
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchUserList()
  fetchDepartmentTree()
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
    flex-wrap: wrap;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
