<template>
  <div class="page-container">
    <div class="page-header">
      <h2>结算单导入</h2>
    </div>

    <el-row :gutter="20">
      <!-- 上传区域 -->
      <el-col :span="12">
        <el-card header="上传文件" shadow="never">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xlsx / .xls / .csv 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
          <div style="margin-top: 16px; display: flex; gap: 12px">
            <el-button type="primary" :loading="importLoading" :disabled="!selectedFile" @click="handleImport">
              开始导入
            </el-button>
            <el-button @click="handleDownloadTemplate">
              <el-icon><Download /></el-icon>下载模板
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 导入结果 -->
      <el-col :span="12">
        <el-card header="导入结果" shadow="never">
          <template v-if="importResult">
            <el-result
              :icon="importResult.errorCount > 0 ? 'warning' : 'success'"
              :title="importResult.errorCount > 0 ? '导入完成（部分失败）' : '导入成功'"
            >
              <template #sub-title>
                <p>成功导入：<span style="color: var(--el-color-success); font-weight: 600">{{ importResult.successCount }}</span> 条</p>
                <p v-if="importResult.errorCount > 0">
                  失败：<span style="color: var(--el-color-danger); font-weight: 600">{{ importResult.errorCount }}</span> 条
                </p>
              </template>
            </el-result>
            <el-table v-if="importResult.errors && importResult.errors.length > 0" :data="importResult.errors" border size="small" style="margin-top: 12px">
              <el-table-column prop="row" label="行号" width="70" />
              <el-table-column prop="field" label="字段" width="120" />
              <el-table-column prop="message" label="错误信息" />
            </el-table>
          </template>
          <el-empty v-else description="暂无导入结果" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 导入历史 -->
    <el-card header="导入历史" shadow="never" style="margin-top: 20px">
      <el-table :data="importHistory" border>
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="totalCount" label="总条数" width="100" align="center" />
        <el-table-column prop="successCount" label="成功" width="80" align="center">
          <template #default="{ row }">
            <span style="color: var(--el-color-success)">{{ row.successCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorCount" label="失败" width="80" align="center">
          <template #default="{ row }">
            <span style="color: var(--el-color-danger)">{{ row.errorCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="导入时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Download } from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import { importExportApi } from '@/api/modules/importExport'
import { formatDateTime } from '@/utils/format'

const uploadRef = ref<UploadInstance>()
const selectedFile = ref<File | null>(null)
const importLoading = ref(false)
const importResult = ref<any>(null)
const importHistory = ref<any[]>([])

function handleFileChange(file: UploadFile) {
  if (file.raw) {
    if (file.raw.size > 10 * 1024 * 1024) {
      ElMessage.warning('文件大小不能超过 10MB')
      uploadRef.value?.clearFiles()
      return
    }
    selectedFile.value = file.raw
  }
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件，请先删除已选文件')
}

async function handleImport() {
  if (!selectedFile.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const res = await importExportApi.importSettlements(selectedFile.value)
    importResult.value = res.data
    if (res.data.errorCount === 0) {
      ElMessage.success(`成功导入 ${res.data.successCount} 条记录`)
    } else {
      ElMessage.warning(`导入完成：成功 ${res.data.successCount} 条，失败 ${res.data.errorCount} 条`)
    }
    selectedFile.value = null
    uploadRef.value?.clearFiles()
    fetchImportHistory()
  } catch (error: any) {
    ElMessage.error(error?.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

async function handleDownloadTemplate() {
  try {
    await importExportApi.downloadTemplate('SETTLEMENT')
    ElMessage.success('模板下载成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '下载模板失败')
  }
}

async function fetchImportHistory() {
  try {
    importHistory.value = []
  } catch {
    // 静默处理
  }
}

onMounted(() => {
  fetchImportHistory()
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

.upload-area {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}
</style>
