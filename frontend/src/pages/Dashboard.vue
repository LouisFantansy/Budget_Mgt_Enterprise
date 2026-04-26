<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-budget">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">预算总额</div>
              <div class="stat-value">{{ formatMoney(overview.totalBudget) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-count">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">预算数量</div>
              <div class="stat-value">{{ overview.budgetCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-pending">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">待审批</div>
              <div class="stat-value">{{ overview.pendingCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-version">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><Collection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">版本数量</div>
              <div class="stat-value">{{ overview.versionCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 + 待审批 -->
    <el-row :gutter="20" class="main-content-row">
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="quick-actions-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Operation /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <div class="action-item action-item-primary" @click="router.push('/budgets/create')">
              <div class="action-icon"><el-icon :size="20"><Plus /></el-icon></div>
              <span class="action-text">创建预算</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item action-item-warning" @click="router.push('/approval')">
              <div class="action-icon"><el-icon :size="20"><Checked /></el-icon></div>
              <span class="action-text">审批中心</span>
              <el-tag v-if="overview.pendingCount > 0" type="danger" size="small">{{ overview.pendingCount }}</el-tag>
              <el-icon v-else class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item action-item-success" @click="router.push('/special-requirements')">
              <div class="action-icon"><el-icon :size="20"><DocumentAdd /></el-icon></div>
              <span class="action-text">专题需求</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item action-item-info" @click="router.push('/analysis')">
              <div class="action-icon"><el-icon :size="20"><DataAnalysis /></el-icon></div>
              <span class="action-text">报表分析</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>

        <!-- 来源分布 -->
        <el-card class="source-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><PieChartIcon /></el-icon>
              <span>预算来源分布</span>
            </div>
          </template>
          <v-chart :option="sourceOption" autoresize style="height: 220px" />
        </el-card>
      </el-col>

      <!-- 最近待审批 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="pending-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Bell /></el-icon>
              <span>最近待审批</span>
              <el-tag v-if="pendingApprovals.length > 0" type="danger" size="small" class="header-tag">{{ pendingApprovals.length }}</el-tag>
            </div>
          </template>
          <el-table :data="pendingApprovals" border size="small" v-if="pendingApprovals.length > 0">
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag :type="(row.targetType === 'BUDGET' ? 'primary' : 'success') as any" size="small">
                  {{ row.targetType === 'BUDGET' ? '预算' : '需求' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="targetNo" label="编号" min-width="130" />
            <el-table-column prop="targetName" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="金额" min-width="120" align="right">
              <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column label="发起时间" min-width="150">
              <template #default="{ row }">{{ formatDateTimeShort(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default>
                <el-button type="primary" link size="small" @click="router.push('/approval')">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无待审批事项" :image-size="60" />
          <div style="text-align: right; margin-top: 8px" v-if="pendingApprovals.length > 0">
            <el-button type="primary" link @click="router.push('/approval')">查看全部</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- OPEX/CAPEX + 部门排名 -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
        <el-card class="category-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><PieChartIcon /></el-icon>
              <span>OPEX / CAPEX 分布</span>
            </div>
          </template>
          <v-chart :option="categoryOption" autoresize style="height: 280px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14">
        <el-card class="ranking-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>部门预算排名 (Top 10)</span>
            </div>
          </template>
          <v-chart :option="deptRankingOption" autoresize style="height: 280px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Wallet, Document, Clock, Collection,
  Plus, Checked, DataAnalysis, Operation, PieChart as PieChartIcon, Bell, ArrowRight, DocumentAdd
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { reportApi } from '@/api/modules/report'
import { approvalApi } from '@/api/modules/approval'
import { formatMoney, formatDateTimeShort } from '@/utils/format'

use([CanvasRenderer, LineChart, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const router = useRouter()

// ===================== 状态 =====================
const overview = reactive({
  totalBudget: 0,
  budgetCount: 0,
  pendingCount: 0,
  versionCount: 0,
})

const sourceDistribution = ref<{ source: string; amount: number }[]>([])
const categoryDistribution = ref<{ category: string; amount: number }[]>([])
const deptRanking = ref<{ name: string; amount: number }[]>([])

const pendingApprovals = ref<any[]>([])

// 来源分布饼图
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
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['65%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
    }],
  }
})

// OPEX/CAPEX 分布
const categoryOption = computed(() => {
  const catMap: Record<string, string> = {
    OPEX: '运营支出 (OPEX)',
    CAPEX: '资本支出 (CAPEX)',
  }
  const data = categoryDistribution.value.map(c => ({
    name: catMap[c.category] || c.category,
    value: c.amount,
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 0 }],
    }],
  }
})

// 部门排名图
const deptRankingOption = computed(() => {
  const names = deptRanking.value.map(d => d.name)
  const values = deptRanking.value.map(d => d.amount)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names.reverse(), axisLabel: { width: 100, overflow: 'truncate' } },
    series: [{
      type: 'bar',
      data: values.reverse(),
      itemStyle: {
        color: (params: any) => {
          const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00bcd4', '#ff9800', '#9c27b0']
          return colors[params.dataIndex % colors.length]
        },
        borderRadius: [0, 4, 4, 0],
      },
    }],
  }
})

// ===================== 方法 =====================
async function fetchDashboardData() {
  try {
    const res = await reportApi.getDashboard()
    const d = res.data
    overview.totalBudget = d.overview?.totalBudget || 0
    overview.budgetCount = d.overview?.budgetCount || 0
    overview.pendingCount = d.overview?.pendingCount || 0
    overview.versionCount = d.overview?.versionCount || 0

    sourceDistribution.value = d.sourceDistribution || []
    categoryDistribution.value = d.categoryDistribution || []
    deptRanking.value = d.departmentRanking || []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取仪表盘数据失败')
  }
}

async function fetchPendingApprovals() {
  try {
    const res = await approvalApi.getList({ pageSize: 5, status: 'PENDING' })
    pendingApprovals.value = res.data.items || []
  } catch {
    // 静默处理
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchDashboardData()
  fetchPendingApprovals()
})
</script>

<style scoped lang="scss">
// 苹果商务风格配色
$apple-blue: #007AFF;
$apple-green: #34C759;
$apple-orange: #FF9500;
$apple-purple: #AF52DE;
$apple-gray: #8E8E93;
$apple-bg: #F5F5F7;
$apple-card-bg: #FFFFFF;
$apple-text: #1D1D1F;
$apple-text-secondary: #6E6E73;

.page-container {
  padding: 24px;
  background: $apple-bg;
  min-height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  border-radius: 16px;
  border: none;
  background: $apple-card-bg;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  :deep(.el-card__body) {
    height: 100%;
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 100%;
  }

  .stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
    font-size: 24px;
  }

  &.stat-card-budget .stat-icon { background: linear-gradient(135deg, $apple-blue, #5AC8FA); }
  &.stat-card-count .stat-icon { background: linear-gradient(135deg, $apple-green, #30D158); }
  &.stat-card-pending .stat-icon { background: linear-gradient(135deg, $apple-orange, #FFCC00); }
  &.stat-card-version .stat-icon { background: linear-gradient(135deg, $apple-purple, #BF5AF2); }

  .stat-info {
    flex: 1;
    min-width: 0;

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: $apple-text-secondary;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: $apple-text;
      letter-spacing: -0.02em;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    }
  }
}

.main-content-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: $apple-text;
  letter-spacing: -0.01em;

  .el-icon {
    font-size: 18px;
    color: $apple-blue;
  }

  .header-tag {
    margin-left: auto;
    font-weight: 500;
  }
}

.quick-actions-card {
  border-radius: 16px;
  border: none;
  background: $apple-card-bg;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  border-radius: 12px;
  background: $apple-bg;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: darken($apple-bg, 3%);
    transform: translateX(4px);

    .action-arrow {
      transform: translateX(4px);
      color: $apple-text-secondary;
    }
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .action-text {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: $apple-text;
    line-height: 20px;
  }

  .action-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 16px;
    color: $apple-gray;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  &.action-item-primary {
    border-left: 4px solid $apple-blue;
    .action-icon { color: $apple-blue; }
  }
  &.action-item-success {
    border-left: 4px solid $apple-green;
    .action-icon { color: $apple-green; }
  }
  &.action-item-warning {
    border-left: 4px solid $apple-orange;
    .action-icon { color: $apple-orange; }
  }
  &.action-item-info {
    border-left: 4px solid $apple-gray;
    .action-icon { color: $apple-gray; }
  }
}

.source-card {
  border-radius: 16px;
  border: none;
  background: $apple-card-bg;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  :deep(.el-card__body) {
    padding: 12px;
  }
}

.pending-card {
  border-radius: 16px;
  border: none;
  background: $apple-card-bg;
  height: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.bottom-row {
  .el-card {
    border-radius: 16px;
    border: none;
    background: $apple-card-bg;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .stat-card {
    height: 100px;
    margin-bottom: 12px;

    .stat-icon {
      width: 44px;
      height: 44px;
    }

    .stat-info .stat-value {
      font-size: 20px;
    }
  }
}
</style>
