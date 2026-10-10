/**
 * 统一数据入口：所有页面只依赖本模块，不直接触碰 axios / mock。
 * VITE_USE_MOCK=false 时切换到真实后端（契约见 contracts/openapi.yaml）。
 */

import type {
  AlarmQuery,
  AlarmRecord,
  BehaviorEvent,
  ChatFrame,
  ChatFrameHandler,
  ChatRequest,
  KbDocument,
  PageResult,
  SimulateRequest,
  StatsOverview,
  VisionHealth,
} from '@/types'
import { mockApi } from '@/mock'
import { http, streamPost } from './http'

/** 默认开启 mock；后端就绪后在 .env 里设 VITE_USE_MOCK=false */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const CHAT_EVENTS = ['meta', 'delta', 'citation', 'done', 'error']

export const api = {
  /* ---------------- 感知域（vision） ---------------- */

  async visionHealth(): Promise<VisionHealth> {
    if (USE_MOCK) return mockApi.visionHealth()
    const { data } = await http.get<VisionHealth>('/vision/health')
    return data
  },

  /** 事件模拟控制台：生成一条符合契约的事件 */
  async simulate(req: SimulateRequest): Promise<BehaviorEvent> {
    if (USE_MOCK) return mockApi.simulate(req)
    const { data } = await http.post<BehaviorEvent>('/vision/simulate', req)
    return data
  },

  /**
   * 上报事件。真实后端由研判域异步研判、经 SSE 推送告警；
   * mock 模式下同步返回研判结果，便于页面直接渲染。
   */
  async reportEvent(event: BehaviorEvent): Promise<AlarmRecord | null> {
    if (USE_MOCK) return mockApi.judge(event)
    await http.post('/vision/events', event)
    return null
  },

  /** 仅 mock 模式：跑一次完整「事件 → 研判 → 告警」链路，供监控台实时演示 */
  async demoPulse(): Promise<AlarmRecord> {
    if (!USE_MOCK) throw new Error('demoPulse 仅在 mock 模式下可用，真实后端请改用 SSE 推送')
    return mockApi.demoPulse()
  },

  /* ---------------- 告警（alarms） ---------------- */

  async listAlarms(query: AlarmQuery = {}): Promise<PageResult<AlarmRecord>> {
    if (USE_MOCK) return mockApi.listAlarms(query)
    const { data } = await http.get<PageResult<AlarmRecord>>('/alarms', { params: query })
    return data
  },

  async recentAlarms(limit = 8): Promise<AlarmRecord[]> {
    if (USE_MOCK) return mockApi.recentAlarms(limit)
    const page = await api.listAlarms({ page: 1, page_size: limit })
    return page.items
  },

  /** mock 专用：监控台实时事件流。真实模式下事件由 SSE 推送。 */
  async recentEvents(limit = 12): Promise<BehaviorEvent[]> {
    if (USE_MOCK) return mockApi.recentEvents(limit)
    return []
  },

  async getAlarm(alarmId: string): Promise<AlarmRecord | null> {
    if (USE_MOCK) return mockApi.getAlarm(alarmId)
    const { data } = await http.get<AlarmRecord>(`/alarms/${alarmId}`)
    return data
  },

  async submitFeedback(alarmId: string, useful: boolean): Promise<void> {
    if (USE_MOCK) {
      mockApi.submitFeedback(alarmId, useful)
      return
    }
    await http.post(`/alarms/${alarmId}/feedback`, { useful })
  },

  /* ---------------- 知识库（kb） ---------------- */

  async listDocuments(): Promise<KbDocument[]> {
    if (USE_MOCK) return mockApi.listDocuments()
    const { data } = await http.get<KbDocument[]>('/kb/documents')
    return data
  },

  async uploadDocument(file: File): Promise<KbDocument> {
    if (USE_MOCK) return mockApi.uploadDocument(file)
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.post<KbDocument>('/kb/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteDocument(docId: string): Promise<void> {
    if (USE_MOCK) {
      mockApi.deleteDocument(docId)
      return
    }
    await http.delete(`/kb/documents/${docId}`)
  },

  /* ---------------- 统计与问答 ---------------- */

  async statsOverview(): Promise<StatsOverview> {
    if (USE_MOCK) return mockApi.statsOverview()
    const { data } = await http.get<StatsOverview>('/stats/overview')
    return data
  },

  /** SSE 流式问答 / 报告生成，帧类型见 docs/api.md */
  async streamChat(req: ChatRequest, onFrame: ChatFrameHandler, signal?: AbortSignal): Promise<void> {
    if (USE_MOCK) return mockApi.streamChat(req, onFrame, signal)
    await streamPost(
      '/chat/stream',
      req,
      (raw) => {
        if (!CHAT_EVENTS.includes(raw.event)) return
        const frame = { event: raw.event, data: JSON.parse(raw.data) } as ChatFrame
        onFrame(frame)
      },
      signal,
    )
  },
}

/** 演示数据：摄像头清单、预设剧本、示例问题（真实模式下应改为接口下发） */
export { CAMERAS, cameraOf, CHAT_SUGGESTIONS, SIM_SCRIPTS } from '@/mock/data'
export type { CameraMeta, SimScript, SimScriptStep } from '@/mock/data'
