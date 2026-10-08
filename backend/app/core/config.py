"""应用配置，通过环境变量加载。"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # 应用
    app_name: str = "goose-risk-guard"
    debug: bool = False
    cors_origins: List[str] = ["http://localhost:5173"]

    # 数据库
    database_url: str = "mysql+pymysql://root:root@localhost:3306/goose_qa?charset=utf8mb4"

    # 向量库
    chroma_persist_dir: str = "./data/chroma"

    # 视觉 Provider
    vision_provider: str = "simulator"  # simulator | replay | yolo

    # LLM
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    # 向量与重排
    dashscope_api_key: str = ""
    embedding_model: str = "text-embedding-v3"
    rerank_model: str = "gte-rerank"

    # 阈值规则（可被 sys_config 表覆盖）
    min_duration_sec: float = 5.0
    min_count: int = 1
    cooldown_sec: int = 120


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
