<template>
  <div class="page-container">
    <!-- 统计卡片 - 统一高度和对齐 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-budget">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">预算总额</div>
              <div class="stat-value">{{ formatMoney(stats.totalBudget) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-used">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">已使用金额</div>
              <div class="stat-value">{{ formatMoney(stats.usedBudget) }}</div>
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
              <div class="stat-label">待审批事项</div>
              <div class="stat-value">{{ stats.pendingApprovals }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card stat-card-new">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><DocumentAdd /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本月新增</div>
              <div class="stat-value">{{ stats.monthlyNew }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 + 预算使用率 -->
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
            <div class="action-item action-item-success" @click="router.push('/purchase/create')">
              <div class="action-icon"><el-icon :size="20"><Plus /></el-icon></div>
              <span class="action-text">创建采购申请</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item action-item-warning" @click="router.push('/approval')">
              <div class="action-icon"><el-icon :size="20"><Checked /></el-icon></div>
              <span class="action-text">审批中心</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item action-item-info" @click="router.push('/analysis')">
              <div class="action-icon"><el-icon :size="20"><DataAnalysis /></el-icon></div>
              <span class="action-text">报表分析</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>

        <!-- 预算使用率 -->
        <el-card class="usage-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><PieChart /></el-icon>
              <span>预算使用率</span>
            </div>
          </template>
          <div class="usage-content">
            <div class="usage-percentage">{{ budgetUsagePercent }}%</div>
            <el-progress
              :percentage="budgetUsagePercent"
              :color="budgetUsageColor"
              :stroke-width="12"
              :show-text="false"
              class="usage-progress"
            />
            <div class="usage-stats">
              <div class="usage-stat">
                <span class="stat-label-small">已使用</span>
                <span class="stat-value-small">{{ formatMoney(stats.usedBudget) }}</span>
              </div>
              <div class="usage-stat">
                <span class="stat-label-small">总预算</span>
                <span class="stat-value-small">{{ formatMoney(stats.totalBudget) }}</span>
              </div>
            </div>
          </div>
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
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="(row.targetType === 'BUDGET' ? 'primary' : 'success') as any" size="small">
                  {{ row.targetType === 'BUDGET' ? '预算' : '采购' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="targetCode" label="编号" min-width="130" />
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

    <!-- 预算预警 + 月度趋势 -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
        <el-card class="warning-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon>
              <span>预算使用预警</span>
              <el-tag type="warning" size="small" class="header-tag">使用率 > 80%</el-tag>
            </div>
          </template>
          <el-table :data="budgetWarnings" border size="small" v-if="budgetWarnings.length > 0">
            <el-table-column prop="code" label="预算编号" min-width="130" />
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="使用率" width="100">
              <template #default="{ row }">
                <span style="color: var(--el-color-danger); font-weight: 600">{{ row.usagePercent }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="剩余" min-width="120" align="right">
              <template #default="{ row }">{{ formatMoney(row.remainingAmount) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无预警" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14">
        <el-card class="trend-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>月度趋势</span>
            </div>
          </template>
          <v-chart :option="miniTrendOption" autoresize style="height: 280px" />
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
  Wallet, TrendCharts, Clock, DocumentAdd,
  Plus, Checked, DataAnalysis, Operation, PieChart, Bell, Warning, ArrowRight
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { reportApi } from '@/api/modules/report'
import { approvalApi } from '@/api/modules/approval'
import { budgetApi } from '@/api/modules/budget'
import { formatMoney, formatDateTimeShort } from '@/utils/format'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const router = useRouter()

// ===================== 状态 =====================
const stats = reactive({
  totalBudget: 0,
  usedBudget: 0,
  pendingApprovals: 0,
  monthlyNew: 0,
})

const pendingApprovals = ref<any[]>([])
const budgetWarnings = ref<any[]>([])
const monthlyData = ref<any>({})

const budgetUsagePercent = computed(() => {
  if (stats.totalBudget === 0) return 0
  return Math.round((stats.usedBudget / stats.totalBudget) * 100)
})

const budgetUsageColor = computed(() => {
  const p = budgetUsagePercent.value
  if (p >= 90) return '#F56C6C'
  if (p >= 80) return '#E6A23C'
  if (p >= 60) return '#409EFF'
  return '#67C23A'
})

const miniTrendOption = computed(() => {
  const months = monthlyData.value.months || ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      { name: '预算', type: 'line', data: monthlyData.value.budgets || [], smooth: true, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } },
      { name: '使用', type: 'line', data: monthlyData.value.usages || [], smooth: true, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } },
    ],
  }
})

// ===================== 方法 =====================
async function fetchDashboardData() {
  try {
    const res = await reportApi.getDashboard()
    const d = res.data
    stats.totalBudget = d.totalBudget || 0
    stats.usedBudget = d.usedBudget || 0
    stats.pendingApprovals = d.pendingApprovals || 0
    stats.monthlyNew = d.monthlyNew || 0
  } catch {
    // 静默处理
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

async function fetchBudgetWarnings() {
  try {
    const res = await budgetApi.getList({ pageSize: 50, status: 'APPROVED' })
    const items = res.data.items || []
    budgetWarnings.value = items
      .filter((b: any) => {
        const percent = b.totalAmount > 0 ? (b.usedAmount / b.totalAmount) * 100 : 0
        return percent > 80
      })
      .map((b: any) => ({
        ...b,
        usagePercent: b.totalAmount > 0 ? Math.round((b.usedAmount / b.totalAmount) * 100) : 0,
      }))
  } catch {
    // 静默处理
  }
}

async function fetchMonthlyTrend() {
  try {
    const res = await reportApi.getMonthlyTrend()
    monthlyData.value = res.data
  } catch {
    // 静默处理
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchDashboardData()
  fetchPendingApprovals()
  fetchBudgetWarnings()
  fetchMonthlyTrend()
})
</script>

<style scoped lang="scss">
// 苹果商务风格配色
$apple-blue: #007AFF;
$apple-green: #34C759;
$apple-orange: #FF9500;
$apple-red: #FF3B30;
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

// 统计卡片行
.stats-row {
  margin-bottom: 20px;
}

// 统计卡片 - 统一高度和苹果风格
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

  // 苹果风格渐变配色
  &.stat-card-budget .stat-icon { background: linear-gradient(135deg, $apple-blue, #5AC8FA); }
  &.stat-card-used .stat-icon { background: linear-gradient(135deg, $apple-green, #30D158); }
  &.stat-card-pending .stat-icon { background: linear-gradient(135deg, $apple-orange, #FFCC00); }
  &.stat-card-new .stat-icon { background: linear-gradient(135deg, $apple-gray, #AEAEB2); }

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

// 主要内容行
.main-content-row {
  margin-bottom: 20px;
}

// 卡片头部样式
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

// 快捷操作卡片
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

// 快捷操作按钮
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

  // 不同颜色的左边框
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

// 使用率卡片
.usage-card {
  border-radius: 16px;
  border: none;
  background: $apple-card-bg;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  :deep(.el-card__body) {
    padding: 24px 20px;
  }
}

.usage-content {
  text-align: center;
}

.usage-percentage {
  font-size: 48px;
  font-weight: 700;
  color: $apple-text;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}

.usage-progress {
  margin-bottom: 20px;

  :deep(.el-progress-bar__outer) {
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.04);
  }

  :deep(.el-progress-bar__inner) {
    border-radius: 6px;
  }
}

.usage-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.usage-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label-small {
  font-size: 12px;
  color: $apple-text-secondary;
  font-weight: 500;
}

.stat-value-small {
  font-size: 14px;
  color: $apple-text;
  font-weight: 600;
}

// 待审批卡片
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

// 底部行
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

// 警告卡片
.warning-card {
  :deep(.el-card__header .el-icon) {
    color: $apple-orange;
  }
}

// 趋势卡片
trend-card {
  :deep(.el-card__header .el-icon) {
    color: $apple-blue;
  }
}

// 响应式调整
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

  .usage-percentage {
    font-size: 36px;
  }
}
</style>
