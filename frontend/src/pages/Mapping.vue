<template>
  <div class="page-container">
    <div class="page-header">
      <h2>三单匹配</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterStatus" placeholder="匹配状态" clearable style="width: 150px" @change="handleSearch">
          <el-option label="完全匹配" value="FULL" />
          <el-option label="部分匹配" value="PARTIAL" />
          <el-option label="未匹配" value="NONE" />
        </el-select>
        <el-input v-model="filterBudgetCode" placeholder="预算编号" clearable style="width: 200px" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="success" :loading="autoMatchLoading" @click="handleAutoMatch">
          <el-icon><Connection /></el-icon>自动匹配
        </el-button>
        <el-button type="primary" @click="handleManualMatch">
          <el-icon><Link /></el-icon>手动关联
        </el-button>
      </div>
    </div>

    <!-- 匹配结果表格 -->
    <el-table v-loading="loading" :data="mappingList" border stripe style="margin-top: 16px" row-key="id">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-content">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="预算编号">{{ row.budgetCode }}</el-descriptions-item>
              <el-descriptions-item label="预算金额">{{ formatMoney(row.budgetAmount) }}</el-descriptions-item>
              <el-descriptions-item label="采购订单号">{{ row.purchaseOrderCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="采购金额">{{ row.purchaseOrderAmount ? formatMoney(row.purchaseOrderAmount) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="结算单号">{{ row.settlementCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="结算金额">{{ row.settlementAmount ? formatMoney(row.settlementAmount) : '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="budgetCode" label="预算编号" min-width="140" />
      <el-table-column prop="purchaseOrderCode" label="采购订单号" min-width="160">
        <template #default="{ row }">{{ row.purchaseOrderCode || '-' }}</template>
      </el-table-column>
      <el-table-column prop="settlementCode" label="结算单号" min-width="160">
        <template #default="{ row }">{{ row.settlementCode || '-' }}</template>
      </el-table-column>
      <el-table-column label="匹配状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getMappingStatusType(row.matchStatus) as any" size="small">
            {{ getMappingStatusLabel(row.matchStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="金额差异" width="130" align="right">
        <template #default="{ row }">
          <span v-if="row.amountDifference" :class="{ 'diff-warning': Math.abs(row.amountDifference) > 0 }">
            {{ formatMoney(row.amountDifference) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="验证状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.verified" type="success" size="small">已验证</el-tag>
          <el-tag v-else type="info" size="small">待验证</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.matchStatus !== 'FULL'" type="primary" link size="small" @click="handleEditMapping(row)">关联</el-button>
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

    <!-- 手动关联弹窗 -->
    <el-dialog v-model="matchDialogVisible" title="手动关联" width="600px" destroy-on-close>
      <el-form ref="matchFormRef" :model="matchForm" :rules="matchFormRules" label-width="100px">
        <el-form-item label="预算编号" prop="budgetCode">
          <el-select v-model="matchForm.budgetCode" placeholder="选择预算编号" filterable style="width: 100%">
            <el-option v-for="b in budgetOptions" :key="b.id" :label="b.code" :value="b.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购订单号" prop="purchaseOrderCode">
          <el-input v-model="matchForm.purchaseOrderCode" placeholder="输入采购订单号" />
        </el-form-item>
        <el-form-item label="结算单号" prop="settlementCode">
          <el-input v-model="matchForm.settlementCode" placeholder="输入结算单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="matchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="matchSubmitLoading" @click="handleMatchSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Connection, Link } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { importExportApi } from '@/api/modules/importExport'
import { budgetApi } from '@/api/modules/budget'
import { formatMoney } from '@/utils/format'

// ===================== 状态 =====================
const loading = ref(false)
const autoMatchLoading = ref(false)
const mappingList = ref<any[]>([])

const filterStatus = ref('')
const filterBudgetCode = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 弹窗
const matchDialogVisible = ref(false)
const matchSubmitLoading = ref(false)
const matchFormRef = ref<FormInstance>()
const budgetOptions = ref<any[]>([])
const matchForm = reactive({
  budgetCode: '',
  purchaseOrderCode: '',
  settlementCode: '',
})
const matchFormRules: FormRules = {
  budgetCode: [{ required: true, message: '请选择预算编号', trigger: 'change' }],
}

// ===================== 方法 =====================
async function fetchMappingList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filterStatus.value) params.matchStatus = filterStatus.value
    if (filterBudgetCode.value) params.budgetCode = filterBudgetCode.value

    const res = await importExportApi.getMappingList(params)
    mappingList.value = res.data.items || res.data || []
    pagination.total = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || '获取匹配列表失败')
  } finally {
    loading.value = false
  }
}

function getMappingStatusType(status: string) {
  const map: Record<string, string> = { FULL: 'success', PARTIAL: 'warning', NONE: 'danger' }
  return map[status] || 'info'
}

function getMappingStatusLabel(status: string) {
  const map: Record<string, string> = { FULL: '完全匹配', PARTIAL: '部分匹配', NONE: '未匹配' }
  return map[status] || status
}

function handleSearch() {
  pagination.page = 1
  fetchMappingList()
}

function handleReset() {
  filterStatus.value = ''
  filterBudgetCode.value = ''
  pagination.page = 1
  fetchMappingList()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  fetchMappingList()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchMappingList()
}

async function handleAutoMatch() {
  try {
    await ElMessageBox.confirm('确定要执行自动匹配吗？系统将根据编号和金额自动关联三单。', '自动匹配', { type: 'info' })
    autoMatchLoading.value = true
    const res = await importExportApi.autoMatch()
    ElMessage.success(`自动匹配完成，匹配 ${res.data.matchedCount || 0} 条`)
    fetchMappingList()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '自动匹配失败')
  } finally {
    autoMatchLoading.value = false
  }
}

async function handleManualMatch() {
  try {
    const res = await budgetApi.getList({ pageSize: 100 })
    budgetOptions.value = res.data.items
  } catch {
    // 静默处理
  }
  Object.assign(matchForm, { budgetCode: '', purchaseOrderCode: '', settlementCode: '' })
  matchDialogVisible.value = true
}

function handleEditMapping(row: any) {
  Object.assign(matchForm, {
    budgetCode: row.budgetCode || '',
    purchaseOrderCode: row.purchaseOrderCode || '',
    settlementCode: row.settlementCode || '',
  })
  matchDialogVisible.value = true
}

async function handleMatchSubmit() {
  const valid = await matchFormRef.value?.validate().catch(() => false)
  if (!valid) return

  matchSubmitLoading.value = true
  try {
    await importExportApi.createMapping(matchForm)
    ElMessage.success('关联成功')
    matchDialogVisible.value = false
    fetchMappingList()
  } catch (error: any) {
    ElMessage.error(error?.message || '关联失败')
  } finally {
    matchSubmitLoading.value = false
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchMappingList()
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.expand-content {
  padding: 16px;
}

.diff-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}
</style>
