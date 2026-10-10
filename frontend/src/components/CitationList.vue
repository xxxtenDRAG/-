<script setup lang="ts">
import type { Citation } from '@/types'

defineProps<{
  citations: Citation[]
  active?: number | null
}>()

const emit = defineEmits<{ select: [idx: number] }>()

function describe(citation: Citation): string {
  const parts: string[] = []
  if (citation.chapter) parts.push(citation.chapter)
  if (citation.section) parts.push(citation.section)
  if (citation.page !== undefined) parts.push('第 ' + citation.page + ' 页')
  if (citation.standard) parts.push(citation.standard)
  return parts.join(' · ')
}
</script>

<template>
  <div class="citation-list">
    <div v-if="!citations.length" class="muted">暂无引用来源</div>
    <button
      v-for="citation in citations"
      :key="citation.idx"
      type="button"
      class="citation-item"
      :class="{ active: citation.idx === active }"
      @click="emit('select', citation.idx)"
    >
      <span class="idx">[{{ citation.idx }}]</span>
      <span class="body">
        <span class="title">{{ citation.title }}</span>
        <span v-if="describe(citation)" class="detail">{{ describe(citation) }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.citation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.citation-item {
  display: flex;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fafcfa;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.citation-item:hover,
.citation-item.active {
  border-color: var(--color-primary);
  background: #eef6ee;
}

.idx {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 12px;
}

.body {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 13px;
  font-weight: 600;
}

.detail {
  font-size: 12px;
  color: var(--color-text-sub);
}
</style>
