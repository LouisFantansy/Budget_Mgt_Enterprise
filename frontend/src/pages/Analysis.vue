<template>
  <div class="page-container">
    <div class="page-header">
      <h2>报表分析</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-date-picker
          v-model="filterYear"
          type="year"
          placeholder="选择年度"
          style="width: 140px"
          value-format="YYYY"
          @change="fetchData"
        />
        <el-select v-model="filterSource" placeholder="来源筛选" clearable style="width: 160px" @change="fetchData">
          <el-option label="SS自编" value="SELF_COMPILED" />
          <el-option label="集团分摊" value="GROUP_ALLOCATION" />
          <el-option label="SS Public" value="SS_PUBLIC" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="类型筛选" clearable style="width: 140px" @change="fetchData">
          <el-option label="OPEX" value="OPEX" />
          <el-option label="CAPEX" value="CAPEX" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>导出报表
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">预算总额</div>
          <div class="stat-value">{{ formatMoney(overview.totalBudget) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-count">
          <div class="stat-label">预算数量</div>
          <div class="stat-value">{{ overview.budgetCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-pending">
          <div class="stat-label">待审批</div>
          <div class="stat-value">{{ overview.pendingCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-version">
          <div class="stat-label">版本数量</div>
          <div class="stat-value">{{ overview.versionCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card header="来源分布" shadow="never">
          <v-chart :option="sourceOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="OPEX / CAPEX 分布" shadow="never">
          <v-chart :option="categoryOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card header="部门排名 (Top 10)" shadow="never">
          <v-chart :option="deptRankingOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="月度趋势" shadow="never">
          <v-chart :option="monthlyTrendOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { reportApi } from '@/api/modules/report'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

// ===================== 状态 =====================
const filterYear = ref(dayjs().format('YYYY'))
const filterSource = ref<string>('')
const filterCategory = ref<string>('')
const loading = ref(false)

const overview = reactive({
  totalBudget: 0,
  budgetCount: 0,
  pendingCount: 0,
  versionCount: 0,
})

const sourceDistribution = ref<{ source: string; amount: number }[]>([])
const categoryDistribution = ref<{ category: string; amount: number }[]>([])
const deptRanking = ref<{ name: string; amount: number }[]>([])
const monthlyTrend = ref<{ months: string[]; budgets: number[] }>({ months: [], budgets: [] })

// 来源分布
const sourceOption = computed(() => {
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
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
    }],
  }
})

// 类别分布
const categoryOption = computed(() => {
  const catMap: Record<string, string> = {
    OPEX: '运营支出',
    CAPEX: '资本支出',
  }
  const data = categoryDistribution.value.map(c => ({
    name: catMap[c.category] || c.category,
    value: c.amount,
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { top: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
    }],
  }
})

// 部门排名
const deptRankingOption = computed(() => {
  const names = deptRanking.value.map(d => d.name)
  const values = deptRanking.value.map(d => d.amount)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: (params: any) => {
          const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00bcd4', '#ff9800', '#9c27b0', '#4caf50', '#f44336']
          return colors[params.dataIndex % colors.length]
        },
      },
    }],
  }
})

// 月度趋势
const monthlyTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['预算总额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: monthlyTrend.value.months },
  yAxis: { type: 'value' },
  series: [{
    name: '预算总额',
    type: 'line',
    data: monthlyTrend.value.budgets,
    smooth: true,
    areaStyle: { opacity: 0.1 },
  }],
}))

// ===================== 方法 =====================
async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (filterYear.value) params.year = filterYear.value
    if (filterSource.value) params.source = filterSource.value
    if (filterCategory.value) params.category = filterCategory.value

    const [dashboardRes, trendRes, deptRes] = await Promise.all([
      reportApi.getDashboard().catch(() => ({ data: {} })),
      reportApi.getMonthlyTrend(params).catch(() => ({ data: {} })),
      reportApi.getDepartmentRanking(params).catch(() => ({ data: { items: [] } })),
    ])

    const d = dashboardRes.data
    overview.totalBudget = d.overview?.totalBudget || 0
    overview.budgetCount = d.overview?.budgetCount || 0
    overview.pendingCount = d.overview?.pendingCount || 0
    overview.versionCount = d.overview?.versionCount || 0

    sourceDistribution.value = d.sourceDistribution || []
    categoryDistribution.value = d.categoryDistribution || []
    deptRanking.value = d.departmentRanking || []

    monthlyTrend.value = trendRes.data || { months: [], budgets: [] }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取报表数据失败')
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  try {
    const params: Record<string, any> = {}
    if (filterYear.value) params.year = filterYear.value
    if (filterSource.value) params.source = filterSource.value
    if (filterCategory.value) params.category = filterCategory.value
    await reportApi.exportAnalysis(params)
    ElMessage.success('报表导出成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '导出失败')
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 18px;
  }
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

.stat-card {
  text-align: center;

  .stat-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-color-primary);
  }

  &.stat-count .stat-value {
    color: var(--el-color-success);
  }

  &.stat-pending .stat-value {
    color: var(--el-color-warning);
  }

  &.stat-version .stat-value {
    color: var(--el-color-info);
  }
}
</style>
