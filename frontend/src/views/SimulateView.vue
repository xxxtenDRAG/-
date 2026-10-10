<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, Promotion, Refresh, VideoPlay } from '@element-plus/icons-vue'
import { CAMERAS, SIM_SCRIPTS, api } from '@/api'
import type { SimScript } from '@/api'
import BehaviorTag from '@/components/BehaviorTag.vue'
import { useAlarmStore } from '@/stores/alarm'
import {
  BEHAVIOR_DESC,
  BEHAVIOR_LABELS,
  RISK_LABELS,
  type BehaviorEvent,
  type BehaviorType,
  type EventSource,
  type SimulateRequest,
  type VisionHealth,
} from '@/types'

const alarmStore = useAlarmStore()

const cameraId = ref(CAMERAS[1].id)
const behaviors = ref<BehaviorType[]>(['limp'])
const count = ref(2)
const durationSec = ref(12)
const severity = ref(0.72)
const source = ref<EventSource>('simulator')
const busy = ref(false)
const lastEvent = ref<BehaviorEvent | null>(null)
const health = ref<VisionHealth | null>(null)
const logs = ref<{ id: number; time: string; text: string; tone: 'info' | 'success' }[]>([])
let logId = 0

const behaviorOptions: BehaviorType[] = ['limp', 'gather', 'isolate']

const request = computed<SimulateRequest>(() => ({
  camera_id: cameraId.value,
  behaviors: behaviors.value,
  count: count.value,
  duration_sec: durationSec.value,
  severity: severity.value,
  source: source.value,
}))

const requestJson = computed(() => JSON.stringify(request.value, null, 2))
const eventJson = computed(() => (lastEvent.value ? JSON.stringify(lastEvent.value, null, 2) : ''))

function addLog(text: string, tone: 'info' | 'success' = 'info'): void {
  logId += 1
  logs.value = [
    { id: logId, time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), text, tone },
    ...logs.value,
  ].slice(0, 30)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function generate(): Promise<void> {
  if (busy.value) return
  if (!behaviors.value.length) {
    ElMessage.warning('请至少选择一种异常行为')
    return
  }
  busy.value = true
  try {
    const event = await api.simulate(request.value)
    lastEvent.value = event
    addLog('事件已生成并落库：' + event.event_id)
    const record = await api.reportEvent(event)
    if (record) {
      alarmStore.pushLive(record)
      addLog('研判完成：' + RISK_LABELS[record.report.risk_level] + ' · ' + record.report.title, 'success')
      ElMessage.success('研判报告已生成，可在监控台或告警中心查看')
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '生成事件失败')
  } finally {
    busy.value = false
  }
}

async function playScript(script: SimScript): Promise<void> {
  if (busy.value) return
  busy.value = true
  addLog('开始播放剧本：' + script.name)
  try {
    for (const step of script.steps) {
      if (step.delay_ms > 0) await sleep(step.delay_ms)
      const event = await api.simulate({
        camera_id: step.camera_id,
        behaviors: [step.behavior],
        count: step.count,
        duration_sec: step.duration_sec,
        severity: step.severity,
      })
      lastEvent.value = event
      addLog('事件：' + event.event_id)
      const record = await api.reportEvent(event)
      if (record) {
        alarmStore.pushLive(record)
        addLog(
          '研判：' + RISK_LABELS[record.report.risk_level] + ' · ' + record.report.title,
          'success',
        )
      }
    }
    ElMessage.success('剧本「' + script.name + '」播放完成')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '剧本播放失败')
  } finally {
    busy.value = false
  }
}

