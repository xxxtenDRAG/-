"""LangGraph 多智能体模块。

包含五大 Agent：
- understand: Query 理解（意图识别、改写、实体抽取）
- retrieve: 双通道检索（向量 + 知识图谱）
- evaluate: 检索评估（相关性 + 充分度，不达标则回退重查，最多 3 轮）
- generate: 报告生成
- trace: 溯源（为每条结论附加来源引用）

graph.py 组装 LangGraph 状态机。
"""
