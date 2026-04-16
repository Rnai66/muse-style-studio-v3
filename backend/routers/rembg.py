"""
/api/rembg/ — Background removal endpoint
Uses local rembg library (onnxruntime-based, runs in-container, no Replicate cost).
Input : { "image": "<base64 data URL>" }
Output: { "image": "data:image/png;base64,..." }  (transparent PNG)

Note: First request may take 30-45s to load ONNX models. Subsequent requests are faster (~15-20s).
"""
import base64
import io
import asyncio
import logging
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image

# Disable GPU detection on Render free tier (no GPU, saves memory)
os.environ['ONNXRUNTIME_EXECUTION_PROVIDERS'] = 'CPUExecutionProvider'

logger = logging.getLogger(__name__)
router = APIRouter()


class RemoveBgRequest(BaseModel):
    image: str   # base64 data URL  (data:image/...;base64,XXXX  or raw base64)


# ── Global model cache to avoid reloading ──
_rembg_model = None

def _load_rembg_model():
    """Lazy load rembg model once and cache it."""
    global _rembg_model
    if _rembg_model is None:
        logger.info("Loading rembg ONNX models... (first time only, ~30-45s)")
        try:
            from rembg import new_session, remove
            # Pre-download session to avoid timeout on first request
            # Using u2net_human_seg for faster processing on low-memory systems
            logger.info("Creating ONNX session with CPU-only execution...")
            _rembg_model = new_session(model_name="u2net_human_seg", providers=["CPUExecutionProvider"])
            logger.info("✓ rembg models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load rembg: {e}", exc_info=True)
            _rembg_model = False
    return _rembg_model


def _process_rembg(img_bytes: bytes) -> bytes:
    """CPU-bound: strip background with rembg, return PNG bytes."""
    try:
        from rembg import remove, new_session
        import time
        
        # Load or use cached model
        session = _load_rembg_model()
        if session is False:
            raise RuntimeError("rembg models failed to load")
        
        start_time = time.time()
        logger.info(f"Processing image ({len(img_bytes)} bytes)")
        
        inp = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        original_size = inp.size
        logger.info(f"Input image size: {original_size}")
        
        # Aggressive resize for slow Render tier to speed up processing
        # Further reduced to 640px max to prevent OOM on 512MB instances
        max_dimension = 640  # Reduced from 768 for memory safety
        if max(original_size) > max_dimension:
            scale = max_dimension / max(original_size)
            new_size = (int(original_size[0] * scale), int(original_size[1] * scale))
            inp = inp.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized to {new_size} for faster processing (memory safety)")
        
        # Remove background
        logger.info("Starting ONNX model inference...")
        out = remove(inp, session=session)
        logger.info(f"✓ ONNX model inference completed in {time.time() - start_time:.1f}s")
        
        # Upscale back if we downscaled
        if max(original_size) > max_dimension:
            out = out.resize(original_size, Image.Resampling.LANCZOS)
            logger.info(f"Upscaled back to {original_size}")
        
        # Optimize PNG compression for faster saving
        buf = io.BytesIO()
        out.save(buf, format="PNG", optimize=True)
        result = buf.getvalue()
        
        elapsed = time.time() - start_time
        logger.info(f"✓ Background removed successfully in {elapsed:.1f}s ({len(result)} bytes)")
        return result
        
    except Exception as e:
        logger.error(f"rembg processing failed: {e}", exc_info=True)
        raise


@router.post("/")
async def remove_background(req: RemoveBgRequest):
    # ── Decode base64 ──────────────────────────────────────────────
    raw = req.image
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        img_bytes = base64.b64decode(raw)
        if len(img_bytes) > 20 * 1024 * 1024:  # 20MB limit
            raise Exception("Image too large (>20MB)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

    # ── Run rembg in thread pool with timeout ──────
    try:
        logger.info(f"Starting background removal for {len(img_bytes)} byte image")
        result_bytes = await asyncio.wait_for(
            asyncio.to_thread(_process_rembg, img_bytes),
            timeout=300  # 5 minute max timeout (includes ONNX model loading on first request, Render free tier is slow)
        )
    except asyncio.TimeoutError:
        logger.warning("Background removal timed out after 300 seconds")
        raise HTTPException(
            status_code=504,
            detail="Background removal took too long (>5 minutes). Try with a smaller or simpler image."
        )
    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

    # ── Return as transparent PNG data URL ──────────────────────────
    b64_out = base64.b64encode(result_bytes).decode()
    return {"image": f"data:image/png;base64,{b64_out}"}
