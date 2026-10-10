import axios, { type AxiosInstance } from 'axios'

/** 后端基地址，开发期走 vite proxy（/api -> http://localhost:8000） */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const detail =
      typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined
    const message = detail ?? (error instanceof Error ? error.message : '请求失败')
    return Promise.reject(new Error(String(message)))
  },
)

export interface RawSSEFrame {
  event: string
  data: string
}

/** 从缓冲区切出第一个完整 SSE 帧（兼容 \n\n 与 \r\n\r\n 分隔） */
function takeFrame(buffer: string): { frame: string; rest: string } | null {
  const match = /(?:\r?\n){2}/.exec(buffer)
  if (!match || match.index === undefined) return null
  return {
    frame: buffer.slice(0, match.index),
    rest: buffer.slice(match.index + match[0].length),
  }
}

function parseFrame(raw: string): RawSSEFrame | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (!dataLines.length) return null
  return { event, data: dataLines.join('\n') }
}

/**
 * POST + SSE：EventSource 只支持 GET，问答接口需要 POST，故用 fetch 流式读取。
 * 这是 chat/stream 契约在前端的唯一实现点。
 */
export async function streamPost(
  path: string,
  body: unknown,
  onFrame: (frame: RawSSEFrame) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok || !response.body) {
    throw new Error(`流式接口连接失败：HTTP ${response.status}`)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let taken = takeFrame(buffer)
    while (taken) {
      buffer = taken.rest
      const frame = parseFrame(taken.frame)
      if (frame) onFrame(frame)
      taken = takeFrame(buffer)
    }
  }
}
