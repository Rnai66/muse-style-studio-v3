"""
MUSE Style Studio — AI Backend
FastAPI + Replicate API + Anthropic Claude
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import tryon, hairstyle, makeup, analyze, task_status, chat, rembg, avatar

load_dotenv()

app = FastAPI(
    title="MUSE Style Studio API",
    version="2.0.0",
    description="AI-powered fashion try-on and styling backend",
)

# CORS — allow frontend dev server + mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "capacitor://localhost",
        "ionic://localhost",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(tryon.router,       prefix="/api/tryon",   tags=["Virtual Try-On"])
app.include_router(hairstyle.router,   prefix="/api/hair",    tags=["Hair Styling"])
app.include_router(makeup.router,      prefix="/api/makeup",  tags=["Makeup"])
app.include_router(analyze.router,     prefix="/api/analyze", tags=["Body Analysis"])
app.include_router(task_status.router, prefix="/api/tasks",   tags=["Task Queue"])
app.include_router(chat.router,        prefix="/api/chat",    tags=["AI Chat"])
app.include_router(rembg.router,       prefix="/api/rembg",   tags=["Background Removal"])
app.include_router(avatar.router,      prefix="/api/avatar",  tags=["Avatar"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to MUSE Style Studio API. Go to /docs for Swagger UI"
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "replicate": bool(os.getenv("REPLICATE_API_TOKEN")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
