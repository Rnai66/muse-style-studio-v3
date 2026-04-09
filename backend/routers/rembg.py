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
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image

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
            _rembg_model = new_session(model_name="u2net")
            logger.info("✓ rembg models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load rembg: {e}")
            _rembg_model = False
    return _rembg_model


async def _init_models():
    """Called at startup to pre-load models."""
    await asyncio.to_thread(_load_rembg_model)


def _process_rembg(img_bytes: bytes) -> bytes:
    """CPU-bound: strip background with rembg, return PNG bytes."""
    try:
        from rembg import remove, new_session
        
        # Load or use cached model
        session = _load_rembg_model()
        if session is False:
            raise RuntimeError("rembg models failed to load")
        
        logger.info(f"Processing image ({len(img_bytes)} bytes)")
        
        inp = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        original_size = inp.size
        logger.info(f"Input image size: {original_size}")
        
        # Resize if too large to speed up processing
        max_dimension = 1024
        if max(original_size) > max_dimension:
            scale = max_dimension / max(original_size)
            new_size = (int(original_size[0] * scale), int(original_size[1] * scale))
            inp = inp.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized to {new_size} for faster processing")
        
        # Remove background
        out = remove(inp, session=session)
        
        # Upscale back if we downscaled
        if max(original_size) > max_dimension:
            out = out.resize(original_size, Image.Resampling.LANCZOS)
            logger.info(f"Upscaled back to {original_size}")
        
        buf = io.BytesIO()
        out.save(buf, format="PNG")
        result = buf.getvalue()
        logger.info(f"✓ Background removed successfully ({len(result)} bytes)")
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
            timeout=180  # 3 minute max timeout (includes ONNX model loading on first request)
        )
    except asyncio.TimeoutError:
        logger.warning("Background removal timed out after 180 seconds")
        raise HTTPException(
            status_code=504,
            detail="Background removal took too long (>3 minutes). Try with a smaller or simpler image."
        )
    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

    # ── Return as transparent PNG data URL ──────────────────────────
    b64_out = base64.b64encode(result_bytes).decode()
    return {"image": f"data:image/png;base64,{b64_out}"}
