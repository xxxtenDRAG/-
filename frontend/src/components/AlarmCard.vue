<script setup lang="ts">
import { computed } from 'vue'
import { RISK_COLORS, type AlarmRecord } from '@/types'
import BehaviorTag from './BehaviorTag.vue'
import RiskLevelTag from './RiskLevelTag.vue'

const props = defineProps<{ record: AlarmRecord }>()
const emit = defineEmits<{ select: [record: AlarmRecord] }>()

const color = computed(() => RISK_COLORS[props.record.report.risk_level])
const timeText = computed(() =>
  new Date(props.record.created_at).toLocaleString('zh-CN', { hour12: false }),
)
</script>

<template>
  <div class="alarm-card" @click="emit('select', record)">
    <span class="bar" :style="{ background: color }" />
    <div class="content">
      <div class="head">
        <RiskLevelTag :level="record.report.risk_level" :score="record.report.risk_score" />
        <span class="time muted">{{ timeText }}</span>
      </div>
      <div class="title">{{ record.report.title }}</div>
      <div class="meta">
        <BehaviorTag :behavior="record.behavior" />
        <span class="muted">{{ record.house_id }} · {{ record.camera_id }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alarm-card {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.alarm-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 2px 10px rgba(46, 125, 50, 0.12);
}

.bar {
  width: 4px;
  border-radius: 2px;
  flex: none;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
