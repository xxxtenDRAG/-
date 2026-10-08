"""初始化数据库：建表 + 写入默认阈值配置。

用法：
    cd backend
    python -m scripts.seed_db
"""

from app.core.config import settings
from sqlalchemy import create_engine, text


def main() -> None:
    engine = create_engine(settings.database_url)
    with engine.begin() as conn:
        # 建表（完整 DDL 见 docs/database.md）
        ddl = """
        CREATE TABLE IF NOT EXISTS sys_config (
          cfg_key   VARCHAR(64) PRIMARY KEY,
          cfg_value VARCHAR(255),
          remark    VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        conn.execute(text(ddl))

        # 写入默认阈值
        defaults = [
            ("min_duration_sec", "5", "异常持续时长下限（秒）"),
            ("min_count", "1", "异常个体数下限"),
            ("cooldown_sec", "120", "同一 camera+behavior 告警冷却（秒）"),
            ("severity_limp", "0.8", "跛行严重度权重"),
            ("severity_gather", "0.6", "扎堆严重度权重"),
            ("severity_isolate", "0.5", "离群严重度权重"),
        ]
        for key, value, remark in defaults:
            conn.execute(
                text(
                    "INSERT INTO sys_config (cfg_key, cfg_value, remark) VALUES (:k, :v, :r) "
                    "ON DUPLICATE KEY UPDATE cfg_value=VALUES(cfg_value), remark=VALUES(remark)"
                ),
                {"k": key, "v": value, "r": remark},
            )
    print("数据库初始化完成：sys_config 表 + 默认阈值已写入。")


if __name__ == "__main__":
    main()
