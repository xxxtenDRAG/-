<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Bell, Cpu, DataLine, Document, Refresh, Warning } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { api } from '@/api'
import AlarmCard from '@/components/AlarmCard.vue'
import BehaviorTag from '@/components/BehaviorTag.vue'
import ChartBox from '@/components/ChartBox.vue'
import ReportPanel from '@/components/ReportPanel.vue'
import StatCard from '@/components/StatCard.vue'
import { useAlarmStore } from '@/stores/alarm'
import {
  RISK_COLORS,
  RISK_LABELS,
  type AlarmRecord,
  type BehaviorEvent,
  type RiskLevel,
  type StatsOverview,
  type VisionHealth,
} from '@/types'

const alarmStore = useAlarmStore()

const stats = ref<StatsOverview | null>(null)
const health = ref<VisionHealth | null>(null)
const events = ref<BehaviorEvent[]>([])
const active = ref<AlarmRecord | null>(null)
const drawerOpen = ref(false)
const live = ref(false)
let timer: number | null = null

const trendOption = computed<EChartsOption>(() => {
  const trend = stats.value?.trend ?? []
  return {
    grid: { left: 44, right: 18, top: 34, bottom: 28 },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    xAxis: {
      type: 'category',
      data: trend.map((point) => point.time),
      axisLine: { lineStyle: { color: '#dbe3db' } },
      axisLabel: { color: '#6b7770', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#eef2ee' } },
      axisLabel: { color: '#6b7770', fontSize: 11 },
    },
    series: [
      {
        name: '事件',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: trend.map((point) => point.events),
        itemStyle: { color: '#2e7d32' },
        areaStyle: { color: 'rgba(46,125,50,0.12)' },
      },
      {
        name: '告警',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: trend.map((point) => point.alarms),
        itemStyle: { color: '#ff9800' },
      },
    ],
  }
})

const levelOption = computed<EChartsOption>(() => {
  const dist = stats.value?.level_dist ?? []
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    series: [
      {
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '44%'],
        label: { formatter: '{b} {c}', fontSize: 11 },
        data: dist.map((item) => ({
          name: RISK_LABELS[item.level],
          value: item.count,
          itemStyle: { color: RISK_COLORS[item.level] },
        })),
      },
    ],
  }
})

async function refresh(): Promise<void> {
  const [overview, provider, recent] = await Promise.all([
    api.statsOverview(),
    api.visionHealth(),
    api.recentEvents(10),
  ])
  stats.value = overview
  health.value = provider
  events.value = recent
  await alarmStore.fetchList({ page: 1, page_size: 6 })
}

function openRecord(record: AlarmRecord): void {
  active.value = record
  drawerOpen.value = true
}

function notifyType(level: RiskLevel): 'success' | 'warning' | 'error' {
  if (level === 'high') return 'error'
  if (level === 'medium') return 'warning'
  return 'success'
}

function pushOne(): void {
  api
    .demoPulse()
    .then((record) => {
      alarmStore.pushLive(record)
      ElNotification({
        title: RISK_LABELS[record.report.risk_level] + '告警',
        message: record.report.title,
        type: notifyType(record.report.risk_level),
        duration: 6000,
        onClick: () => openRecord(record),
      })
      void refreshEvents()
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof Error ? error.message : '生成告警失败')
    })
}

async function refreshEvents(): Promise<void> {
  events.value = await api.recentEvents(10)
  stats.value = await api.statsOverview()
}

async function onFeedback(useful: boolean): Promise<void> {
  if (!active.value) return
  await api.submitFeedback(active.value.alarm_id, useful)
  ElMessage.success('反馈已记录，感谢你的标注')
}

function stopLive(): void {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

watch(live, (enabled) => {
  if (enabled) {
    timer = window.setInterval(pushOne, 5000)
    ElMessage.success('已开启实时推送，每 5 秒生成一条模拟事件')
  } else {
    stopLive()
  }
})

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false })
}

onMounted(refresh)
onUnmounted(stopLive)
</script>

