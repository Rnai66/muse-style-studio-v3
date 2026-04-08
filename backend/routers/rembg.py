"""
/api/rembg/ — Background removal endpoint
Uses local rembg library (onnxruntime-based, runs in-container, no Replicate cost).
Input : { "image": "<base64 data URL>" }
Output: { "image": "data:image/png;base64,..." }  (transparent PNG)
"""
import base64
import io
import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image

router = APIRouter()


class RemoveBgRequest(BaseModel):
    image: str   # base64 data URL  (data:image/...;base64,XXXX  or raw base64)


def _process_rembg(img_bytes: bytes) -> bytes:
    """CPU-bound: strip background with rembg, return PNG bytes."""
    from rembg import remove  # lazy import — avoids slow startup on first request
    inp = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    out = remove(inp)
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue()


@router.post("/")
async def remove_background(req: RemoveBgRequest):
    # ── Decode base64 ──────────────────────────────────────────────
    raw = req.image
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        img_bytes = base64.b64decode(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    # ── Run rembg in thread pool (avoids blocking event loop) ──────
    try:
        result_bytes = await asyncio.to_thread(_process_rembg, img_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {e}")

    # ── Return as transparent PNG data URL ──────────────────────────
    b64_out = base64.b64encode(result_bytes).decode()
    return {"image": f"data:image/png;base64,{b64_out}"}
