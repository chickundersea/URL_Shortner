import os
import random
import string

import redis
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# ── CORS：允許前端 container 呼叫 ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Redis 連線 ────────────────────────────────────────────────
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True,
)


# ── Helper ────────────────────────────────────────────────────
def generate_code(length: int = 6) -> str:
    """產生隨機短碼，例如 aB3xZ9"""
    chars = string.ascii_letters + string.digits
    num_chars = length
    return "".join(random.choices(chars, k=num_chars))


# ── Schemas ───────────────────────────────────────────────────
class ShortenRequest(BaseModel):
    url: str


class ShortenResponse(BaseModel):
    short_code: str
    short_url: str


# ── Endpoints ────────────────────────────────────────────────
@app.get("/health")
def health():
    """確認服務正常運作"""
    return {"status": "ok"}


@app.post("/shorten", response_model=ShortenResponse)
def shorten(body: ShortenRequest):
    """接收長網址，回傳短碼"""
    if not body.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL 必須以 http:// 或 https:// 開頭")

    # 產生不重複的短碼
    code = generate_code()
    while redis_client.exists(code):
        code = generate_code()

    redis_client.set(code, body.url)  # 永久保存（可改成 redis_client.setex 加 TTL）

    return ShortenResponse(
        short_code=code,
        short_url=f"http://localhost:8888/r/{code}",
    )


@app.get("/r/{code}")
def redirect(code: str):
    """根據短碼，回傳原始網址（讓前端做跳轉）"""
    original = redis_client.get(code)
    if not original:
        raise HTTPException(status_code=404, detail="找不到此短碼")
    # 回傳 JSON 讓前端自行跳轉；若要直接 302 redirect 可改用 RedirectResponse
    return {"url": original}


@app.get("/list")
def list_all():
    """列出所有短碼（練習用）"""
    keys = redis_client.keys("*")
    return {k: redis_client.get(k) for k in keys}
