"""RAG 模块：解析、分块、向量检索、知识图谱。

- parse.py: PDF/DOCX 解析与清洗
- chunk.py: 分块（chunk=512, overlap=50，按章节标题优先切分）
- embed.py: DashScope text-embedding-v3 向量化
- store.py: ChromaDB 入库与检索
- graph.py: NetworkX 知识图谱 + Louvain 社区检测
- rerank.py: gte-rerank 重排序
"""
