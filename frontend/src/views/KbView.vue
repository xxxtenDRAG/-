<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Files, FolderOpened, UploadFilled } from '@element-plus/icons-vue'
import { api } from '@/api'
import StatCard from '@/components/StatCard.vue'
import { KB_STATUS_LABELS, KB_STATUS_TAG, type KbDocument } from '@/types'

const docs = ref<KbDocument[]>([])
const loading = ref(false)
const uploading = ref(false)

const indexedCount = computed(() => docs.value.filter((doc) => doc.status === 'indexed').length)
const totalChunks = computed(() => docs.value.reduce((sum, doc) => sum + doc.chunks, 0))
const totalSizeMb = computed(() =>
  (docs.value.reduce((sum, doc) => sum + doc.size_kb, 0) / 1024).toFixed(1),
)

async function load(): Promise<void> {
  loading.value = true
  try {
    docs.value = await api.listDocuments()
  } finally {
    loading.value = false
  }
}

async function beforeUpload(file: File): Promise<boolean> {
  uploading.value = true
  try {
    await api.uploadDocument(file)
    await load()
    ElMessage.success('文档已接收，正在异步解析入库')
    window.setTimeout(() => {
      void load()
    }, 2200)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '上传失败')
  } finally {
    uploading.value = false
  }
  return false
}

async function remove(doc: KbDocument): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '确定删除「' + doc.filename + '」及其向量索引吗？该操作不可恢复。',
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  await api.deleteDocument(doc.doc_id)
  await load()
  ElMessage.success('已删除')
}

function uploadedAt(doc: KbDocument): string {
  return new Date(doc.uploaded_at).toLocaleString('zh-CN', { hour12: false })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="stat-grid">
      <StatCard title="文档总数" :value="docs.length" suffix="篇" :icon="Files" color="#2e7d32" />
      <StatCard title="已入库" :value="indexedCount" suffix="篇" :icon="Document" color="#3f51b5" />
      <StatCard title="向量分块" :value="totalChunks" suffix="块" :icon="FolderOpened" color="#ff9800" />
      <StatCard title="源文件体积" :value="totalSizeMb" suffix="MB" hint="PDF 不进 Git，走网盘/Release" color="#00897b" />
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>上传知识库文档</h3>
        <span class="muted">支持 PDF / DOCX / TXT，上传后触发异步解析、分块与向量化</span>
      </div>
      <el-upload
        drag
        multiple
        action="#"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :disabled="uploading"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">将文件拖到此处，或<em>点击选择文件</em></div>
        <template #tip>
          <div class="muted upload-tip">
            一期知识库以《鹅病防治手册》《家禽生产学》《禽病学》与 NY/T 5030 等标准为核心语料
          </div>
        </template>
      </el-upload>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>文档列表</h3>
        <span class="muted">解析状态由后端异步任务更新</span>
      </div>
      <el-table v-loading="loading" :data="docs" row-key="doc_id">
        <el-table-column label="文件名" min-width="240">
          <template #default="{ row }">
            <div class="file-cell">
              <el-icon class="file-icon"><Document /></el-icon>
              <span>{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ (row.size_kb / 1024).toFixed(1) }} MB</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="KB_STATUS_TAG[row.status as KbDocument['status']]" size="small">
              {{ KB_STATUS_LABELS[row.status as KbDocument['status']] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分块数" width="100">
          <template #default="{ row }">{{ row.chunks || '-' }}</template>
        </el-table-column>
        <el-table-column label="上传时间" width="180">
          <template #default="{ row }">
            <span class="mono time">{{ uploadedAt(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="知识库还没有文档" :image-size="80" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.upload-icon {
  font-size: 42px;
  color: var(--color-primary-light);
}

.upload-text {
  font-size: 13px;
  color: var(--color-text-sub);
}

.upload-text em {
  color: var(--color-primary);
  font-style: normal;
}

.upload-tip {
  text-align: center;
  margin-top: 8px;
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: var(--color-primary);
}

.time {
  font-size: 12px;
}
</style>
