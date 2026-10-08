# API 接口文档

> 完整的 OpenAPI 规范见 [contracts/openapi.yaml](../contracts/openapi.yaml)，启动后端后访问 `/docs` 查看交互式文档。

## 接口清单

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/vision/events` | 视觉域/模拟器上报行为事件 |
| POST | `/api/v1/vision/simulate` | 前端控制台手动生成事件（含演示剧本） |
| GET | `/api/v1/vision/health` | 视觉 Provider 状态（mode、fps、最后事件时间） |
| POST | `/api/v1/chat/stream` | SSE：mode=qa 问答 / mode=report&event_id=xxx 生成研判报告 |
| GET | `/api/v1/alarms` | 告警分页查询（等级、时间区间、摄像头筛选） |
| GET | `/api/v1/alarms/{alarm_id}` | 告警详情（含完整报告与引用） |
| POST | `/api/v1/alarms/{alarm_id}/feedback` | 用户对报告的有用/无用反馈 |
| POST | `/api/v1/kb/documents` | 上传 PDF/DOCX，触发解析入库（异步任务） |
| GET | `/api/v1/kb/documents` | 知识库文档列表与处理状态 |
| DELETE | `/api/v1/kb/documents/{doc_id}` | 删除文档及其向量 |
| GET | `/api/v1/stats/overview` | 看板统计（今日事件数、告警数、等级分布、趋势） |
| GET | `/api/v1/meta/contracts/behavior-event.json` | 契约文件对外暴露，便于联调 |

## SSE 事件协议

`/api/v1/chat/stream` 响应为 `text/event-stream`，事件类型如下：

| event | data 示例 | 说明 |
|-------|-----------|------|
| `meta` | `{"alarm_id":"...","risk_level":"high"}` | 报告元信息（告警 ID、风险等级） |
| `delta` | `{"text":"小鹅瘟的典型症状包括"}` | 流式文本增量（打字机渲染） |
| `citation` | `{"idx":1,"title":"鹅病防治手册","chapter":"第三章","page":57}` | 引用来源 |
| `done` | `{"alarm_id":"...","elapsed_ms":4200}` | 流结束 |
| `error` | `{"code":"LLM_TIMEOUT","message":"..."}` | 错误 |

## 事件上报示例

```json
POST /api/v1/vision/events
Content-Type: application/json

{
  "schema_version": "1.0",
  "event_id": "evt_20261008T153000_cam001_limp",
  "source": "simulator",
  "timestamp": "2026-10-08T15:30:00+08:00",
  "camera_id": "cam-001",
  "scene": { "species": "goose", "house_id": "house-01", "age_days": 45, "head_count": 42 },
  "abnormal": [
    { "behavior": "limp", "count": 2, "duration_sec": 8, "confidence": 0.78, "track_ids": [12, 27] }
  ],
  "normal_stat": { "total": 42, "eat": 12, "drink": 5, "lie": 20, "stand": 4, "walk": 1 },
  "trigger": { "rule": "duration_sec >= 5 and count >= 1", "passed": true, "severity_score": 0.72 }
}
```
