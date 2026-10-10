/**
 * mock 模式的静态知识：摄像头、引用池、行为知识、演示剧本、问答语料。
 * 后端就绪后本文件仅用于本地演示与单测，不参与生产构建路径。
 */

import type { BehaviorType, Citation, CitedItem, KbDocument, Species } from '@/types'

export interface CameraMeta {
  id: string
  name: string
  house_id: string
  species: Species
  age_days: number
  head_count: number
}

/** 演示用画面清单，id 即契约中的 camera_id */
export const CAMERAS: CameraMeta[] = [
  { id: 'cam-001', name: '育雏舍 A 区', house_id: 'house-01', species: 'goose', age_days: 18, head_count: 120 },
  { id: 'cam-002', name: '育成舍 B 区', house_id: 'house-02', species: 'goose', age_days: 45, head_count: 86 },
  { id: 'cam-003', name: '育肥舍 C 区', house_id: 'house-03', species: 'goose', age_days: 68, head_count: 64 },
]

export function cameraOf(id: string): CameraMeta {
  return CAMERAS.find((c) => c.id === id) ?? CAMERAS[0]
}

/** 引用池，idx 即 risk-report.citations[].idx */
export const CITATION_POOL: Citation[] = [
  { idx: 1, title: '《鹅病防治手册》', chapter: '第三章 常见传染病', page: 57 },
  { idx: 2, title: '《家禽生产学》（第四版）', chapter: '第五章 环境与饲养管理', page: 132 },
  { idx: 3, title: '《兽医临床诊断学》', chapter: '第七章 运动机能障碍', page: 211 },
  { idx: 4, title: '《无公害农产品 兽药使用准则》', section: '4.3 兽药使用', standard: 'NY/T 5030-2016' },
  { idx: 5, title: '《病害动物和病害动物产品生物安全处理规程》', section: '5.2 处理方式', standard: 'GB 16548-2006' },
  { idx: 6, title: '《鹅高效养殖技术》', chapter: '第二章 饲养密度与圈舍设计', page: 88 },
  { idx: 7, title: '《禽病学》（第十二版）', chapter: '第三十一章 鸭鹅传染病', page: 1102 },
  { idx: 8, title: '《动物疫病防控技术规范》', chapter: '附录 B 常见禽病鉴别诊断', page: 246 },
]

export function citationsByIndex(indices: number[]): Citation[] {
  return indices
    .map((i) => CITATION_POOL.find((c) => c.idx === i))
    .filter((c): c is Citation => Boolean(c))
    .sort((a, b) => a.idx - b.idx)
}

export interface BehaviorKnowledge {
  title: (ctx: { camera: string; count: number }) => string
  phenomenon: (ctx: { camera: string; count: number; seconds: number; head: number }) => string
  causes: CitedItem[]
  actions: CitedItem[]
}

