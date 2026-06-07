# SNIP — URL Shortener 練習專案

練習 Docker 與 Docker Compose 基礎，將全端短網址應用拆成三個獨立 container 運行。

## 技術棧

- 前端：HTML / CSS / JavaScript（Nginx 提供服務）
- 後端：FastAPI（Python）
- 資料庫：Redis

## 使用 Podman（替代 Docker）

若環境使用 Podman，請先完成以下設定：

```bash
# 安裝 podman-compose
brew install podman-compose

# 加入 alias（加到 ~/.zshrc 後重啟 terminal）
alias docker=podman
alias docker-compose=podman-compose
```

設定完成後，後續所有 `docker` 指令皆可正常使用，無需額外調整。

## 架構

```
瀏覽器 (localhost:3000)
    ↓ HTTP
frontend container (Nginx)
    ↓ fetch API calls
backend container (FastAPI :8000)
    ↓ redis-py
redis container (Redis :6379)
```

## 快速啟動

```bash
# 在 url-shortener/ 目錄下執行
docker compose up --build

# 前端 UI
open http://localhost:3000

# API 文件（FastAPI 自動產生）
open http://localhost:8888/docs
```

## 專案結構

```
url-shortener/
├── docker-compose.yml       ← 定義 3 個 container
├── frontend/
│   ├── index.html           ← HTML 結構
│   ├── style.css            ← 樣式
│   ├── app.js               ← 互動邏輯
│   ├── nginx.conf           ← Nginx 設定
│   └── Dockerfile           ← 把靜態檔案放進 Nginx image
└── backend/
    ├── main.py              ← FastAPI（主要 endpoints）
    ├── requirements.txt
    └── Dockerfile           ← Python + uvicorn
```

## API Endpoints

| Method | Path | 說明 |
|--------|------|------|
| GET | `/health` | 確認服務正常 |
| POST | `/shorten` | 傳入 `{"url": "..."}` 回傳短碼 |
| GET | `/r/{code}` | 用短碼查詢原始網址 |
| GET | `/list` | 列出所有短碼（練習用）|

## 常用指令

```bash
# 第一次啟動（build image 並啟動）
docker compose up --build

# 背景執行
docker compose up -d

# 停止（資料保留）
docker compose down

# 停止並清除 container（Redis 資料會消失）
docker compose down -v

# 進入 container
docker exec -it <container_name> sh

# 查看運行中的 container
docker ps
```

## 練習重點

- 為三個服務各撰寫 Dockerfile
- 透過 docker-compose.yml 一鍵啟動所有服務
- Default bridge network：container 間以 service name 互相溝通（`REDIS_HOST=redis`）
- `depends_on`：控制服務啟動順序（backend 等 redis、frontend 等 backend）

## 練習延伸

- [ ] 加上 TTL（`r.setex(code, 3600, url)`）讓短網址 1 小時後失效
- [ ] 加上點擊次數統計（`r.incr(f"count:{code}")`）
- [ ] 讓 `/r/{code}` 直接 302 redirect（用 `RedirectResponse`）
- [ ] 加上自訂短碼功能（讓使用者自己填短碼）
- [ ] 加上 healthcheck，讓 depends_on 等服務真正 ready 才啟動
