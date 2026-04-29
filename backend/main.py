"""MUSE Style Studio — AI Backend"""
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")


def _load_rembg():
    from rembg import new_session
    new_session("u2net")
    logger.info("rembg model loaded")


async def _preload_rembg():
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _load_rembg)
    except Exception as e:
        logger.warning(f"rembg preload skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_preload_rembg())
    logger.info("Backend started — rembg loading in background")
    yield
    logger.info("Backend shutting down")


app = FastAPI(title="MUSE Style Studio API", version="3.0.0", lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://muse-stye.netlify.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "https://muse-stye.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "capacitor://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS origins: {FRONTEND_URL}")

try:
    from routers import tryon
    app.include_router(tryon.router, prefix="/api/tryon", tags=["Virtual Try-On"])
    logger.info("Router loaded: tryon")
except Exception as e:
    logger.error(f"Router tryon failed: {e}")

try:
    from routers import hairstyle
    app.include_router(hairstyle.router, prefix="/api/hair", tags=["Hair Styling"])
    logger.info("Router loaded: hairstyle")
except Exception as e:
    logger.error(f"Router hairstyle failed: {e}")

try:
    from routers import makeup
    app.include_router(makeup.router, prefix="/api/makeup", tags=["Makeup"])
    logger.info("Router loaded: makeup")
except Exception as e:
    logger.error(f"Router makeup failed: {e}")

try:
    from routers import analyze
    app.include_router(analyze.router, prefix="/api/analyze", tags=["Body Analysis"])
    logger.info("Router loaded: analyze")
except Exception as e:
    logger.error(f"Router analyze failed: {e}")

try:
    from routers import task_status
    app.include_router(task_status.router, prefix="/api/tasks", tags=["Task Queue"])
    logger.info("Router loaded: task_status")
except Exception as e:
    logger.error(f"Router task_status failed: {e}")

try:
    from routers import compose
    app.include_router(compose.router, prefix="/api/compose", tags=["Multi-Image Compose"])
    logger.info("Router loaded: compose")
except Exception as e:
    logger.error(f"Router compose failed: {e}")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "replicate": bool(os.getenv("REPLICATE_API_TOKEN")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "frontend_url": FRONTEND_URL,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