/** 三类异常行为的领域知识与处置建议（一期由 mock 提供，二期改由知识库生成） */
export const BEHAVIOR_KNOWLEDGE: Record<BehaviorType, BehaviorKnowledge> = {
  limp: {
    title: ({ camera, count }) => `${camera} 检出 ${count} 只跛行个体，疑似浆膜炎或营养性骨病`,
    phenomenon: ({ camera, count, seconds, head }) =>
      `${camera} 画面内共 ${head} 只，检测到 ${count} 只个体连续 ${seconds} 秒呈现单侧跛行、步态不稳，行进速度明显低于群体均值。`,
    causes: [
      { text: '饲料钙磷比例失衡或维生素 D3 缺乏，导致骨骼与关节发育异常。', citations: [2, 6] },
      { text: '传染性浆膜炎、禽葡萄球菌病等感染引起关节肿胀与疼痛。', citations: [1, 7] },
      { text: '地面湿滑、网床破损或垫料板结，造成机械性扭伤与脚掌损伤。', citations: [2, 3] },
    ],
    actions: [
      { text: '立即将跛行个体隔离至干燥平整的小栏，单独饲喂并每日记录采食量与步态变化。', citations: [3] },
      { text: '核查饲料钙磷比（育成期建议 1.2~1.5:1）并补充维生素 D3，必要时送检饲料。', citations: [2, 6] },
      { text: '排查圈舍地面与网床，清除尖锐物、更换潮湿垫料，保持地面干燥。', citations: [2] },
      { text: '若 24 小时内新增跛行个体超过 3 只，采样送检排查传染性浆膜炎并按兽医处方用药。', citations: [1, 7] },
      { text: '用药须符合休药期规定，病死鹅按生物安全规程无害化处理。', citations: [4, 5] },
    ],
  },
  gather: {
    title: ({ camera }) => `${camera} 出现群体扎堆挤压，警惕冷应激与呼吸道疾病`,
    phenomenon: ({ camera, count, seconds, head }) =>
      `${camera} 画面内 ${head} 只中约 ${count} 只持续 ${seconds} 秒向角落聚集挤压，个体间距显著小于正常值，采食与饮水活动减少。`,
    causes: [
      { text: '舍内温度低于该日龄适宜区间，雏鹅聚堆取暖，长时间挤压易造成底层个体窒息。', citations: [2, 6] },
      { text: '贼风直吹或光照不均，个体趋避至某一局部区域。', citations: [2] },
      { text: '呼吸道疾病前期不适，个体精神沉郁并相互靠拢。', citations: [7, 1] },
    ],
    actions: [
      { text: '立即测量舍内多点温度与风速，按日龄调整保温设备（雏鹅第一周 28~32℃，此后每周降 2~3℃）。', citations: [2, 6] },
      { text: '封堵贼风入口，平衡通风与保温，避免舍内温差超过 3℃。', citations: [2] },
      { text: '观察是否出现咳嗽、甩鼻、流泪等呼吸道症状，同步记录采食量与饮水量变化。', citations: [7] },
      { text: '扩大有效活动面积、增加料位与水位，防止过度拥挤。', citations: [6] },
      { text: '出现呼吸道症状时及时隔离并联系兽医，按规范用药。', citations: [1, 4] },
    ],
  },
  isolate: {
    title: ({ camera, count }) => `${camera} 检出 ${count} 只离群个体，需排查疾病与弱雏`,
    phenomenon: ({ camera, count, seconds }) =>
      `${camera} 画面内 ${count} 只个体持续 ${seconds} 秒脱离群体，独自停留于栏舍边缘，采食饮水参与度低。`,
    causes: [
      { text: '个体患病后精神沉郁并被群体排斥，常见于消化道或呼吸道感染早期。', citations: [1, 7] },
      { text: '弱雏先天发育不良或体重偏低，在采食竞争中处于劣势。', citations: [6] },
      { text: '料位或水位不足、分布不均，导致个体被动离群。', citations: [6] },
    ],
    actions: [
      { text: '隔离离群个体，测量体重与体温，检查粪便性状与精神状态。', citations: [3] },
      { text: '核对料位与水位数量（建议每只鹅不少于 10cm 料位），必要时增加饲喂点。', citations: [6] },
      { text: '对弱雏单独补饲，使用高营养开食料并适当延长光照时间。', citations: [6] },
      { text: '若离群个体持续增加，采样送检并排查传染病。', citations: [1, 7] },
      { text: '病死个体按 GB 16548 规定无害化处理，严禁食用或出售。', citations: [5] },
    ],
  },
}

/** 事件模拟控制台的预设演示剧本 */
export interface SimScriptStep {
  delay_ms: number
  camera_id: string
  behavior: BehaviorType
  count: number
  duration_sec: number
  severity: number
}

export interface SimScript {
  id: string
  name: string
  desc: string
  steps: SimScriptStep[]
}

export const SIM_SCRIPTS: SimScript[] = [
  {
    id: 'script-limp-outbreak',
    name: '跛行暴发',
    desc: '育成舍 B 区连续三次跛行，严重度递增，用于演示高危告警与溯源',
    steps: [
      { delay_ms: 0, camera_id: 'cam-002', behavior: 'limp', count: 1, duration_sec: 6, severity: 0.42 },
      { delay_ms: 1200, camera_id: 'cam-002', behavior: 'limp', count: 3, duration_sec: 12, severity: 0.68 },
      { delay_ms: 1200, camera_id: 'cam-002', behavior: 'limp', count: 5, duration_sec: 21, severity: 0.86 },
    ],
  },
  {
    id: 'script-cold-gather',
    name: '夜间冷应激',
    desc: '育雏舍 A 区扎堆挤压，中等风险，用于演示保温与通风处置建议',
    steps: [
      { delay_ms: 0, camera_id: 'cam-001', behavior: 'gather', count: 24, duration_sec: 40, severity: 0.55 },
      { delay_ms: 1500, camera_id: 'cam-001', behavior: 'gather', count: 41, duration_sec: 95, severity: 0.74 },
    ],
  },
  {
    id: 'script-mixed',
    name: '混合异常',
    desc: '离群与跛行并发，用于演示多行为事件的综合研判',
    steps: [
      { delay_ms: 0, camera_id: 'cam-003', behavior: 'isolate', count: 2, duration_sec: 60, severity: 0.45 },
      { delay_ms: 1400, camera_id: 'cam-003', behavior: 'limp', count: 2, duration_sec: 15, severity: 0.62 },
      { delay_ms: 1400, camera_id: 'cam-002', behavior: 'gather', count: 18, duration_sec: 55, severity: 0.5 },
    ],
  },
]

/** 智能问答页的示例问题 */
export const CHAT_SUGGESTIONS: string[] = [
  '小鹅瘟的早期症状有哪些？',
  '雏鹅跛行可能是什么原因？',
  'NY/T 5030 对兽药休药期是怎么规定的？',
  '冬季育雏舍温度应该控制在多少？',
  '扎堆和呼吸道疾病有什么关联？',
]

