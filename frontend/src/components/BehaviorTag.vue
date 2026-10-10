<script setup lang="ts">
import { computed } from 'vue'
import { BEHAVIOR_DESC, BEHAVIOR_LABELS, type BehaviorType } from '@/types'

const props = defineProps<{
  behavior: BehaviorType
  count?: number
}>()

const COLORS: Record<BehaviorType, string> = {
  limp: '#795548',
  gather: '#3f51b5',
  isolate: '#00897b',
}

const GLYPHS: Record<BehaviorType, string> = {
  limp: '跛',
  gather: '聚',
  isolate: '离',
}

const style = computed<Record<string, string>>(() => {
  const color = COLORS[props.behavior]
  return { color, backgroundColor: color + '1a' }
})

const label = computed(() => BEHAVIOR_LABELS[props.behavior])
const glyph = computed(() => GLYPHS[props.behavior])
const tip = computed(() => BEHAVIOR_DESC[props.behavior])
const color = computed(() => COLORS[props.behavior])
</script>

<template>
  <span class="behavior-tag" :style="style" :title="tip">
    <i class="glyph" :style="{ background: color }">{{ glyph }}</i>
    {{ label }}
    <b v-if="count !== undefined" class="count">x{{ count }}</b>
  </span>
</template>

<style scoped>
.behavior-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 8px 1px 2px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
}

.glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  font-style: normal;
}

.count {
  font-weight: 500;
  opacity: 0.85;
}
</style>
