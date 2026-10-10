/**
 * 与 contracts/*.schema.json 严格对齐的前端类型定义。
 * 契约变更时，本文件必须同步修改（契约先行纪律）。
 */

export type Species = 'goose' | 'duck' | 'chicken'
export type EventSource = 'simulator' | 'replay' | 'yolo' | 'manual'
export type BehaviorType = 'limp' | 'gather' | 'isolate'
export type RiskLevel = 'low' | 'medium' | 'high'

export const BEHAVIOR_LABELS: Record<BehaviorType, string> = {
  limp: '跛行',
  gather: '扎堆',
  isolate: '离群',
}

export const BEHAVIOR_DESC: Record<BehaviorType, string> = {
  limp: '行走姿态异常，单侧或双侧跛行',
  gather: '群体异常聚拢挤压，常见于冷应激或呼吸道不适',
  isolate: '个体脱离群体，采食饮水减少',
}

export const SOURCE_LABELS: Record<EventSource, string> = {
  simulator: '事件模拟器',
  replay: '视频回放',
  yolo: '视觉推理',
  manual: '人工录入',
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
}

/** 场景上下文 */
export interface SceneContext {
  species?: Species
  house_id?: string
  age_days?: number
  head_count?: number
}

/** 单条异常行为 */
export interface AbnormalItem {
  behavior: BehaviorType
  count: number
  duration_sec?: number
  confidence?: number
  track_ids?: number[]
  bbox?: number[][]
}

/** 正常行为统计 */
export interface NormalStat {
  total?: number
  eat?: number
  drink?: number
  lie?: number
  stand?: number
  walk?: number
}

/** 触发规则与去抖结果 */
export interface TriggerInfo {
  rule?: string
  passed?: boolean
  severity_score?: number
}

/** 行为事件契约（behavior-event.schema.json v1.0） */
export interface BehaviorEvent {
  schema_version: '1.0'
  event_id: string
  source: EventSource
  timestamp: string
  camera_id: string
  scene?: SceneContext
  abnormal: AbnormalItem[]
  normal_stat?: NormalStat
  trigger?: TriggerInfo
}

/** 带引用的结论条目 */
export interface CitedItem {
  text: string
  citations?: number[]
}

/** 引用来源 */
export interface Citation {
  idx: number
  title: string
  chapter?: string
  page?: number
  standard?: string
  section?: string
}

/** 研判报告契约（risk-report.schema.json） */
export interface RiskReport {
  alarm_id: string
  event_id?: string
  risk_level: RiskLevel
  risk_score: number
  title: string
  phenomenon: string
  causes: CitedItem[]
  actions: CitedItem[]
  citations: Citation[]
  disclaimer: string
}

/**
 * 告警列表行：契约中的 RiskReport + 列表页需要的冗余字段。
 * 后端 /alarms 返回的直接是该结构（报告嵌在 report 字段内）。
 */
export interface AlarmRecord {
  alarm_id: string
  event_id?: string
  camera_id: string
  house_id?: string
  behavior: BehaviorType
  created_at: string
  report: RiskReport
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface AlarmQuery {
  risk_level?: RiskLevel
  camera_id?: string
  start?: string
  end?: string
  page?: number
  page_size?: number
}

/** 知识库文档处理状态 */
export type KbStatus = 'pending' | 'parsing' | 'indexed' | 'failed'

export const KB_STATUS_LABELS: Record<KbStatus, string> = {
  pending: '待解析',
  parsing: '解析中',
  indexed: '已入库',
  failed: '失败',
}

export const KB_STATUS_TAG: Record<KbStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'info',
  parsing: 'warning',
  indexed: 'success',
  failed: 'danger',
}

export interface KbDocument {
  doc_id: string
  filename: string
  size_kb: number
  status: KbStatus
  chunks: number
  uploaded_at: string
  error?: string
}

export interface StatsOverview {
  events_today: number
  alarms_today: number
  high_risk_today: number
  docs_total: number
  trend: { time: string; events: number; alarms: number }[]
  level_dist: { level: RiskLevel; count: number }[]
}

export interface VisionProviderInfo {
  name: string
  mode: string
  fps: number
  running: boolean
  last_event_at: string | null
}

export interface VisionHealth {
  active: string
  providers: VisionProviderInfo[]
}

/** 事件模拟控制台请求体 */
export interface SimulateRequest {
  camera_id: string
  house_id?: string
  age_days?: number
  head_count?: number
  behaviors: BehaviorType[]
  count?: number
  duration_sec?: number
  severity?: number
  source?: EventSource
}

export type ChatMode = 'qa' | 'report'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  mode: ChatMode
  question?: string
  event_id?: string
  alarm_id?: string
  history?: ChatTurn[]
}

export interface ChatMeta {
  mode: ChatMode
  alarm_id?: string
  risk_level?: RiskLevel
  model?: string
}

export interface ChatDone {
  alarm_id?: string
  elapsed_ms: number
}

export interface ChatErrorPayload {
  code: string
  message: string
}

/** SSE 帧：/api/v1/chat/stream 的五种事件 */
export type ChatFrame =
  | { event: 'meta'; data: ChatMeta }
  | { event: 'delta'; data: { text: string } }
  | { event: 'citation'; data: Citation }
  | { event: 'done'; data: ChatDone }
  | { event: 'error'; data: ChatErrorPayload }

export type ChatFrameHandler = (frame: ChatFrame) => void

