#!/usr/bin/env bash
# 一键启动本地开发环境（数据库 + 后端 + 前端）
# 用法：bash scripts/dev_up.sh

set -e

echo "==> 启动 MySQL（Docker）"
docker compose -f deploy/docker-compose.yml up -d mysql

echo "==> 等待 MySQL 就绪..."
sleep 10

echo "==> 启动后端"
cd backend
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "==> 启动前端"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "==> 服务已启动"
echo "    后端: http://localhost:8000"
echo "    前端: http://localhost:5173"
echo "    API 文档: http://localhost:8000/docs"
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID; docker compose -f deploy/docker-compose.yml down" INT TERM
wait
