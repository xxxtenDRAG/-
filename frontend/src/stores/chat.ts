import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api'
import type { ChatMode, ChatTurn, Citation, RiskLevel } from '@/types'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
  mode?: ChatMode
  riskLevel?: RiskLevel
  alarmId?: string
  elapsedMs?: number
  streaming?: boolean
  error?: string
}

/** 智能问答：消息列表 + SSE 打字机 + 中断控制 */
export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const mode = ref<ChatMode>('qa')
  const streaming = ref(false)
  /** 报告模式的上下文告警 ID */
  const contextAlarmId = ref<string | null>(null)

  let counter = 0
  let controller: AbortController | null = null

  const lastAssistant = computed(
    () => [...messages.value].reverse().find((item) => item.role === 'assistant') ?? null,
  )

  function setMode(next: ChatMode): void {
    mode.value = next
  }

  function setContext(alarmId: string | null): void {
    contextAlarmId.value = alarmId
  }

  function clear(): void {
    messages.value = []
    contextAlarmId.value = null
  }

  async function send(question: string): Promise<void> {
    const text = question.trim()
    if (!text || streaming.value) return

    counter += 1
    const userMessage: ChatMessage = { id: counter, role: 'user', content: text, citations: [] }
    counter += 1
    const assistant: ChatMessage = {
      id: counter,
      role: 'assistant',
      content: '',
      citations: [],
      mode: mode.value,
      streaming: true,
    }
    messages.value.push(userMessage, assistant)

    const history: ChatTurn[] = messages.value
      .filter((item) => item.id !== assistant.id && item.content.trim().length > 0)
      .map((item) => ({ role: item.role, content: item.content }))

    streaming.value = true
    controller = new AbortController()

    try {
      await api.streamChat(
        {
          mode: mode.value,
          question: text,
          alarm_id: contextAlarmId.value ?? undefined,
          history,
        },
        (frame) => {
          if (frame.event === 'meta') {
            assistant.riskLevel = frame.data.risk_level
            assistant.alarmId = frame.data.alarm_id
          } else if (frame.event === 'delta') {
            assistant.content += frame.data.text
          } else if (frame.event === 'citation') {
            assistant.citations.push(frame.data)
          } else if (frame.event === 'done') {
            assistant.elapsedMs = frame.data.elapsed_ms
          } else if (frame.event === 'error') {
            assistant.error = frame.data.message
          }
        },
        controller.signal,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败'
      if (message.includes('aborted')) assistant.content += '\n\n[已停止生成]'
      else assistant.error = message
    } finally {
      assistant.streaming = false
      streaming.value = false
      controller = null
    }
  }

  function stop(): void {
    controller?.abort()
    streaming.value = false
  }

  return {
    messages,
    mode,
    streaming,
    contextAlarmId,
    lastAssistant,
    setMode,
    setContext,
    clear,
    send,
    stop,
  }
})
