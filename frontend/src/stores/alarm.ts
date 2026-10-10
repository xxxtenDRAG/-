import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api'
import type { AlarmQuery, AlarmRecord, RiskLevel } from '@/types'

const emptyQuery = (): AlarmQuery => ({
  risk_level: undefined,
  camera_id: undefined,
  start: undefined,
  end: undefined,
  page: 1,
  page_size: 10,
})

/** 告警列表 + 实时推送（监控台与告警中心共用） */
export const useAlarmStore = defineStore('alarm', () => {
  const records = ref<AlarmRecord[]>([])
  const total = ref(0)
  const loading = ref(false)
  const query = ref<AlarmQuery>(emptyQuery())
  /** 未读告警数：实时推送开启时累加，进入告警中心后清零 */
  const unread = ref(0)
  const lastPushed = ref<AlarmRecord | null>(null)

  const levelCounts = computed<Record<RiskLevel, number>>(() => {
    const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 }
    for (const row of records.value) counts[row.report.risk_level] += 1
    return counts
  })

  async function fetchList(patch: Partial<AlarmQuery> = {}): Promise<void> {
    query.value = { ...query.value, ...patch }
    loading.value = true
    try {
      const page = await api.listAlarms(query.value)
      records.value = page.items
      total.value = page.total
    } finally {
      loading.value = false
    }
  }

  function resetQuery(): void {
    query.value = emptyQuery()
  }

  /** 实时推送一条新告警（监控台 SSE / mock 演示） */
  function pushLive(record: AlarmRecord): void {
    records.value = [record, ...records.value]
    total.value += 1
    unread.value += 1
    lastPushed.value = record
  }

  function markAllRead(): void {
    unread.value = 0
  }

  return {
    records,
    total,
    loading,
    query,
    unread,
    lastPushed,
    levelCounts,
    fetchList,
    resetQuery,
    pushLive,
    markAllRead,
  }
})
