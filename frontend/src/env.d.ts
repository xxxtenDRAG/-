/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /** 为 'false' 时走真实后端接口，默认使用 mock 数据 */
  readonly VITE_USE_MOCK?: string
  /** 后端 API 基地址，默认 /api/v1（开发期由 vite proxy 转发） */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
