# 贡献指南

本仓库采用 Monorepo + Issue 驱动 + 契约先行的协作方式。请在贡献前阅读本文档。

## 分支模型

| 分支 | 用途 | 规则 |
|------|------|------|
| `main` | 可运行、可演示的稳定版 | 受保护，禁止直接 push，只能通过 PR 合入 |
| `develop` | 集成分支 | 日常合并目标，每周日合入 main 并打 tag |
| `feat/<scope>-<desc>` | 功能开发 | 例：`feat/agents-evaluate-loop` |
| `fix/<scope>-<desc>` | 缺陷修复 | 例：`fix/sse-reconnect` |
| `chore/<desc>` | 杂项 | 例：`chore/ci-pytest` |

流程：`feat/*` → PR → `develop` → 每周 → PR → `main` + tag `v0.x.0-mN`

## 契约先行（最重要的纪律）

**任何接口变更，必须先改 `contracts/` 并单独提一个 PR，双方确认后才允许写实现代码。**

- `contracts/behavior-event.schema.json` — 行为事件契约
- `contracts/risk-report.schema.json` — 研判报告契约
- `contracts/openapi.yaml` — API 契约

后端用 FastAPI 自动生成 openapi，前端用 `openapi-typescript` 生成 TS 类型。

## Issue 驱动开发

一切工作先开 Issue，禁止"直接写代码再说"。

Issue 模板四类：`feature`（功能）、`bug`（缺陷）、`task`（子任务）、`epic`（里程碑）。

每个 Issue 必须含：目标 / 验收标准 / 涉及契约变更（有/无）/ 预计工时。

使用 GitHub Projects 看板，列：Backlog → Todo → In Progress → In Review → Done。
每人同时 In Progress 的 Issue 不超过 1 个。

## PR 规范

- PR 标题带 Issue 号：`feat(agents): 实现评估节点循环回退 (#23)`
- PR 描述必须包含：`Closes #23`、变更说明、联调影响面、自测截图/录屏
- 必须由另一位成员 Review 后合并
- 单 PR 改动建议 < 400 行，超过就拆
- 使用 **Squash and merge**，保持 develop 历史干净
- CI 必须绿才能合并

## 环境与密钥

- `.env.example` 提交仓库（只含 key 名与示例值）
- `.env` 写进 `.gitignore`，永不提交
- 所有 API Key 只出现在后端环境变量，前端代码里绝对不出现任何密钥
- 提交前用 pre-commit 钩子扫一遍密钥

## 大文件策略

模型权重（`.pt`）、演示视频（`.mp4`）、知识库 PDF 一律不进 Git。
权重与视频走 GitHub Releases 或网盘，在 README.md 中给出下载脚本。

## 本地启动

```bash
# 后端
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -e ".[dev]"
cp ../.env.example ../.env   # 填入真实密钥
python -m uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```