function reset(): void {
  behaviors.value = ['limp']
  count.value = 2
  durationSec.value = 12
  severity.value = 0.72
  source.value = 'simulator'
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

onMounted(async () => {
  health.value = await api.visionHealth()
})
</script>

<template>
  <div class="page">
    <div class="row">
      <div class="panel grow">
        <div class="panel-head">
          <h3>手动生成行为事件</h3>
          <el-button size="small" :icon="Refresh" @click="reset">重置</el-button>
        </div>

        <el-form label-width="92px" label-position="left">
          <el-form-item label="画面/摄像头">
            <el-select v-model="cameraId" style="width: 260px">
              <el-option
                v-for="camera in CAMERAS"
                :key="camera.id"
                :label="camera.name + ' (' + camera.id + ')'"
                :value="camera.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="异常行为">
            <el-checkbox-group v-model="behaviors">
              <el-checkbox v-for="option in behaviorOptions" :key="option" :value="option">
                {{ BEHAVIOR_LABELS[option] }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <p class="muted hint">
            {{ behaviors.map((item) => BEHAVIOR_LABELS[item] + '：' + BEHAVIOR_DESC[item]).join('；') || '请选择至少一种异常行为' }}
          </p>

          <el-form-item label="异常数量">
            <el-slider v-model="count" :min="1" :max="20" :marks="{ 1: '1', 20: '20' }" style="max-width: 320px" />
            <span class="value">{{ count }} 只</span>
          </el-form-item>

          <el-form-item label="持续时长">
            <el-slider v-model="durationSec" :min="1" :max="120" style="max-width: 320px" />
            <span class="value">{{ durationSec }} 秒</span>
          </el-form-item>

          <el-form-item label="严重度">
            <el-slider v-model="severity" :min="0.1" :max="1" :step="0.01" style="max-width: 320px" />
            <span class="value">{{ severity.toFixed(2) }}</span>
          </el-form-item>

          <el-form-item label="数据来源">
            <el-radio-group v-model="source">
              <el-radio-button value="simulator">simulator</el-radio-button>
              <el-radio-button value="manual">manual</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button type="primary" :icon="Promotion" :loading="busy" @click="generate">
            生成并上报事件
          </el-button>
          <span class="muted">
            严重度 ≥ 0.70 判定为高风险，0.40~0.69 中风险，其余低风险
          </span>
        </div>
      </div>

      <div class="panel side-panel">
        <div class="panel-head">
          <h3>预设演示剧本</h3>
          <el-icon class="muted"><MagicStick /></el-icon>
        </div>
        <div v-for="script in SIM_SCRIPTS" :key="script.id" class="script">
          <div class="script-body">
            <b>{{ script.name }}</b>
            <p class="muted">{{ script.desc }}</p>
          </div>
          <el-button size="small" :icon="VideoPlay" :disabled="busy" @click="playScript(script)">
            播放
          </el-button>
        </div>

        <div class="panel-head second">
          <h3>感知域状态</h3>
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
      </div>
    </div>

    <div class="row">
      <div class="panel grow">
        <div class="panel-head">
          <h3>请求体预览</h3>
          <span class="muted">POST /api/v1/vision/simulate</span>
        </div>
        <pre class="pre-block">{{ requestJson }}</pre>
      </div>

      <div class="panel grow">
        <div class="panel-head">
          <h3>最近生成的事件</h3>
          <span v-if="lastEvent" class="muted">{{ timeOf(lastEvent.timestamp) }}</span>
        </div>
        <template v-if="lastEvent">
          <div class="behaviors">
            <BehaviorTag
              v-for="item in lastEvent.abnormal"
              :key="item.behavior"
              :behavior="item.behavior"
              :count="item.count"
            />
            <span class="muted">{{ lastEvent.camera_id }} · {{ lastEvent.event_id }}</span>
          </div>
          <pre class="pre-block scroll-area">{{ eventJson }}</pre>
        </template>
        <el-empty v-else description="尚未生成事件" :image-size="70" />
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>生成日志</h3>
        <span class="muted">事件 → 落库 → 研判 → 告警</span>
      </div>
      <div class="log-list scroll-area">
        <div v-for="item in logs" :key="item.id" class="log-item" :class="item.tone">
          <span class="log-time">{{ item.time }}</span>
          <span>{{ item.text }}</span>
        </div>
        <el-empty v-if="!logs.length" description="暂无日志" :image-size="70" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.side-panel {
  width: 340px;
  flex: none;
}

.hint {
  margin: -8px 0 14px 92px;
  line-height: 1.6;
}

.value {
  margin-left: 14px;
  font-size: 13px;
  color: var(--color-primary-dark);
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border);
}

.script {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--color-border);
}

.script-body {
  min-width: 0;
}

.script-body p {
  margin: 2px 0 0;
  line-height: 1.5;
}

.panel-head.second {
  margin-top: 18px;
}

.provider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--color-border);
}

.behaviors {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.pre-block {
  max-height: 300px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
}

.log-item {
  display: flex;
  gap: 12px;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #fafcfa;
  border: 1px solid var(--color-border);
}

.log-item.success {
  background: #eef6ee;
  border-color: #c8e6c9;
  color: var(--color-primary-dark);
}

.log-time {
  color: var(--color-text-sub);
  font-family: 'Cascadia Mono', Consolas, monospace;
}
</style>