export interface QaEntry {
  keywords: string[]
  answer: string
  citations: number[]
}

/** mock 问答语料：命中关键词即返回对应答案 */
export const QA_POOL: QaEntry[] = [
  {
    keywords: ['小鹅瘟', '瘟', '症状'],
    answer:
      '小鹅瘟由鹅细小病毒引起，主要危害 3~20 日龄雏鹅。早期表现为精神沉郁、离群呆立、食欲下降，随后出现腹泻，粪便呈黄白色或黄绿色并混有气泡。部分个体出现神经症状，如头颈扭转、抽搐。剖检可见肠道黏膜脱落、形成腊肠样栓子。防控核心是种鹅免疫与雏鹅早期抗血清/卵黄抗体注射，发病后应立即隔离并上报。',
    citations: [1, 7, 8],
  },
  {
    keywords: ['跛行', '站不稳', '腿', '关节'],
    answer:
      '雏鹅跛行通常分为营养性与感染性两类。营养性跛行多因饲料钙磷比失衡、维生素 D3 缺乏或锰不足，表现为骨骼软化、关节肿大但不发热。感染性跛行常见于传染性浆膜炎、禽葡萄球菌病，关节局部发热肿胀，个体常伴随精神沉郁与采食下降。建议先隔离并检查饲料配方，若 24 小时内新增跛行超过 3 只，采样送检以排除感染因素。',
    citations: [1, 3, 7],
  },
  {
    keywords: ['休药期', '兽药', '用药', 'NY/T', '5030'],
    answer:
      'NY/T 5030-2016 属于无公害农产品兽药使用准则，要求所有用药必须在兽医指导下进行，并严格执行标签规定的给药途径、剂量与休药期。禁止使用国家明令禁用的兽药和其他化合物，禁止将原料药直接添加到饲料及饮水中。同一圈舍在休药期内出栏的产品不得作为无公害农产品销售，用药记录须保存不少于两年。',
    citations: [4],
  },
  {
    keywords: ['温度', '保温', '雏鹅', '冷', '温差'],
    answer:
      '育雏温度建议：第 1 周 28~32℃，此后每周下降 2~3℃，至第 4 周降至 20~22℃。判断标准以群体行为为准——均匀散开、安静趴卧为适宜，聚堆挤压说明温度偏低，远离热源张口呼吸说明温度偏高。同时需注意舍内昼夜温差不超过 3℃，并避免贼风直吹，保温与通风要平衡，防止为保温而牺牲空气质量。',
    citations: [2, 6],
  },
  {
    keywords: ['扎堆', '聚堆', '挤压', '拥挤'],
    answer:
      '扎堆是冷应激最直观的行为信号，也可能是呼吸道疾病前期的表现。长时间挤压会造成底层个体窒息、腿部受压损伤，并加剧呼吸道病原传播。处置上先测温测风速、核对日龄适宜温度区间，再封堵贼风并调整通风。若同时出现咳嗽、甩鼻、流泪等症状，应考虑呼吸道疾病，及时隔离并联系兽医诊断。',
    citations: [2, 7],
  },
]

export const QA_FALLBACK =
  '该问题暂未在演示知识库中命中高相关片段。一期知识库以《鹅病防治手册》《家禽生产学》《禽病学》与 NY/T 5030 等标准为主，建议换个说法，或直接询问异常行为的诱因与处置建议（如跛行、扎堆、离群）。正式版本将由向量检索与知识图谱双通道召回后作答。'

/** 知识库文档初始数据 */
export function kbSeedDocs(): KbDocument[] {
  const now = Date.now()
  const ago = (hours: number) => new Date(now - hours * 3600_000).toISOString()
  return [
    { doc_id: 'doc-001', filename: '鹅病防治手册.pdf', size_kb: 18432, status: 'indexed', chunks: 486, uploaded_at: ago(72) },
    { doc_id: 'doc-002', filename: '家禽生产学（第四版）.pdf', size_kb: 32768, status: 'indexed', chunks: 812, uploaded_at: ago(70) },
    { doc_id: 'doc-003', filename: '禽病学（第十二版）.pdf', size_kb: 65536, status: 'indexed', chunks: 1560, uploaded_at: ago(48) },
    { doc_id: 'doc-004', filename: '鹅高效养殖技术.pdf', size_kb: 12288, status: 'indexed', chunks: 342, uploaded_at: ago(30) },
    { doc_id: 'doc-005', filename: 'NY-T-5030-2016 兽药使用准则.pdf', size_kb: 2048, status: 'indexed', chunks: 68, uploaded_at: ago(26) },
    { doc_id: 'doc-006', filename: '育雏期温湿度管理规范.docx', size_kb: 640, status: 'parsing', chunks: 0, uploaded_at: ago(1) },
  ]
}