<template>
  <div class="page">
    <div class="stat-grid">
      <StatCard
        title="今日事件"
        :value="stats?.events_today ?? 0"
        suffix="条"
        hint="感知域上报"
        :icon="DataLine"
        color="#2e7d32"
      />
      <StatCard
        title="今日告警"
        :value="stats?.alarms_today ?? 0"
        suffix="条"
        hint="研判域生成"
        :icon="Bell"
        color="#ff9800"
      />
      <StatCard
        title="高风险告警"
        :value="stats?.high_risk_today ?? 0"
        suffix="条"
        hint="建议立即处置"
        :icon="Warning"
        color="#f44336"
      />
      <StatCard
        title="知识库文档"
        :value="stats?.docs_total ?? 0"
        suffix="篇"
        hint="教材与标准"
        :icon="Document"
        color="#3f51b5"
      />
    </div>

    <div class="row">
      <div class="panel grow">
        <div class="panel-head">
          <h3>近 24 小时事件与告警趋势</h3>
          <span class="muted">每 2 小时聚合</span>
        </div>
        <ChartBox :option="trendOption" :height="250" />
      </div>
      <div class="panel side-panel">
        <div class="panel-head">
          <h3>风险等级分布</h3>
          <span class="muted">今日</span>
        </div>
        <ChartBox :option="levelOption" :height="250" />
      </div>
    </div>

    <div class="row">
      <div class="panel grow">
        <div class="panel-head">
          <h3>实时行为事件流</h3>
          <span class="muted">BehaviorEvent 契约字段</span>
        </div>
        <div class="event-list scroll-area">
          <div v-for="event in events" :key="event.event_id" class="event-item">
            <BehaviorTag
              :behavior="event.abnormal[0].behavior"
              :count="event.abnormal[0].count"
            />
            <span class="event-cam">{{ event.camera_id }}</span>
            <span class="muted">严重度 {{ (event.trigger?.severity_score ?? 0).toFixed(2) }}</span>
            <span class="muted event-time">{{ timeOf(event.timestamp) }}</span>
          </div>
          <el-empty v-if="!events.length" description="暂无事件" :image-size="70" />
        </div>
      </div>

      <div class="panel side-panel">
        <div class="panel-head">
          <h3>感知域状态</h3>
          <el-icon class="muted"><Cpu /></el-icon>
        </div>
        <div v-for="provider in health?.providers ?? []" :key="provider.name" class="provider">
          <div>
            <b>{{ provider.name }}</b>
            <div class="muted">{{ provider.mode }} · {{ provider.fps }} fps</div>
          </div>
          <el-tag :type="provider.running ? 'success' : 'info'" size="small">
            {{ provider.running ? '运行中' : '待机' }}
          </el-tag>
        </div>
        <p class="muted note">
          感知域仅通过 BehaviorEvent 契约与研判域耦合，source 可从 simulator 平滑切换为 yolo。
        </p>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>最新告警</h3>
        <div class="head-actions">
          <el-switch v-model="live" active-text="实时推送" />
          <el-button size="small" :icon="Refresh" @click="refresh">刷新</el-button>
        </div>
      </div>
      <div class="alarm-grid">
        <AlarmCard
          v-for="record in alarmStore.records"
          :key="record.alarm_id"
          :record="record"
          @select="openRecord"
        />
      </div>
      <el-empty v-if="!alarmStore.records.length" description="暂无告警" :image-size="80" />
    </div>

    <el-drawer v-model="drawerOpen" title="研判报告" size="620px">
      <ReportPanel v-if="active" :record="active" @feedback="onFeedback" />
    </el-drawer>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.side-panel {
  width: 320px;
  flex: none;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fafcfa;
  border: 1px solid var(--color-border);
}

.event-cam {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-dark);
}

.event-time {
  margin-left: auto;
}

.provider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--color-border);
}

.note {
  margin: 12px 0 0;
  line-height: 1.6;
}

.alarm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
</style>
