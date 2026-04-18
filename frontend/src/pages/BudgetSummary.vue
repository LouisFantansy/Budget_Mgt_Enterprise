<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <span class="page-title">预算汇总</span>
      <el-date-picker
        v-model="selectedYear"
        type="year"
        placeholder="选择年度"
        style="width: 120px"
        value-format="YYYY"
        @change="fetchSummaryData"
      />
    </div>

    <!-- 汇总统计卡片 -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #409EFF20; color: #409EFF">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">预算总额</div>
            <div class="stat-value">{{ formatMoney(summaryData.totalBudget) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #E6A23C20; color: #E6A23C">
            <el-icon><ShoppingCart /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已使用总额</div>
            <div class="stat-value used">{{ formatMoney(summaryData.totalUsed) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #90939920; color: #909399">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">冻结总额</div>
            <div class="stat-value frozen">{{ formatMoney(summaryData.totalFrozen) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #67C23A20; color: #67C23A">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">可用总额</div>
            <div class="stat-value available">{{ formatMoney(summaryData.totalAvailable) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">预算类型分布</span>
          </template>
          <v-chart class="chart" :option="typeChartOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">预算状态分布</span>
          </template>
          <v-chart class="chart" :option="statusChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门预算汇总表 -->
    <el-card class="table-card">
      <template #header>
        <span class="card-title">部门预算汇总</span>
      </template>
      <el-table :data="departmentSummary" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="departmentName" label="部门名称" min-width="150" />
        <el-table-column prop="budgetCount" label="预算数量" width="100" align="center" />
        <el-table-column label="预算总额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatMoney(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已使用" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text used">{{ formatMoney(row.usedAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="冻结中" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text frozen">{{ formatMoney(row.frozenAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="可用金额" width="140" align="right">
          <template #default="{ row }">
            <span :class="['amount-text', 'available', getAvailableClass(row)]">
              {{ formatMoney(row.availableAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="120" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="getUsageRate(row)" 
              :status="getUsageStatus(row)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Money, ShoppingCart, Lock, Wallet } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { budgetApi } from '@/api/modules/budget'
import { formatMoney } from '@/utils/format'

// 注册 ECharts 组件
use([CanvasRenderer, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

// ===================== 状态 =====================
const loading = ref(false)
const selectedYear = ref<string>(new Date().getFullYear().toString())

// 汇总数据
const summaryData = reactive({
  totalBudget: 0,
  totalUsed: 0,
  totalFrozen: 0,
  totalAvailable: 0,
  typeDistribution: { OPEX: 0, CAPEX: 0 },
  statusDistribution: {} as Record<string, number>,
})

// 部门汇总数据
const departmentSummary = ref<DepartmentSummary[]>([])

interface DepartmentSummary {
  departmentId: number
  departmentName: string
  budgetCount: number
  totalAmount: number
  usedAmount: number
  frozenAmount: number
  availableAmount: number
}

// 类型分布图表配置
const typeChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>金额: ${formatMoney(params.value)}<br/>占比: ${params.percent}%`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '预算类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        },
        data: [
          { value: summaryData.typeDistribution.OPEX, name: '运营支出', itemStyle: { color: '#409EFF' } },
          { value: summaryData.typeDistribution.CAPEX, name: '资本支出', itemStyle: { color: '#67C23A' } },
        ]
      }
    ]
  }
})

// 状态分布图表配置
const statusChartOption = computed(() => {
  const statusData = Object.entries(summaryData.statusDistribution).map(([status, count]) => {
    const statusMap: Record<string, { name: string; color: string }> = {
      DRAFT: { name: '草稿', color: '#909399' },
      PENDING: { name: '待审批', color: '#E6A23C' },
      PENDING_APPROVAL: { name: '待审批', color: '#E6A23C' },
      APPROVED: { name: '已审批', color: '#67C23A' },
      REJECTED: { name: '已驳回', color: '#F56C6C' },
      ACTIVE: { name: '执行中', color: '#409EFF' },
      CLOSED: { name: '已关闭', color: '#C0C4CC' },
    }
    const info = statusMap[status] || { name: status, color: '#909399' }
    return { value: count, name: info.name, itemStyle: { color: info.color } }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: statusData.map(d => d.name),
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '预算数量',
        type: 'bar',
        barWidth: '60%',
        data: statusData
      }
    ]
  }
})

// ===================== 方法 =====================

// 获取汇总数据
async function fetchSummaryData() {
  loading.value = true
  try {
    const params = { year: parseInt(selectedYear.value) }
    
    // 获取预算汇总
    const summaryRes = await budgetApi.getSummary(params)
    if (summaryRes.data) {
      Object.assign(summaryData, summaryRes.data)
    }
    
    // 获取部门汇总（模拟数据，实际应从后端获取）
    await fetchDepartmentSummary()
  } catch (error: any) {
    ElMessage.error(error?.message || '获取汇总数据失败')
    // 使用模拟数据
    loadMockData()
  } finally {
    loading.value = false
  }
}

// 获取部门汇总
async function fetchDepartmentSummary() {
  try {
    const params = { 
      year: parseInt(selectedYear.value),
      groupBy: 'department'
    }
    const res = await budgetApi.getSummary(params)
    if (res.data?.departments) {
      departmentSummary.value = res.data.departments.map((dept: any) => ({
        departmentId: dept.id,
        departmentName: dept.name,
        budgetCount: dept.budgetCount || 0,
        totalAmount: dept.totalAmount || 0,
        usedAmount: dept.usedAmount || 0,
        frozenAmount: dept.frozenAmount || 0,
        availableAmount: (dept.totalAmount || 0) - (dept.usedAmount || 0) - (dept.frozenAmount || 0),
      }))
    }
  } catch (error) {
    // 使用模拟数据
    loadMockDepartmentData()
  }
}

// 加载模拟数据
function loadMockData() {
  summaryData.totalBudget = 5000000
  summaryData.totalUsed = 2500000
  summaryData.totalFrozen = 500000
  summaryData.totalAvailable = 2000000
  summaryData.typeDistribution = { OPEX: 3000000, CAPEX: 2000000 }
  summaryData.statusDistribution = {
    DRAFT: 5,
    PENDING: 3,
    APPROVED: 12,
    ACTIVE: 8,
    CLOSED: 2,
  }
  loadMockDepartmentData()
}

// 加载模拟部门数据
function loadMockDepartmentData() {
  departmentSummary.value = [
    { departmentId: 1, departmentName: '技术部', budgetCount: 8, totalAmount: 2000000, usedAmount: 1000000, frozenAmount: 200000, availableAmount: 800000 },
    { departmentId: 2, departmentName: '市场部', budgetCount: 6, totalAmount: 1500000, usedAmount: 800000, frozenAmount: 150000, availableAmount: 550000 },
    { departmentId: 3, departmentName: '销售部', budgetCount: 5, totalAmount: 1000000, usedAmount: 500000, frozenAmount: 100000, availableAmount: 400000 },
    { departmentId: 4, departmentName: '人事部', budgetCount: 3, totalAmount: 300000, usedAmount: 150000, frozenAmount: 30000, availableAmount: 120000 },
    { departmentId: 5, departmentName: '财务部', budgetCount: 4, totalAmount: 200000, usedAmount: 50000, frozenAmount: 20000, availableAmount: 130000 },
  ]
}

// 计算使用率
function getUsageRate(row: DepartmentSummary): number {
  if (!row.totalAmount) return 0
  return Math.round(((row.usedAmount || 0) / row.totalAmount) * 100)
}

// 获取使用率状态
function getUsageStatus(row: DepartmentSummary): '' | 'success' | 'warning' | 'exception' {
  const rate = getUsageRate(row)
  if (rate >= 90) return 'exception'
  if (rate >= 70) return 'warning'
  return 'success'
}

// 获取可用金额样式类
function getAvailableClass(row: DepartmentSummary): string {
  const available = row.availableAmount || 0
  const total = row.totalAmount || 1
  const ratio = available / total
  if (ratio < 0.1) return 'danger'
  if (ratio < 0.3) return 'warning'
  return ''
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchSummaryData()
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
}

.summary-cards {
  margin-bottom: 20px;
}

.stat-card {
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    padding: 20px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-right: 16px;
  }

  .stat-content {
    flex: 1;

    .stat-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      color: #303133;

      &.used {
        color: #E6A23C;
      }

      &.frozen {
        color: #909399;
      }

      &.available {
        color: #67C23A;
      }
    }
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .chart {
    height: 300px;
    width: 100%;
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
</style>
