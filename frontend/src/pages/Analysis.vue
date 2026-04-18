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
          @change="fetchDashboardData"
        />
        <el-select v-model="filterDepartmentId" placeholder="选择部门" clearable style="width: 200px" @change="fetchDashboardData">
          <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.id" />
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
          <div class="stat-value">{{ formatMoney(dashboardData.totalBudget) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-used">
          <div class="stat-label">已使用</div>
          <div class="stat-value">{{ formatMoney(dashboardData.usedBudget) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-frozen">
          <div class="stat-label">冻结中</div>
          <div class="stat-value">{{ formatMoney(dashboardData.frozenBudget) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-available">
          <div class="stat-label">可用金额</div>
          <div class="stat-value">{{ formatMoney(dashboardData.availableBudget) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card header="月度趋势" shadow="never">
          <v-chart :option="monthlyTrendOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="部门排名 (Top 10)" shadow="never">
          <v-chart :option="deptRankingOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card header="类别分布" shadow="never">
          <v-chart :option="categoryOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="预算类型对比" shadow="never">
          <v-chart :option="typeCompareOption" autoresize style="height: 350px" />
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
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { reportApi } from '@/api/modules/report'
import { getDepartmentTree } from '@/api/modules/department'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

// ===================== 状态 =====================
const filterYear = ref(dayjs().format('YYYY'))
const filterDepartmentId = ref<number | null>(null)
const departmentList = ref<any[]>([])
const loading = ref(false)

const dashboardData = reactive({
  totalBudget: 0,
  usedBudget: 0,
  frozenBudget: 0,
  availableBudget: 0,
})

// 图表数据
const monthlyTrendData = ref<any>({})
const deptRankingData = ref<any[]>([])
const categoryData = ref<any[]>([])

// 月度趋势图配置
const monthlyTrendOption = computed(() => {
  const months = monthlyTrendData.value.months || ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预算', '使用'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      { name: '预算', type: 'line', data: monthlyTrendData.value.budgets || [], smooth: true, areaStyle: { opacity: 0.1 } },
      { name: '使用', type: 'line', data: monthlyTrendData.value.usages || [], smooth: true, areaStyle: { opacity: 0.1 } },
    ],
  }
})

// 部门排名图配置
const deptRankingOption = computed(() => {
  const names = deptRankingData.value.map((d: any) => d.name)
  const values = deptRankingData.value.map((d: any) => d.amount)
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

// 类别分布饼图
const categoryOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
    data: categoryData.value.length > 0
      ? categoryData.value.map((c: any) => ({ name: c.name, value: c.amount }))
      : [{ name: '暂无数据', value: 0 }],
  }],
}))

// 预算类型对比
const typeCompareOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { top: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}\n{d}%' },
    data: [
      { name: 'OPEX (运营支出)', value: dashboardData.usedBudget * 0.6 || 1, itemStyle: { color: '#409EFF' } },
      { name: 'CAPEX (资本支出)', value: dashboardData.usedBudget * 0.4 || 1, itemStyle: { color: '#67C23A' } },
    ],
  }],
}))

// ===================== 方法 =====================
async function fetchDashboardData() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (filterYear.value) params.year = filterYear.value
    if (filterDepartmentId.value) params.departmentId = filterDepartmentId.value

    const [dashboardRes, trendRes, deptRes, categoryRes] = await Promise.all([
      reportApi.getDashboard(),
      reportApi.getMonthlyTrend(params).catch(() => ({ data: {} })),
      reportApi.getDepartmentRanking(params).catch(() => ({ data: { items: [] } })),
      reportApi.getCategoryAnalysis(params).catch(() => ({ data: { items: [] } })),
    ])

    const d = dashboardRes.data
    dashboardData.totalBudget = d.totalBudget || 0
    dashboardData.usedBudget = d.usedBudget || 0
    dashboardData.frozenBudget = d.frozenBudget || 0
    dashboardData.availableBudget = d.availableBudget || 0

    monthlyTrendData.value = trendRes.data
    deptRankingData.value = deptRes.data.items || deptRes.data || []
    categoryData.value = categoryRes.data.items || categoryRes.data || []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取报表数据失败')
  } finally {
    loading.value = false
  }
}

async function fetchDepartments() {
  try {
    const res = await getDepartmentTree()
    departmentList.value = flattenDepartments(res.data)
  } catch {
    // 静默处理
  }
}

function flattenDepartments(depts: any[]): any[] {
  const result: any[] = []
  for (const dept of depts) {
    result.push(dept)
    if (dept.children && dept.children.length > 0) {
      result.push(...flattenDepartments(dept.children))
    }
  }
  return result
}

async function handleExport() {
  try {
    const params: Record<string, any> = {}
    if (filterYear.value) params.year = filterYear.value
    if (filterDepartmentId.value) params.departmentId = filterDepartmentId.value
    await reportApi.exportAnalysis(params)
    ElMessage.success('报表导出成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '导出失败')
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchDepartments()
  fetchDashboardData()
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

  &.stat-used .stat-value {
    color: var(--el-color-success);
  }

  &.stat-frozen .stat-value {
    color: var(--el-color-warning);
  }

  &.stat-available .stat-value {
    color: var(--el-color-primary);
  }
}
</style>
