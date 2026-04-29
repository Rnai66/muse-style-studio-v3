"""MUSE Style Studio — AI Backend"""
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("main")

# ── Preload rembg in background (non-blocking) ──
async def _preload_rembg():
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _load_rembg)
    except Exception as e:
        logger.warning(f"rembg preload skipped: {e}")

def _load_rembg():
    from rembg import new_session
    new_session("u2net")
    logger.info("rembg model loaded")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start rembg preload without blocking startup
    asyncio.create_task(_preload_rembg())
    logger.info("Backend started — rembg loading in background")
    yield
    logger.info("Backend shutting down")

app = FastAPI(title="MUSE Style Studio API", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import tryon, hairstyle, makeup, analyze, task_status, compose

app.include_router(tryon.router,       prefix="/api/tryon",   tags=["Virtual Try-On"])
app.include_router(hairstyle.router,   prefix="/api/hair",    tags=["Hair Styling"])
app.include_router(makeup.router,      prefix="/api/makeup",  tags=["Makeup"])
app.include_router(analyze.router,     prefix="/api/analyze", tags=["Body Analysis"])
app.include_router(task_status.router, prefix="/api/tasks",   tags=["Task Queue"])
app.include_router(compose.router,     prefix="/api/compose", tags=["Multi-Image Compose"])

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "replicate": bool(os.getenv("REPLICATE_API_TOKEN")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
