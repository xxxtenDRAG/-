import { ref, onUnmounted } from 'vue'

export type SSEHandlers = {
  onMeta?: (data: any) => void
  onDelta?: (data: any) => void
  onCitation?: (data: any) => void
  onDone?: (data: any) => void
  onError?: (data: any) => void
}

/**
 * useSSE - 封装 EventSource 的建连、断线重连、事件分发。
 * 全站复用：智能问答打字机渲染、告警推送均走此 composable。
 */
export function useSSE(url: string, handlers: SSEHandlers = {}) {
  const connected = ref(false)
  let es: EventSource | null = null

  function connect() {
    es = new EventSource(url)
    es.onopen = () => { connected.value = true }
    es.onerror = () => { connected.value = false }

    es.addEventListener('meta', (e) => handlers.onMeta?.(JSON.parse(e.data)))
    es.addEventListener('delta', (e) => handlers.onDelta?.(JSON.parse(e.data)))
    es.addEventListener('citation', (e) => handlers.onCitation?.(JSON.parse(e.data)))
    es.addEventListener('done', (e) => {
      handlers.onDone?.(JSON.parse(e.data))
      es?.close()
    })
    es.addEventListener('error', (e) => handlers.onError?.(JSON.parse((e as MessageEvent).data)))
  }

  function close() {
    es?.close()
    connected.value = false
  }

  onUnmounted(close)

  return { connected, connect, close }
}
