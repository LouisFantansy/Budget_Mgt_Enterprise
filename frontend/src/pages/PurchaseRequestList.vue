<template>
  <div class="page-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索申请编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="handleSearch">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="待审批" value="PENDING_APPROVAL" />
          <el-option label="审批中" value="IN_APPROVAL" />
          <el-option label="已审批" value="APPROVED" />
          <el-option label="已驳回" value="REJECTED" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>
        <el-select v-model="filterUrgency" placeholder="紧急程度" clearable style="width: 130px" @change="handleSearch">
          <el-option label="低" value="LOW" />
          <el-option label="普通" value="NORMAL" />
          <el-option label="高" value="HIGH" />
          <el-option label="紧急" value="URGENT" />
        </el-select>
        <el-input
          v-model="filterBudgetCode"
          placeholder="关联预算编号"
          clearable
          style="width: 180px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新建采购申请
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="purchaseList" border stripe style="margin-top: 16px">
      <el-table-column prop="code" label="申请编号" min-width="140" />
      <el-table-column label="申请人" min-width="100">
        <template #default="{ row }">
          {{ row.creator?.realName || row.creator?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="部门" min-width="120">
        <template #default="{ row }">
          {{ row.department?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="关联预算" min-width="140">
        <template #default="{ row }">
          {{ row.budget?.code || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="总金额" min-width="130" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.totalAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" width="100">
        <template #default="{ row }">
          <el-tag :type="getUrgencyType(row.urgency) as any" size="small">
            {{ getUrgencyLabel(row.urgency) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getPurchaseStatusType(row.status) as any" size="small">
            {{ getPurchaseStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">查看</el-button>
          <el-button v-if="row.status === 'DRAFT'" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 'DRAFT'" type="success" link size="small" @click="handleSubmit(row)">提交</el-button>
          <el-button v-if="canCancel(row.status)" type="warning" link size="small" @click="handleCancel(row)">取消</el-button>
          <el-button v-if="row.status === 'DRAFT'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { purchaseApi } from '@/api/modules/purchase'
import type { PurchaseRequest } from '@/types'
import { formatDateTime, formatMoney } from '@/utils/format'

const router = useRouter()

// ===================== 状态 =====================
const loading = ref(false)
const purchaseList = ref<PurchaseRequest[]>([])

// 筛选条件
const searchQuery = ref('')
const filterStatus = ref('')
const filterUrgency = ref('')
const filterBudgetCode = ref('')

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// ===================== 方法 =====================
async function fetchPurchaseList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterUrgency.value) params.urgency = filterUrgency.value
    if (filterBudgetCode.value) params.budgetCode = filterBudgetCode.value

    const res = await purchaseApi.getList(params)
    purchaseList.value = res.data.items
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || '获取采购列表失败')
  } finally {
    loading.value = false
  }
}

function getUrgencyType(urgency: string) {
  const map: Record<string, string> = { LOW: 'info', NORMAL: '', HIGH: 'warning', URGENT: 'danger' }
  return map[urgency] || 'info'
}

function getUrgencyLabel(urgency: string) {
  const map: Record<string, string> = { LOW: '低', NORMAL: '普通', HIGH: '高', URGENT: '紧急' }
  return map[urgency] || urgency
}

function getPurchaseStatusType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'info', PENDING_APPROVAL: 'warning', IN_APPROVAL: 'warning',
    APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'info',
    ORDERED: '', DELIVERED: 'success',
  }
  return map[status] || 'info'
}

function getPurchaseStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿', PENDING_APPROVAL: '待审批', IN_APPROVAL: '审批中',
    APPROVED: '已审批', REJECTED: '已驳回', CANCELLED: '已取消',
    ORDERED: '已下单', DELIVERED: '已交付',
  }
  return map[status] || status
}

function canCancel(status: string) {
  return ['DRAFT', 'PENDING_APPROVAL', 'IN_APPROVAL'].includes(status)
}

function handleSearch() {
  pagination.page = 1
  fetchPurchaseList()
}

function handleReset() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterUrgency.value = ''
  filterBudgetCode.value = ''
  pagination.page = 1
  fetchPurchaseList()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  fetchPurchaseList()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchPurchaseList()
}

function handleCreate() {
  router.push('/purchase/create')
}

function handleDetail(row: PurchaseRequest) {
  router.push(`/purchase/${row.id}`)
}

function handleEdit(row: PurchaseRequest) {
  router.push(`/purchase/create?editId=${row.id}`)
}

async function handleSubmit(row: PurchaseRequest) {
  try {
    await ElMessageBox.confirm('确定要提交此采购申请进行审批吗？', '确认提交', { type: 'warning' })
    await purchaseApi.submit(row.id)
    ElMessage.success('提交成功')
    fetchPurchaseList()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '提交失败')
  }
}

async function handleCancel(row: PurchaseRequest) {
  try {
    await ElMessageBox.confirm('确定要取消此采购申请吗？', '确认取消', { type: 'warning' })
    await purchaseApi.cancel(row.id)
    ElMessage.success('取消成功')
    fetchPurchaseList()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '取消失败')
  }
}

async function handleDelete(row: PurchaseRequest) {
  try {
    await ElMessageBox.confirm('确定要删除此采购申请吗？删除后不可恢复。', '确认删除', { type: 'warning' })
    await purchaseApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchPurchaseList()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '删除失败')
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  fetchPurchaseList()
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
