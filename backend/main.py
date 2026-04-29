"""
MUSE Style Studio — AI Backend
FastAPI + Replicate API + RNAI + HuggingFace
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import tryon, hairstyle, makeup, task_status, rembg, avatar, rnai_proxy

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MUSE Style Studio API",
    version="2.0.2",
    description="AI-powered fashion try-on and styling backend",
)

# CORS — allow frontend dev server + mobile app + production
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "capacitor://localhost",
    "ionic://localhost",
    "https://muse-style-studio-v3.web.app",  # Firebase production
    "https://muse-style-studio-v3.firebaseapp.com",  # Firebase alt domain
]
# Add environment-specific override if set
env_url = os.getenv("FRONTEND_URL", "").strip()
if env_url:
    allowed_origins.append(env_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(tryon.router,       prefix="/api/tryon",   tags=["Virtual Try-On"])
app.include_router(hairstyle.router,   prefix="/api/hair",    tags=["Hair Styling"])
app.include_router(makeup.router,      prefix="/api/makeup",  tags=["Makeup"])
app.include_router(task_status.router, prefix="/api/tasks",   tags=["Task Queue"])
app.include_router(rembg.router,       prefix="/api/rembg",   tags=["Background Removal"])
app.include_router(avatar.router,      prefix="/api/avatar",  tags=["Avatar"])
app.include_router(rnai_proxy.router,  prefix="/api/rnai",    tags=["RNAI Proxy"])


@app.on_event("startup")
async def startup_event():
    """Log available services on startup"""
    logger.info("=" * 60)
    logger.info("🚀 MUSE Style Studio Backend - Startup Diagnostics")
    logger.info("=" * 60)
    
    # Check environment
    is_render = os.getenv("RENDER") == "true"
    logger.info(f"Environment: {'RENDER (Production)' if is_render else 'LOCAL'}")
    
    # Check API credentials
    replicate_token = bool(os.getenv("REPLICATE_API_TOKEN"))
    rnai_key = bool(os.getenv("VITE_RNAI_API_KEY"))
    hf_token = bool(os.getenv("HUGGINGFACE_API_TOKEN"))
    
    logger.info(f"API Credentials:")
    logger.info(f"  - REPLICATE_API_TOKEN: {'✓' if replicate_token else '✗'}")
    logger.info(f"  - VITE_RNAI_API_KEY: {'✓' if rnai_key else '✗'}")
    logger.info(f"  - HUGGINGFACE_API_TOKEN: {'✓' if hf_token else '✗'}")
    
    # Background removal availability
    available_methods = []
    if rnai_key:
        available_methods.append("RNAI Platform")
    if replicate_token:
        available_methods.append("Replicate")
    available_methods.append("Local rembg")
    
    logger.info(f"Background Removal Methods Available: {', '.join(available_methods) if available_methods else 'NONE'}")
    
    # Check rembg model preloading status
    try:
        from routers.rembg import _load_rembg_model
        session = _load_rembg_model()
        if session and session is not False:
            logger.info("✓ rembg ONNX model is ready (preloaded or cached)")
        else:
            logger.warning("⚠ rembg model failed to initialize")
    except Exception as e:
        logger.warning(f"⚠ Could not verify rembg model status: {e}")
    
    logger.info("=" * 60)


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
    is_render = os.getenv("RENDER") == "true"
    replicate_token = bool(os.getenv("REPLICATE_API_TOKEN"))
    rnai_key = bool(os.getenv("VITE_RNAI_API_KEY"))
    hf_token = bool(os.getenv("HUGGINGFACE_API_TOKEN"))
    
    return {
        "status": "ok",
        "version": "v1.0.4",
        "environment": "render" if is_render else "local",
        "services": {
            "replicate": replicate_token,
            "rnai": rnai_key,
            "huggingface": hf_token,
            "local_rembg": True,
        },
        "bg_removal_available": True,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
