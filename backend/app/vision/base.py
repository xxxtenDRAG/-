"""视觉能力统一抽象（Vision Adapter）。

感知域对上层只暴露"事件流"，交互域和研判域永远不感知感知域的实现细节。
新增视觉能力只需实现 VisionProvider 并在 registry.py 注册，业务代码零改动。
"""

from typing import Iterator, Protocol, runtime_checkable


@runtime_checkable
class VisionProvider(Protocol):
    """视觉能力统一抽象。一期只有 Simulator，二期加 Yolo。"""

    name: str

    def health(self) -> dict:
        """返回 {status, mode, fps, last_event_at}，供 /vision/health 使用。"""
        ...

    def stream_events(self) -> Iterator[dict]:
        """产出符合 behavior-event.schema.json 契约的事件字典。"""
        ...

    def latest_frame(self) -> bytes | None:
        """可选：返回最近一帧 JPEG，用于前端监控画面。无视频源时返回 None。"""
        ...
