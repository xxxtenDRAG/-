<script setup lang="ts">
import { computed } from 'vue'
import { RISK_COLORS, RISK_LABELS, type RiskLevel } from '@/types'

const props = defineProps<{
  level: RiskLevel
  /** 0-1 风险评分，传入后一并展示 */
  score?: number
  /** 描边样式，用于深色背景 */
  plain?: boolean
}>()

const style = computed<Record<string, string>>(() => {
  const color = RISK_COLORS[props.level]
  if (props.plain) return { color, borderColor: color, backgroundColor: 'transparent' }
  return { color, backgroundColor: color + '1f', borderColor: 'transparent' }
})

const label = computed(() => RISK_LABELS[props.level])
const scoreText = computed(() =>
  props.score === undefined ? '' : Math.round(props.score * 100) + ' 分',
)
</script>

<template>
  <span class="risk-tag" :style="style">
    <i class="dot" :style="{ background: RISK_COLORS[level] }" />
    {{ label }}
    <b v-if="scoreText" class="score">{{ scoreText }}</b>
  </span>
</template>

<style scoped>
.risk-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.score {
  font-weight: 500;
  opacity: 0.85;
}
</style>
