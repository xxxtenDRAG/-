<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{
  title: string
  value: number | string
  suffix?: string
  hint?: string
  /** 十六进制强调色，用于图标底色与数值 */
  color?: string
  icon?: Component
}>()

const accent = computed(() => props.color ?? '#2e7d32')
const iconStyle = computed<Record<string, string>>(() => ({
  background: accent.value + '1a',
  color: accent.value,
}))
</script>

<template>
  <div class="stat-card">
    <div class="stat-icon" :style="iconStyle">
      <component :is="icon" v-if="icon" :size="20" />
      <i v-else class="dot" :style="{ background: accent }" />
    </div>
    <div class="stat-body">
      <div class="stat-title">{{ title }}</div>
      <div class="stat-value" :style="{ color: accent }">
        {{ value }}<span v-if="suffix" class="stat-suffix">{{ suffix }}</span>
      </div>
      <div v-if="hint" class="stat-hint">{{ hint }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex: none;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.stat-body {
  min-width: 0;
}

.stat-title {
  font-size: 12px;
  color: var(--color-text-sub);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
}

.stat-suffix {
  font-size: 12px;
  font-weight: 500;
  margin-left: 3px;
  color: var(--color-text-sub);
}

.stat-hint {
  font-size: 11px;
  color: var(--color-text-sub);
}
</style>
