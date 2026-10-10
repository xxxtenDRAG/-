<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { CAMERAS, api } from '@/api'
import BehaviorTag from '@/components/BehaviorTag.vue'
import ReportPanel from '@/components/ReportPanel.vue'
import RiskLevelTag from '@/components/RiskLevelTag.vue'
import { useAlarmStore } from '@/stores/alarm'
import { RISK_LABELS, type AlarmQuery, type AlarmRecord, type RiskLevel } from '@/types'

const alarmStore = useAlarmStore()

const drawerOpen = ref(false)
const active = ref<AlarmRecord | null>(null)
const riskLevel = ref<RiskLevel | ''>('')
const cameraId = ref('')
const range = ref<[string, string] | null>(null)

const levelOptions: RiskLevel[] = ['low', 'medium', 'high']

function toIso(value: string): string {
  return new Date(value).toISOString()
}

async function search(): Promise<void> {
  const patch: Partial<AlarmQuery> = {
    risk_level: riskLevel.value || undefined,
    camera_id: cameraId.value || undefined,
    start: range.value ? toIso(range.value[0]) : undefined,
    end: range.value ? toIso(range.value[1]) : undefined,
    page: 1,
  }
  await alarmStore.fetchList(patch)
}

async function reset(): Promise<void> {
  riskLevel.value = ''
  cameraId.value = ''
  range.value = null
  alarmStore.resetQuery()
  await alarmStore.fetchList({ page: 1 })
}

function openRecord(record: AlarmRecord): void {
  active.value = record
  drawerOpen.value = true
}

async function onFeedback(useful: boolean): Promise<void> {
  if (!active.value) return
  await api.submitFeedback(active.value.alarm_id, useful)
  ElMessage.success('反馈已记录，感谢你的标注')
}

function createdAt(record: AlarmRecord): string {
  return new Date(record.created_at).toLocaleString('zh-CN', { hour12: false })
}

function onPageChange(page: number): void {
  void alarmStore.fetchList({ page })
}

onMounted(async () => {
  alarmStore.markAllRead()
  await alarmStore.fetchList({ page: 1 })
})
</script>

<template>
  <div class="page">
    <div class="panel filter">
      <div class="filter-item">
        <span class="label">风险等级</span>
        <el-select v-model="riskLevel" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="level in levelOptions"
            :key="level"
            :label="RISK_LABELS[level]"
            :value="level"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="label">画面</span>
        <el-select v-model="cameraId" placeholder="全部" clearable style="width: 180px">
          <el-option
            v-for="camera in CAMERAS"
            :key="camera.id"
            :label="camera.name"
            :value="camera.id"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="label">时间范围</span>
        <el-date-picker
          v-model="range"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </div>

      <div class="filter-actions">
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
        <el-button :icon="Refresh" @click="reset">重置</el-button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>告警记录</h3>
        <span class="muted">共 {{ alarmStore.total }} 条，点击行查看完整研判报告</span>
      </div>

      <el-table
        v-loading="alarmStore.loading"
        :data="alarmStore.records"
        row-key="alarm_id"
        @row-click="openRecord"
      >
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            <span class="mono time">{{ createdAt(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="画面" width="150">
          <template #default="{ row }">{{ row.house_id }} · {{ row.camera_id }}</template>
        </el-table-column>
        <el-table-column label="行为" width="110">
          <template #default="{ row }">
            <BehaviorTag :behavior="row.behavior" />
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="130">
          <template #default="{ row }">
            <RiskLevelTag :level="row.report.risk_level" :score="row.report.risk_score" />
          </template>
        </el-table-column>
        <el-table-column label="报告标题" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">{{ row.report.title }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openRecord(row)">查看</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="没有符合条件的告警" :image-size="80" />
        </template>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="alarmStore.total"
          :page-size="alarmStore.query.page_size ?? 10"
          :current-page="alarmStore.query.page ?? 1"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <el-drawer v-model="drawerOpen" title="研判报告" size="620px">
      <ReportPanel v-if="active" :record="active" @feedback="onFeedback" />
    </el-drawer>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: var(--color-text-sub);
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.time {
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
