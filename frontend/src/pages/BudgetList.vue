<template>
  <div class="page-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索预算编号/名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="filterYear"
          type="year"
          placeholder="选择年度"
          clearable
          style="width: 120px"
          value-format="YYYY"
          @change="handleSearch"
        />
        <el-tree-select
          v-model="filterDepartmentId"
          :data="departmentTree"
          placeholder="选择部门"
          clearable
          :props="{ label: 'name' }"
          node-key="id"
          style="width: 180px"
          @change="handleSearch"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="草稿" value="DRAFT" />
          <el-option label="待审批" value="PENDING" />
          <el-option label="已审批" value="APPROVED" />
          <el-option label="已驳回" value="REJECTED" />
          <el-option label="已调整" value="ADJUSTED" />
          <el-option label="已关闭" value="CLOSED" />
        </el-select>
        <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 130px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="运营支出" value="OPEX" />
          <el-option label="资本支出" value="CAPEX" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button 
          v-if="canCreateBudget"
          type="primary" 
          @click="handleCreate"
        >
          <el-icon><Plus /></el-icon>新建预算
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table 
      v-loading="loading" 
      :data="budgetList" 
      border 
      stripe 
      style="margin-top: 16px"
      @row-click="handleRowClick"
    >
      <el-table-column prop="code" label="预算编号" min-width="140" />
      <el-table-column prop="name" label="预算名称" min-width="180" show-overflow-tooltip />
      <el-table-column label="部门" min-width="120">
        <template #default="{ row }">
          {{ row.department?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getBudgetTypeType(row.type) as any" size="small">
            {{ getBudgetTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="年度" width="80" align="center">
        <template #default="{ row }">
          {{ row.year }}
        </template>
      </el-table-column>
      <el-table-column label="总金额" width="140" align="right">
        <template #default="{ row }">
          <span class="amount-text">{{ formatMoney(row.totalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已使用" width="140" align="right">
        <template #default="{ row }">
          <span class="amount-text used">{{ formatMoney(row.usedAmount || 0) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="冻结中" width="140" align="right">
        <template #default="{ row }">
          <span class="amount-text frozen">{{ formatMoney(row.frozenAmount || 0) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可用金额" width="140" align="right">
        <template #default="{ row }">
          <span :class="['amount-text', 'available', getAvailableClass(row)]">
            {{ formatMoney(getAvailableAmount(row)) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getBudgetStatusType(row.status) as any" size="small">
            {{ getBudgetStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTimeShort(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click.stop="handleView(row)">查看</el-button>
          <el-button 
            v-if="canEdit(row)" 
            type="primary" 
            link 
            size="small" 
            @click.stop="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button 
            v-if="canSubmit(row)" 
            type="success" 
            link 
            size="small" 
            @click.stop="handleSubmit(row)"
          >
            提交审批
          </el-button>
          <el-button 
            v-if="canAdjust(row)" 
            type="warning" 
            link 
            size="small" 
            @click.stop="handleAdjust(row)"
          >
            调整
          </el-button>
          <el-button 
            v-if="canDelete(row)" 
            type="danger" 
            link 
            size="small" 
            @click.stop="handleDelete(row)"
          >
            删除
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { budgetApi } from '@/api/modules/budget'
import { getDepartmentTree } from '@/api/modules/department'
import type { Budget, Department } from '@/types'
import { formatMoney, formatDateTimeShort } from '@/utils/format'
import { BUDGET_STATUS_MAP, BUDGET_TYPE_MAP } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// ===================== 状态 =====================
const loading = ref(false)
const budgetList = ref<Budget[]>([])
const departmentTree = ref<Department[]>([])

// 筛选条件
const searchQuery = ref('')
const filterYear = ref<string>('')
const filterDepartmentId = ref<number | null>(null)
const filterStatus = ref<string>('')
const filterType = ref<string>('')

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// ===================== 计算属性 =====================

// 是否有创建预算权限
const canCreateBudget = computed(() => {
  return authStore.hasRole('SUPER_ADMIN') || 
         authStore.hasRole('BUDGET_ADMIN') || 
         authStore.hasRole('DEPT_ADMIN') ||
         authStore.hasPermission('budget', 'create')
})

// ===================== 方法 =====================

// 获取预算列表
async function fetchBudgetList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (filterYear.value) {
      params.year = parseInt(filterYear.value)
    }
    if (filterDepartmentId.value) {
      params.departmentId = filterDepartmentId.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (filterType.value) {
      params.type = filterType.value
    }
    
    const res = await budgetApi.getList(params)
    budgetList.value = res.data.items
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || '获取预算列表失败')
  } finally {
    loading.value = false
  }
}

// 获取部门树
async function fetchDepartmentTree() {
  try {
    const res = await getDepartmentTree()
    departmentTree.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取部门列表失败')
  }
}

// 获取状态标签
function getBudgetStatusType(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  return BUDGET_STATUS_MAP[status]?.type || 'info'
}

function getBudgetStatusLabel(status: string): string {
  return BUDGET_STATUS_MAP[status]?.label || status
}

// 获取类型标签
function getBudgetTypeType(type: string): '' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  return BUDGET_TYPE_MAP[type]?.type || 'info'
}

function getBudgetTypeLabel(type: string): string {
  return BUDGET_TYPE_MAP[type]?.label || type
}

// 计算可用金额
function getAvailableAmount(row: Budget): number {
  const total = row.totalAmount || 0
  const used = row.usedAmount || 0
  const frozen = row.frozenAmount || 0
  return total - used - frozen
}

// 获取可用金额样式类
function getAvailableClass(row: Budget): string {
  const available = getAvailableAmount(row)
  const total = row.totalAmount || 1
  const ratio = available / total
  if (ratio < 0.1) return 'danger'
  if (ratio < 0.3) return 'warning'
  return ''
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchBudgetList()
}

// 重置
function handleReset() {
  searchQuery.value = ''
  filterYear.value = ''
  filterDepartmentId.value = null
  filterStatus.value = ''
  filterType.value = ''
  pagination.page = 1
  fetchBudgetList()
}

// 分页
function handleSizeChange(size: number) {
  pagination.pageSize = size
  fetchBudgetList()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchBudgetList()
}

// 行点击
function handleRowClick(row: Budget) {
  router.push(`/budgets/${row.id}`)
}

// 查看详情
function handleView(row: Budget) {
  router.push(`/budgets/${row.id}`)
}

// 创建预算
function handleCreate() {
  router.push('/budgets/create')
}

// 编辑预算
function handleEdit(row: Budget) {
  router.push(`/budgets/${row.id}/edit`)
}

// 提交审批
async function handleSubmit(row: Budget) {
  try {
    await ElMessageBox.confirm(
      `确定要提交预算 "${row.name}" 进行审批吗？`,
      '确认提交审批',
      { type: 'warning' }
    )
    await budgetApi.submit(row.id)
    ElMessage.success('提交审批成功')
    fetchBudgetList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '提交审批失败')
    }
  }
}

// 调整预算
function handleAdjust(row: Budget) {
  router.push(`/budgets/${row.id}/adjust`)
}

// 删除预算
async function handleDelete(row: Budget) {
  try {
    await ElMessageBox.confirm(
      `确定要删除预算 "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      { type: 'warning' }
    )
    await budgetApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchBudgetList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 权限检查
function canEdit(row: Budget): boolean {
  return row.status === 'DRAFT' && (isOwner(row) || authStore.hasRole('SUPER_ADMIN'))
}

function canSubmit(row: Budget): boolean {
  return row.status === 'DRAFT' && (isOwner(row) || authStore.hasRole('SUPER_ADMIN'))
}

function canAdjust(row: Budget): boolean {
  return (row.status === 'APPROVED' || row.status === 'ACTIVE') && 
         (authStore.hasRole('SUPER_ADMIN') || authStore.hasRole('BUDGET_ADMIN'))
}

function canDelete(row: Budget): boolean {
  return row.status === 'DRAFT' && (isOwner(row) || authStore.hasRole('SUPER_ADMIN'))
}

function isOwner(row: Budget): boolean {
  return row.createdBy === authStore.user?.id
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchBudgetList()
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

.amount-text {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  
  &.used {
    color: #E6A23C;
  }
  
  &.frozen {
    color: #909399;
  }
  
  &.available {
    color: #67C23A;
    
    &.warning {
      color: #E6A23C;
    }
    
    &.danger {
      color: #F56C6C;
    }
  }
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
