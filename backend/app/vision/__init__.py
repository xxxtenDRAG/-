"""视觉适配层：屏蔽视觉能力的实现差异，对上层只暴露事件流。

- base.py: VisionProvider 协议
- simulator.py: 手动 + 定时事件生成（一期主力）
- replay.py: 预生成视频回放
- yolo.py: 二期实现（检测 + 跟踪 + rules.py 规则引擎）
- registry.py: 根据 VISION_PROVIDER 环境变量选择实现
"""
