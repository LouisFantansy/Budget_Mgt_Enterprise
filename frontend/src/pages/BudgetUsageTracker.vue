<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <span class="page-title">预算使用追踪</span>
      <div class="header-filters">
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
        <el-date-picker
          v-model="filterYear"
          type="year"
          placeholder="选择年度"
          clearable
          style="width: 120px"
          value-format="YYYY"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 使用率概览 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-title">整体使用率</div>
          <div class="progress-circle">
            <el-progress
              type="dashboard"
              :percentage="overallUsageRate"
              :color="usageColors"
              :stroke-width="10"
            />
          </div>
          <div class="overview-stats">
            <div class="stat-item">
              <span class="stat-label">总预算</span>
              <span class="stat-value">{{ formatMoney(overallStats.totalBudget) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已使用</span>
              <span class="stat-value used">{{ formatMoney(overallStats.totalUsed) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="warning-card" shadow="hover">
          <template #header>
            <div class="warning-header">
              <span class="card-title">预警概览</span>
              <el-tag v-if="warningCount > 0" type="danger">{{ warningCount }} 项预警</el-tag>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="8">
              <div class="warning-stat danger">
                <div class="warning-icon">
                  <el-icon><WarningFilled /></el-icon>
                </div>
                <div class="warning-info">
                  <div class="warning-count">{{ overBudgetCount }}</div>
                  <div class="warning-label">超预算 (>100%)</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="warning-stat warning">
                <div class="warning-icon">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="warning-info">
                  <div class="warning-count">{{ highUsageCount }}</div>
                  <div class="warning-label">高使用率 (80%-100%)</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="warning-stat success">
                <div class="warning-icon">
                  <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="warning-info">
                  <div class="warning-count">{{ normalCount }}</div>
                  <div class="warning-label">正常 (<80%)</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预算使用明细表 -->
    <el-card class="table-card">
      <template #header>
        <span class="card-title">预算使用明细</span>
      </template>
      <el-table 
        :data="usageList" 
        border 
        stripe 
        v-loading="loading"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="预算编号" min-width="140" />
        <el-table-column prop="name" label="预算名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="部门" min-width="120">
          <template #default="{ row }">
            {{ row.department?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="年度" width="80" align="center">
          <template #default="{ row }">
            {{ row.year }}
          </template>
        </el-table-column>
        <el-table-column label="总金额" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatMoney(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已使用" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-text used">{{ formatMoney(row.usedAmount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="冻结中" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-text frozen">{{ formatMoney(row.frozenAmount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="可用金额" width="130" align="right">
          <template #default="{ row }">
            <span :class="['amount-text', 'available', getAvailableClass(row)]">
              {{ formatMoney(getAvailableAmount(row)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="160" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="getUsageRate(row)" 
              :color="usageColors"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getBudgetStatusType(row.status) as any" size="small">
              {{ getBudgetStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, WarningFilled, Warning, CircleCheck } from '@element-plus/icons-vue'
import { budgetApi } from '@/api/modules/budget'
import { getDepartmentTree } from '@/api/modules/department'
import type { Budget, Department } from '@/types'
import { formatMoney } from '@/utils/format'
import { BUDGET_STATUS_MAP } from '@/utils/constants'

const router = useRouter()

// ===================== 状态 =====================
const loading = ref(false)
const usageList = ref<Budget[]>([])
const departmentTree = ref<Department[]>([])

// 筛选条件
const filterDepartmentId = ref<number | null>(null)
const filterYear = ref<string>('')

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 整体统计
const overallStats = reactive({
  totalBudget: 0,
  totalUsed: 0,
  totalFrozen: 0,
})

// 使用率颜色配置
const usageColors = [
  { color: '#67C23A', percentage: 60 },
  { color: '#E6A23C', percentage: 80 },
  { color: '#F56C6C', percentage: 100 },
]

// ===================== 计算属性 =====================

// 整体使用率
const overallUsageRate = computed(() => {
  if (!overallStats.totalBudget) return 0
  return Math.round((overallStats.totalUsed / overallStats.totalBudget) * 100)
})

// 超预算数量
const overBudgetCount = computed(() => {
  return usageList.value.filter(item => getUsageRate(item) > 100).length
})

// 高使用率数量
const highUsageCount = computed(() => {
  return usageList.value.filter(item => {
    const rate = getUsageRate(item)
    return rate >= 80 && rate <= 100
  }).length
})

// 正常数量
const normalCount = computed(() => {
  return usageList.value.filter(item => getUsageRate(item) < 80).length
})

// 预警数量
const warningCount = computed(() => overBudgetCount.value + highUsageCount.value)

// ===================== 方法 =====================

// 获取使用数据
async function fetchUsageData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filterDepartmentId.value) {
      params.departmentId = filterDepartmentId.value
    }
    if (filterYear.value) {
      params.year = parseInt(filterYear.value)
    }
    
    const res = await budgetApi.getUsage(params)
    usageList.value = res.data.items || []
    pagination.total = res.data.total || 0
    
    // 更新整体统计
    if (res.data.stats) {
      Object.assign(overallStats, res.data.stats)
    } else {
      // 从列表计算
      overallStats.totalBudget = usageList.value.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
      overallStats.totalUsed = usageList.value.reduce((sum, item) => sum + (item.usedAmount || 0), 0)
      overallStats.totalFrozen = usageList.value.reduce((sum, item) => sum + (item.frozenAmount || 0), 0)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取使用数据失败')
    // 使用模拟数据
    loadMockData()
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

// 加载模拟数据
function loadMockData() {
  const mockBudgets: Budget[] = [
    { id: 1, code: 'BG-2024-001', name: '技术部年度预算', department: { id: 1, name: '技术部', code: 'TECH', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 2000000, usedAmount: 1800000, frozenAmount: 100000, remainingAmount: 100000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 2, code: 'BG-2024-002', name: '市场部推广预算', department: { id: 2, name: '市场部', code: 'MKT', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 1500000, usedAmount: 1350000, frozenAmount: 50000, remainingAmount: 100000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 3, code: 'BG-2024-003', name: '销售部差旅预算', department: { id: 3, name: '销售部', code: 'SALES', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 500000, usedAmount: 520000, frozenAmount: 0, remainingAmount: -20000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 4, code: 'BG-2024-004', name: '人事部培训预算', department: { id: 4, name: '人事部', code: 'HR', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 300000, usedAmount: 150000, frozenAmount: 30000, remainingAmount: 120000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 5, code: 'BG-2024-005', name: '财务部系统预算', department: { id: 5, name: '财务部', code: 'FIN', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 200000, usedAmount: 50000, frozenAmount: 20000, remainingAmount: 130000, status: 'APPROVED', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 6, code: 'BG-2024-006', name: '行政部办公预算', department: { id: 6, name: '行政部', code: 'ADM', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 400000, usedAmount: 350000, frozenAmount: 20000, remainingAmount: 30000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 7, code: 'BG-2024-007', name: '研发设备采购', department: { id: 1, name: '技术部', code: 'TECH', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 800000, usedAmount: 750000, frozenAmount: 30000, remainingAmount: 20000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
    { id: 8, code: 'BG-2024-008', name: '年度团建预算', department: { id: 4, name: '人事部', code: 'HR', budgetAmount: 0, usedAmount: 0, status: 'ACTIVE', createdAt: '' }, year: 2024, totalAmount: 150000, usedAmount: 120000, frozenAmount: 0, remainingAmount: 30000, status: 'ACTIVE', items: [], createdBy: 1, createdAt: '', updatedAt: '' },
  ]
  usageList.value = mockBudgets
  pagination.total = usageList.value.length
  
  overallStats.totalBudget = usageList.value.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  overallStats.totalUsed = usageList.value.reduce((sum, item) => sum + (item.usedAmount || 0), 0)
  overallStats.totalFrozen = usageList.value.reduce((sum, item) => sum + (item.frozenAmount || 0), 0)
}

// 获取使用率
function getUsageRate(row: Budget): number {
  if (!row.totalAmount) return 0
  return Math.round(((row.usedAmount || 0) / row.totalAmount) * 100)
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

// 获取状态标签
function getBudgetStatusType(status?: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (!status) return 'info'
  return BUDGET_STATUS_MAP[status]?.type || 'info'
}

function getBudgetStatusLabel(status?: string): string {
  if (!status) return '-'
  return BUDGET_STATUS_MAP[status]?.label || status
}

// 获取行样式类
function getRowClassName({ row }: { row: Budget }): string {
  const rate = getUsageRate(row)
  if (rate > 100) return 'danger-row'
  if (rate >= 80) return 'warning-row'
  return ''
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchUsageData()
}

// 重置
function handleReset() {
  filterDepartmentId.value = null
  filterYear.value = ''
  pagination.page = 1
  fetchUsageData()
}

// 分页
function handleSizeChange(size: number) {
  pagination.pageSize = size
  fetchUsageData()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchUsageData()
}

// 查看详情
function handleView(row: Budget) {
  router.push(`/budgets/${row.id}`)
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchUsageData()
  fetchDepartmentTree()
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

  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .header-filters {
    display: flex;
    gap: 12px;
  }
}

.overview-row {
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
  height: 100%;

  .overview-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }

  .progress-circle {
    margin: 20px 0;
  }

  .overview-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #EBEEF5;

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .stat-label {
        font-size: 13px;
        color: #606266;
      }

      .stat-value {
        font-size: 16px;
        font-weight: 600;
        font-family: 'Courier New', monospace;
        color: #303133;

        &.used {
          color: #E6A23C;
        }
      }
    }
  }
}

.warning-card {
  height: 100%;

  .warning-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.warning-stat {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #F5F7FA;

  &.danger {
    background: #FEF0F0;
    .warning-icon { color: #F56C6C; }
    .warning-count { color: #F56C6C; }
  }

  &.warning {
    background: #FDF6EC;
    .warning-icon { color: #E6A23C; }
    .warning-count { color: #E6A23C; }
  }

  &.success {
    background: #F0F9EB;
    .warning-icon { color: #67C23A; }
    .warning-count { color: #67C23A; }
  }

  .warning-icon {
    font-size: 36px;
    margin-right: 16px;
  }

  .warning-info {
    .warning-count {
      font-size: 24px;
      font-weight: 600;
    }

    .warning-label {
      font-size: 13px;
      color: #606266;
    }
  }
}

.table-card {
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

:deep(.danger-row) {
  background-color: #FEF0F0 !important;
}

:deep(.warning-row) {
  background-color: #FDF6EC !important;
}
</style>
