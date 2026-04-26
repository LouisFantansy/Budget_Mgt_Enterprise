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
          <div class="stat-icon" style="background: #67C23A20; color: #67C23A">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">预算数量</div>
            <div class="stat-value count">{{ summaryData.budgetCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #E6A23C20; color: #E6A23C">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待审批</div>
            <div class="stat-value pending">{{ summaryData.pendingCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #90939920; color: #909399">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">版本数量</div>
            <div class="stat-value version">{{ summaryData.versionCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">来源分布</span>
          </template>
          <v-chart class="chart" :option="sourceChartOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">OPEX / CAPEX 分布</span>
          </template>
          <v-chart class="chart" :option="typeChartOption" autoresize />
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
        <el-table-column label="预算总额" width="160" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatMoney(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="OPEX" width="160" align="right">
          <template #default="{ row }">
            <span class="amount-text opex">{{ formatMoney(row.opexAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="CAPEX" width="160" align="right">
          <template #default="{ row }">
            <span class="amount-text capex">{{ formatMoney(row.capexAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="getDeptPercent(row)"
              :stroke-width="8"
              :status="getDeptPercent(row) > 50 ? 'exception' : ''"
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
import { Money, Document, Clock, Collection } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { reportApi } from '@/api/modules/report'
import { budgetApi } from '@/api/modules/budget'
import { formatMoney } from '@/utils/format'

use([CanvasRenderer, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

// ===================== 状态 =====================
const loading = ref(false)
const selectedYear = ref<string>(new Date().getFullYear().toString())

const summaryData = reactive({
  totalBudget: 0,
  budgetCount: 0,
  pendingCount: 0,
  versionCount: 0,
})

const sourceDistribution = ref<{ source: string; amount: number }[]>([])
const categoryDistribution = ref<{ category: string; amount: number }[]>([])
const departmentSummary = ref<DepartmentSummary[]>([])

interface DepartmentSummary {
  departmentId: number
  departmentName: string
  budgetCount: number
  totalAmount: number
  opexAmount: number
  capexAmount: number
}

// 来源分布图表
const sourceChartOption = computed(() => {
  const sourceMap: Record<string, string> = {
    SELF_COMPILED: 'SS自编',
    GROUP_ALLOCATION: '集团分摊',
    SS_PUBLIC: 'SS Public',
  }
  const data = sourceDistribution.value.map(s => ({
    name: sourceMap[s.source] || s.source,
    value: s.amount,
  }))
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}<br/>金额: ${formatMoney(params.value)}<br/>占比: ${params.percent}%`,
    },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '预算来源',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c} ({d}%)' },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
    }],
  }
})

// 类型分布图表
const typeChartOption = computed(() => {
  const data = categoryDistribution.value.map(c => ({
    name: c.category === 'OPEX' ? '运营支出' : '资本支出',
    value: c.amount,
    itemStyle: { color: c.category === 'OPEX' ? '#409EFF' : '#67C23A' },
  }))
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}<br/>金额: ${formatMoney(params.value)}<br/>占比: ${params.percent}%`,
    },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '预算类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c} ({d}%)' },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
    }],
  }
})

// ===================== 方法 =====================
async function fetchSummaryData() {
  loading.value = true
  try {
    // 获取仪表盘数据
    const dashboardRes = await reportApi.getDashboard()
    const d = dashboardRes.data
    summaryData.totalBudget = d.overview?.totalBudget || 0
    summaryData.budgetCount = d.overview?.budgetCount || 0
    summaryData.pendingCount = d.overview?.pendingCount || 0
    summaryData.versionCount = d.overview?.versionCount || 0

    sourceDistribution.value = d.sourceDistribution || []
    categoryDistribution.value = d.categoryDistribution || []

    await fetchDepartmentSummary()
  } catch (error: any) {
    ElMessage.error(error?.message || '获取汇总数据失败')
    loadMockData()
  } finally {
    loading.value = false
  }
}

async function fetchDepartmentSummary() {
  try {
    const params = { year: parseInt(selectedYear.value) }
    const res = await reportApi.getBudgetSummary(params)
    if (res.data?.departments) {
      departmentSummary.value = res.data.departments.map((dept: any) => ({
        departmentId: dept.id,
        departmentName: dept.name,
        budgetCount: dept.budgetCount || 0,
        totalAmount: dept.totalAmount || 0,
        opexAmount: dept.opexAmount || 0,
        capexAmount: dept.capexAmount || 0,
      }))
    }
  } catch {
    loadMockDepartmentData()
  }
}

function loadMockData() {
  summaryData.totalBudget = 5000000
  summaryData.budgetCount = 25
  summaryData.pendingCount = 3
  summaryData.versionCount = 42
  sourceDistribution.value = [
    { source: 'SELF_COMPILED', amount: 2500000 },
    { source: 'GROUP_ALLOCATION', amount: 1500000 },
    { source: 'SS_PUBLIC', amount: 1000000 },
  ]
  categoryDistribution.value = [
    { category: 'OPEX', amount: 3000000 },
    { category: 'CAPEX', amount: 2000000 },
  ]
  loadMockDepartmentData()
}

function loadMockDepartmentData() {
  departmentSummary.value = [
    { departmentId: 1, departmentName: '技术部', budgetCount: 8, totalAmount: 2000000, opexAmount: 1200000, capexAmount: 800000 },
    { departmentId: 2, departmentName: '市场部', budgetCount: 6, totalAmount: 1500000, opexAmount: 1000000, capexAmount: 500000 },
    { departmentId: 3, departmentName: '销售部', budgetCount: 5, totalAmount: 1000000, opexAmount: 700000, capexAmount: 300000 },
    { departmentId: 4, departmentName: '人事部', budgetCount: 3, totalAmount: 300000, opexAmount: 250000, capexAmount: 50000 },
    { departmentId: 5, departmentName: '财务部', budgetCount: 4, totalAmount: 200000, opexAmount: 180000, capexAmount: 20000 },
  ]
}

function getDeptPercent(row: DepartmentSummary): number {
  if (!summaryData.totalBudget) return 0
  return Math.round((row.totalAmount / summaryData.totalBudget) * 100)
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

      &.count {
        color: #67C23A;
      }

      &.pending {
        color: #E6A23C;
      }

      &.version {
        color: #909399;
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

  &.opex {
    color: #409EFF;
  }

  &.capex {
    color: #67C23A;
  }
}
</style>
