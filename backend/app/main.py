"""FastAPI 应用入口。"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化：数据库连接、ChromaDB、视觉 Provider 注册等
    yield
    # 关闭时清理资源


app = FastAPI(
    title="鹅疫智答 - 风险研判平台",
    version="0.1.0",
    description="行为事件驱动的 Agentic-RAG 多智能体风险研判后端",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}
