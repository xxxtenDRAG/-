# 鹅疫智答 · 风险预警平台

> 基于「事件驱动 Agentic-RAG 多智能体」的家禽（鹅）养殖风险智能预警平台

面向中小型家禽（以鹅为核心示范场景）养殖场，用标准化异常行为事件驱动一套 LangGraph 多智能体 RAG 系统，把"看见的现象"自动转化为**可溯源的风险等级 + 诱因分析 + 处置建议**，并在前端完成监控、告警、问答的完整交互闭环。

---

## 核心特性

- **事件驱动的研判闭环**：标准化 `BehaviorEvent` 事件 → LangGraph 五智能体（理解/检索/评估/生成/溯源）→ 结构化风险报告 → SSE 推送前端
- **双通道知识检索**：向量语义检索 + 知识图谱多跳推理，Louvain 社区检测优先召回，检索-评估-重查循环（最多 3 轮）保证质量
- **结论可溯源**：每条结论附带教材/标准来源引用，前端可展开查看原文片段
- **视觉能力可插拔**：感知域抽象为 `VisionProvider` 接口，支持 L0 事件模拟器 → L1 预生成检测视频 → L2 检测+跟踪+规则 → L3 自训练模型 四级渐进升级，**一期无需 CV 能力即可完整验证业务价值**
- **契约先行**：前后端通过 `contracts/` 中的 JSON Schema + OpenAPI 契约解耦，80% 的接口返工被消灭在设计阶段

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | Vue3 + Vite + TypeScript + Element-Plus + ECharts + Pinia |
| 后端 | FastAPI (Python 3.11) + Pydantic + SQLAlchemy |
| 智能体 | LangGraph（五智能体状态机 + 条件循环） |
| RAG | LlamaIndex + ChromaDB + DashScope Embedding/Rerank |
| 知识图谱 | NetworkX + Louvain 社区检测 |
| 数据库 | MySQL 8 + ChromaDB (persist) |
| 视觉 | Ultralytics YOLOv8（L1+，官方权重起）+ ByteTrack |
| 通信 | REST + SSE（Server-Sent Events） |
| 部署 | Docker Compose |

## 目录结构

```
goose-risk-guard/
├── contracts/                  # 唯一事实源，改动必须双方 review
│   ├── behavior-event.schema.json   # 行为事件契约（系统心脏）
│   ├── risk-report.schema.json      # 研判报告契约
│   └── openapi.yaml                 # API 契约
├── backend/                    # FastAPI 后端
│   └── app/
│       ├── api/v1/             # 路由
│       ├── agents/             # 五大 Agent + LangGraph 状态机
│       ├── rag/                # 解析、分块、向量、知识图谱
│       ├── vision/             # VisionProvider（simulator/replay/yolo）
│       ├── models/             # SQLAlchemy ORM
│       ├── schemas/            # Pydantic 模型
│       └── core/               # 配置、日志、异常
├── frontend/                   # Vue3 前端
│   └── src/
│       ├── views/              # 监控台/模拟控制台/告警中心/智能问答/知识库
│       ├── components/
│       ├── composables/        # useSSE 等
│       ├── api/
│       ├── stores/             # Pinia
│       └── styles/             # 深绿色主题
├── vision/                     # 感知域（一期只有模拟器与回放）
│   ├── simulator/              # 事件剧本 jsonl
│   ├── replay/                 # 预生成带框视频 + 脚本
│   └── rules/                  # L2 规则引擎（二期）
├── kb/                         # 知识库源文件与构建脚本
│   ├── sources/                # PDF（不进 Git，走网盘/Release）
│   └── build/                  # 解析入库脚本
├── deploy/                     # docker-compose.yml、.env.example
├── docs/                       # architecture / database / api / roadmap
├── scripts/                    # dev_up.sh、seed_db.py、gen_video.sh
├── .github/                    # CI workflow、Issue/PR 模板
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

## 快速开始

### 1. 克隆与环境

```bash
git clone <repo-url>
cd goose-risk-guard
cp .env.example .env          # 填入 DeepSeek / DashScope API Key 与数据库密码
```

### 2. 启动后端

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --port 8000
```

后端启动后访问 http://localhost:8000/docs 查看交互式 API 文档。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端访问 http://localhost:5173。

### 4. 一键启动（需 Docker）

```bash
bash scripts/dev_up.sh
```

## 核心概念

### 行为事件契约（BehaviorEvent）

所有行为事件的唯一格式，见 [contracts/behavior-event.schema.json](contracts/behavior-event.schema.json)。**只要这份契约不变，`source` 字段从 `simulator` 改成 `yolo`，后端和前端零改动就能从"模拟演示"升级为"真实视觉"。**

### 视觉适配层（Vision Adapter）

感知域对上层只暴露"事件流"，交互域和研判域永远不感知感知域的实现细节。新增视觉能力只需实现 `VisionProvider` 协议并在 `registry.py` 注册，业务代码零改动。

### 五智能体研判

```
understand → retrieve → evaluate ⇄ (重查，≤3轮) → generate → trace → END
```

- **Query 理解**：事件→检索式改写；问题→意图识别、实体抽取、Query 改写
- **检索**：向量通道 + 图谱通道并行，结果融合
- **评估**：计算检索相关性、信息充分度；不达标则回退改写重检
- **生成**：按模板生成风险报告（风险等级、现象解读、可能诱因、处置建议）
- **溯源**：为每条结论附加来源（教材名 + 章节 + 页码 + 标准号）

## 里程碑

| 里程碑 | 时间 | 目标 |
|--------|------|------|
| M0 立项与骨架 | 2026.10 - 11.07 | 仓库、契约、环境、需求收敛 |
| M1 研判内核贯通 | 2026.11 - 12.19 | 事件→报告全链路 |
| M2 交互闭环 | 2026.12 - 2027.02 | 前后端联调，五大页面可用 |
| M3 参赛材料+校赛 | 2027.02 - 03 | 申报书、演示视频、答辩 PPT |
| M4 大创+省赛 | 2027.04 - 05 | 省级赛提交、大创立项 |
| M5 视觉升级 | 2027.05 - 06 | L2 规则引擎（有余力） |
| M6 国赛冲刺 | 2027.07 - 08 | 国赛材料+现场演示 |

详细排期见 [docs/roadmap.md](docs/roadmap.md)。

## 文档

- [系统架构](docs/architecture.md)
- [数据库设计](docs/database.md)
- [API 接口文档](docs/api.md)
- [开发路线图](docs/roadmap.md)
- [贡献指南](CONTRIBUTING.md)

## 团队分工

| 角色 | 职责 |
|------|------|
| 后端/智能体负责人 | 仓库与契约维护；FastAPI 全部接口；LangGraph 五智能体；RAG 与知识库；知识图谱；MySQL；SSE；视觉适配层与模拟器；CI |
| 前端/交付负责人 | Vue3 项目搭建；五个页面与组件；SSE 打字机与告警弹窗；ECharts 统计；UI 与深绿主题；演示视频与截图；答辩 PPT 视觉 |
| 共同承担 | 申报书撰写、架构图/ER 图、每周联调、答辩演练 |

## 目标赛事

中国大学生计算机设计大赛（人工智能应用 / 软件应用与开发）、国家级大学生创新训练计划（大创）、挑战杯大挑。

## 免责声明

本系统由 AI 依据知识库生成研判报告，仅供参考，不构成兽医诊疗建议。
