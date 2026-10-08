# 数据库设计

## ER 概览

```
behavior_event 1 ──< N alarm_record
chat_session 1 ──< N chat_message
kb_document 1 ──< N kb_chunk
alarm_record 1 ──< N report_feedback
sys_config (key-value 配置表)
```

## 核心表 DDL

```sql
CREATE TABLE behavior_event (
  event_id    VARCHAR(64) PRIMARY KEY,
  camera_id   VARCHAR(64) NOT NULL,
  source      VARCHAR(16) NOT NULL,
  event_json  JSON NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_camera_time (camera_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alarm_record (
  alarm_id        VARCHAR(64) PRIMARY KEY,
  event_id        VARCHAR(64),
  camera_id       VARCHAR(64) NOT NULL,
  risk_level      TINYINT NOT NULL COMMENT '0低 1中 2高',
  risk_score      DECIMAL(4,3),
  report_content  TEXT,
  citations       JSON,
  status          TINYINT DEFAULT 0 COMMENT '0待处理 1已处理',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level_time (risk_level, created_at),
  CONSTRAINT fk_alarm_event FOREIGN KEY (event_id) REFERENCES behavior_event(event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_session (
  session_id  VARCHAR(64) PRIMARY KEY,
  title       VARCHAR(255),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_message (
  msg_id      VARCHAR(64) PRIMARY KEY,
  session_id  VARCHAR(64) NOT NULL,
  role        VARCHAR(16) NOT NULL,
  content     MEDIUMTEXT,
  citations   JSON,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_time (session_id, created_at),
  CONSTRAINT fk_msg_session FOREIGN KEY (session_id) REFERENCES chat_session(session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE kb_document (
  doc_id      VARCHAR(64) PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  file_path   VARCHAR(512),
  source_type VARCHAR(32),
  status      VARCHAR(16) DEFAULT 'pending',
  chunk_count INT DEFAULT 0,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE kb_chunk (
  chunk_id   VARCHAR(64) PRIMARY KEY,
  doc_id     VARCHAR(64) NOT NULL,
  chapter    VARCHAR(255),
  page       INT,
  text_hash  CHAR(64),
  INDEX idx_doc (doc_id),
  CONSTRAINT fk_chunk_doc FOREIGN KEY (doc_id) REFERENCES kb_document(doc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sys_config (
  cfg_key   VARCHAR(64) PRIMARY KEY,
  cfg_value VARCHAR(255),
  remark    VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE report_feedback (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  alarm_id   VARCHAR(64) NOT NULL,
  rating     TINYINT COMMENT '1有用 0无用',
  comment    VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alarm (alarm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 可配置阈值（sys_config 表）

| key | 默认值 | 说明 |
|-----|--------|------|
| min_duration_sec | 5 | 异常持续时长下限 |
| min_count | 1 | 异常个体数下限 |
| cooldown_sec | 120 | 同一 camera + behavior 的告警冷却（防刷屏） |
| severity_limp | 0.8 | 跛行严重度权重 |
| severity_gather | 0.6 | 扎堆严重度权重 |
| severity_isolate | 0.5 | 离群严重度权重 |
