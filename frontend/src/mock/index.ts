/**
 * mock 引擎：在没有后端的情况下完整模拟「事件 → 研判报告 → 告警」链路。
 * 后端就绪后，api/index.ts 只需把 VITE_USE_MOCK 置为 false 即可切换。
 */

import type {
  AlarmQuery,
  AlarmRecord,
  BehaviorEvent,
  BehaviorType,
  ChatFrameHandler,
  ChatMeta,
  ChatRequest,
  Citation,
  KbDocument,
  PageResult,
  RiskLevel,
  RiskReport,
  SimulateRequest,
  StatsOverview,
  VisionHealth,
} from '@/types'
import { RISK_LABELS } from '@/types'
import {
  BEHAVIOR_KNOWLEDGE,
  CAMERAS,
  QA_FALLBACK,
  QA_POOL,
  cameraOf,
  citationsByIndex,
  kbSeedDocs,
} from './data'

const BEHAVIORS: BehaviorType[] = ['limp', 'gather', 'isolate']
const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high']

/* ------------------------------ 通用工具 ------------------------------ */

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/** 契约示例格式：evt_20261008T153000_cam001_limp */
function stampCompact(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** 契约示例格式：alm_20261008_153012 */
function alarmIdAt(d: Date): string {
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `alm_${day}_${time}_${pad(randInt(1, 999), 3)}`
}

let seq = 0

function seqId(prefix: string): string {
  seq += 1
  return `${prefix}-${pad(seq, 4)}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/* ------------------------------ 事件构造 ------------------------------ */

export function buildEvent(req: SimulateRequest, at: Date = new Date()): BehaviorEvent {
  const cam = cameraOf(req.camera_id)
  const behaviors: BehaviorType[] = req.behaviors.length ? req.behaviors : ['limp']
  const head = Math.max(1, req.head_count ?? cam.head_count)
  const severity = Number((req.severity ?? rand(0.3, 0.85)).toFixed(2))

  const abnormal = behaviors.map((behavior) => {
    const count = Math.max(1, Math.round(req.count ?? randInt(1, 3)))
    const trackIds: number[] = []
    for (let i = 0; i < Math.min(count, 6); i += 1) {
      trackIds.push(randInt(1, 99))
    }
    return {
      behavior,
      count,
      duration_sec: Number((req.duration_sec ?? randInt(5, 30)).toFixed(1)),
      confidence: Number(rand(0.62, 0.95).toFixed(2)),
      track_ids: trackIds,
    }
  })

  const eat = randInt(Math.round(head * 0.1), Math.round(head * 0.2))
  const drink = randInt(Math.round(head * 0.03), Math.round(head * 0.08))
  const lie = randInt(Math.round(head * 0.3), Math.round(head * 0.45))
  const stand = randInt(Math.round(head * 0.08), Math.round(head * 0.16))
  const walk = Math.max(0, head - eat - drink - lie - stand)

  const camCode = cam.id.replace('-', '')

  return {
    schema_version: '1.0',
    event_id: `evt_${stampCompact(at)}_${camCode}_${behaviors[0]}`,
    source: req.source ?? 'simulator',
    timestamp: at.toISOString(),
    camera_id: cam.id,
    scene: {
      species: cam.species,
      house_id: req.house_id ?? cam.house_id,
      age_days: req.age_days ?? cam.age_days,
      head_count: head,
    },
    abnormal,
    normal_stat: { total: head, eat, drink, lie, stand, walk },
    trigger: {
      rule: 'duration_sec >= 5 and count >= 1',
      passed: severity >= 0.3,
      severity_score: severity,
    },
  }
}

/* ------------------------------ 研判报告构造 ------------------------------ */

export function buildReport(event: BehaviorEvent): AlarmRecord {
  const cam = cameraOf(event.camera_id)
  const main = event.abnormal[0]
  const knowledge = BEHAVIOR_KNOWLEDGE[main.behavior]
  const severity = event.trigger?.severity_score ?? 0.5
  const riskLevel: RiskLevel = severity >= 0.7 ? 'high' : severity >= 0.4 ? 'medium' : 'low'
  const count = event.abnormal.reduce((sum, item) => sum + item.count, 0)
  const seconds = Math.max(...event.abnormal.map((item) => item.duration_sec ?? 0))
  const head = event.scene?.head_count ?? cam.head_count

  const usedIdx = Array.from(
    new Set([...knowledge.causes, ...knowledge.actions].flatMap((item) => item.citations ?? [])),
  )

  const report: RiskReport = {
    alarm_id: alarmIdAt(new Date(event.timestamp)),
    event_id: event.event_id,
    risk_level: riskLevel,
    risk_score: Number(severity.toFixed(2)),
    title: knowledge.title({ camera: cam.name, count }),
    phenomenon: knowledge.phenomenon({ camera: cam.name, count, seconds, head }),
    causes: knowledge.causes,
    actions: knowledge.actions,
    citations: citationsByIndex(usedIdx),
    disclaimer: '本报告由 AI 依据知识库生成，仅供参考，不构成兽医诊疗建议。',
  }

  return {
    alarm_id: report.alarm_id,
    event_id: event.event_id,
    camera_id: cam.id,
    house_id: cam.house_id,
    behavior: main.behavior,
    created_at: event.timestamp,
    report,
  }
}

/* ------------------------------ 内存数据库 ------------------------------ */

interface MockDb {
  events: BehaviorEvent[]
  alarms: AlarmRecord[]
  docs: KbDocument[]
  lastEventAt: string | null
}

const db: MockDb = { events: [], alarms: [], docs: [], lastEventAt: null }

/** 首次访问时注入近 24 小时的历史数据，让看板与告警列表非空 */
export function seedMockDb(): void {
  if (db.alarms.length) return
  db.docs = kbSeedDocs()
  const now = Date.now()
  for (let i = 0; i < 18; i += 1) {
    const at = new Date(now - randInt(20, 1400) * 60_000)
    const cam = pick(CAMERAS)
    const behavior = pick(BEHAVIORS)
    const event = buildEvent(
      {
        camera_id: cam.id,
        behaviors: [behavior],
        count: randInt(1, 4),
        duration_sec: randInt(5, 60),
        severity: Number(rand(0.24, 0.92).toFixed(2)),
      },
      at,
    )
    db.events.push(event)
    db.alarms.push(buildReport(event))
  }
  db.alarms.sort((a, b) => b.created_at.localeCompare(a.created_at))
  db.lastEventAt = db.alarms[0]?.created_at ?? null
}

/* ------------------------------ mock API ------------------------------ */

function answerFor(question: string): { text: string; citations: Citation[] } {
  const q = question.trim()
  const hit = QA_POOL.find((entry) => entry.keywords.some((keyword) => q.includes(keyword)))
  if (!hit) return { text: QA_FALLBACK, citations: [] }
  return { text: hit.answer, citations: citationsByIndex(hit.citations) }
}

function reportAnswerFor(record: AlarmRecord | null, question?: string): string {
  if (!record) {
    return '未找到对应的告警记录。请先到「监控预警台」或「事件模拟控制台」生成一条行为事件，再回来生成研判报告。'
  }
  const report = record.report
  const causes = report.causes.map((item, i) => `${i + 1}. ${item.text}`).join('\n')
  const actions = report.actions.map((item, i) => `${i + 1}. ${item.text}`).join('\n')
  return [
    `【${report.title}】`,
    '',
    `风险等级：${RISK_LABELS[report.risk_level]}（评分 ${Math.round(report.risk_score * 100)}/100）`,
    '',
    `现象：${report.phenomenon}`,
    '',
    '可能诱因：',
    causes,
    '',
    '处置建议：',
    actions,
    '',
    question ? `补充说明：以上结论已结合该事件的时间、圈舍与个体数量综合研判，并可在下方来源卡片中查看原文出处。` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let cursor = 0
  while (cursor < text.length) {
    const size = randInt(5, 13)
    chunks.push(text.slice(cursor, cursor + size))
    cursor += size
  }
  return chunks
}

export const mockApi = {
  visionHealth(): VisionHealth {
    seedMockDb()
    return {
      active: 'simulator',
      providers: [
        { name: '事件模拟器', mode: 'simulator', fps: 0, running: true, last_event_at: db.lastEventAt },
        { name: '预生成视频回放', mode: 'replay', fps: 25, running: false, last_event_at: null },
        { name: 'YOLOv8 实时推理', mode: 'yolo', fps: 0, running: false, last_event_at: null },
      ],
    }
  },

  simulate(req: SimulateRequest): BehaviorEvent {
    seedMockDb()
    const event = buildEvent(req)
    db.events.push(event)
    db.lastEventAt = event.timestamp
    return event
  },

  judge(event: BehaviorEvent): AlarmRecord {
    seedMockDb()
    const record = buildReport(event)
    db.alarms.unshift(record)
    return record
  },

  /** 监控台「实时推送」开关使用：一次性跑完整链路 */
  demoPulse(): AlarmRecord {
    seedMockDb()
    const cam = pick(CAMERAS)
    const behavior = pick(BEHAVIORS)
    const event = buildEvent({
      camera_id: cam.id,
      behaviors: [behavior],
      count: randInt(1, 4),
      duration_sec: randInt(5, 45),
      severity: Number(rand(0.28, 0.95).toFixed(2)),
    })
    db.events.push(event)
    db.lastEventAt = event.timestamp
    return mockApi.judge(event)
  },

  listAlarms(query: AlarmQuery = {}): PageResult<AlarmRecord> {
    seedMockDb()
    const page = query.page ?? 1
    const pageSize = query.page_size ?? 20
    let rows = db.alarms.slice()
    const level = query.risk_level
    const cameraId = query.camera_id
    const start = query.start
    const end = query.end
    if (level) rows = rows.filter((row) => row.report.risk_level === level)
    if (cameraId) rows = rows.filter((row) => row.camera_id === cameraId)
    if (start) rows = rows.filter((row) => Date.parse(row.created_at) >= Date.parse(start))
    if (end) rows = rows.filter((row) => Date.parse(row.created_at) <= Date.parse(end))
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      page,
      page_size: pageSize,
    }
  },

  recentAlarms(limit = 8): AlarmRecord[] {
    seedMockDb()
    return db.alarms.slice(0, limit)
  },

  recentEvents(limit = 12): BehaviorEvent[] {
    seedMockDb()
    return db.events.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
  },

  getAlarm(alarmId: string): AlarmRecord | null {
    seedMockDb()
    return db.alarms.find((row) => row.alarm_id === alarmId) ?? null
  },

  submitFeedback(alarmId: string, useful: boolean): { alarm_id: string; useful: boolean } {
    return { alarm_id: alarmId, useful }
  },

  listDocuments(): KbDocument[] {
    seedMockDb()
    return db.docs.slice().sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
  },

  async uploadDocument(file: File): Promise<KbDocument> {
    seedMockDb()
    const doc: KbDocument = {
      doc_id: seqId('doc'),
      filename: file.name,
      size_kb: Math.max(1, Math.round(file.size / 1024)),
      status: 'parsing',
      chunks: 0,
      uploaded_at: new Date().toISOString(),
    }
    db.docs.unshift(doc)
    await sleep(1800)
    doc.status = 'indexed'
    doc.chunks = randInt(40, 420)
    return doc
  },

  deleteDocument(docId: string): void {
    seedMockDb()
    const index = db.docs.findIndex((doc) => doc.doc_id === docId)
    if (index >= 0) db.docs.splice(index, 1)
  },

  statsOverview(): StatsOverview {
    seedMockDb()
    const now = Date.now()
    const dayMs = 86_400_000
    const inDay = (iso: string) => now - new Date(iso).getTime() < dayMs
    const todayAlarms = db.alarms.filter((row) => inDay(row.created_at))
    const trend = Array.from({ length: 12 }, (_, index) => {
      const bucketEnd = now - (11 - index) * 2 * 3_600_000
      const bucketStart = bucketEnd - 2 * 3_600_000
      const within = (iso: string) => {
        const t = new Date(iso).getTime()
        return t > bucketStart && t <= bucketEnd
      }
      return {
        time: `${pad(new Date(bucketEnd).getHours())}:00`,
        events: db.events.filter((event) => within(event.timestamp)).length,
        alarms: db.alarms.filter((row) => within(row.created_at)).length,
      }
    })
    return {
      events_today: db.events.filter((event) => inDay(event.timestamp)).length,
      alarms_today: todayAlarms.length,
      high_risk_today: todayAlarms.filter((row) => row.report.risk_level === 'high').length,
      docs_total: db.docs.length,
      trend,
      level_dist: RISK_LEVELS.map((level) => ({
        level,
        count: todayAlarms.filter((row) => row.report.risk_level === level).length,
      })),
    }
  },

  async streamChat(req: ChatRequest, onFrame: ChatFrameHandler, signal?: AbortSignal): Promise<void> {
    seedMockDb()
    const startedAt = Date.now()
    const record = req.alarm_id ? mockApi.getAlarm(req.alarm_id) : null
    const meta: ChatMeta = {
      mode: req.mode,
      alarm_id: record?.alarm_id,
      risk_level: record?.report.risk_level,
      model: 'mock-llm',
    }
    onFrame({ event: 'meta', data: meta })

    let text: string
    let citations: Citation[]
    if (req.mode === 'report') {
      text = reportAnswerFor(record, req.question)
      citations = record?.report.citations ?? []
    } else {
      const answer = answerFor(req.question ?? '')
      text = answer.text
      citations = answer.citations
    }

    for (const chunk of chunkText(text)) {
      if (signal?.aborted) throw new Error('aborted')
      await sleep(randInt(16, 42))
      onFrame({ event: 'delta', data: { text: chunk } })
    }

    for (const citation of citations) {
      onFrame({ event: 'citation', data: citation })
    }

    onFrame({ event: 'done', data: { alarm_id: record?.alarm_id, elapsed_ms: Date.now() - startedAt } })
  },
}
