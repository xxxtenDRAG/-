<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{ option: EChartsOption; height?: number }>(), {
  height: 260,
})

const container = ref<HTMLDivElement | null>(null)
const chart = shallowRef<echarts.ECharts | null>(null)
let observer: ResizeObserver | null = null

function render(): void {
  if (!container.value) return
  if (!chart.value) chart.value = echarts.init(container.value)
  chart.value.setOption(props.option, true)
}

onMounted(() => {
  render()
  if (container.value) {
    observer = new ResizeObserver(() => chart.value?.resize())
    observer.observe(container.value)
  }
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div ref="container" class="chart-box" :style="{ height: height + 'px' }" />
</template>

<style scoped>
.chart-box {
  width: 100%;
}
</style>
