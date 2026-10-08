"""API v1 路由聚合。"""

from fastapi import APIRouter

router = APIRouter()

# 各模块路由将在此 include，例如：
# from app.api.v1 import vision, chat, alarms, kb, stats
# router.include_router(vision.router, prefix="/vision", tags=["vision"])
# router.include_router(chat.router, prefix="/chat", tags=["chat"])
# router.include_router(alarms.router, prefix="/alarms", tags=["alarms"])
# router.include_router(kb.router, prefix="/kb", tags=["kb"])
# router.include_router(stats.router, prefix="/stats", tags=["stats"])
