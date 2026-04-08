"""
MUSE AI Pipeline — orchestrates the full processing chain.

Full pipeline per request type:
  TRYON:
    1. Run IDM-VTON (SDK auto-uploads images via BytesIO)
    2. Upscale result URL
    3. Return final URL

  HAIR:
    1. Run FLUX change-haircut (SDK auto-uploads)
    2. Return URL

  MAKEUP:
    1. Run FLUX Kontext Pro (SDK auto-uploads)
    2. Return URL

Each step emits progress via callback so frontend can show live status.
"""
import asyncio
from typing import Callable, Optional, Awaitable

from services import replicate_service as rep


ProgressFn = Callable[[str, int], Awaitable[None]]


async def _noop(msg: str, pct: int) -> None:
    pass


# ──────────────────────────────────────────────────────────
# VIRTUAL TRY-ON PIPELINE
# ──────────────────────────────────────────────────────────
async def run_tryon_pipeline(
    person_b64: str,
    garment_b64: str,
    category: str = "upper_body",
    upscale: bool = True,
    on_progress: ProgressFn = _noop,
) -> str:
    await on_progress("กำลังเตรียมรูปภาพ...", 10)

    await on_progress("AI กำลังสวมชุด... (ใช้เวลา 15–30 วิ)", 30)
    result_url = await rep.virtual_tryon(person_b64, garment_b64, category)

    if upscale:
        await on_progress("เพิ่มความคมชัด (Upscaling)...", 85)
        result_url = await rep.upscale_image(result_url, scale=2)

    await on_progress("เสร็จแล้ว! ✦", 100)
    return result_url


# ──────────────────────────────────────────────────────────
# HAIRSTYLE PIPELINE
# ──────────────────────────────────────────────────────────
async def run_hair_pipeline(
    person_b64: str,
    hairstyle_prompt: str,
    hair_color: Optional[str] = None,
    strength: float = 0.6,
    on_progress: ProgressFn = _noop,
) -> str:
    await on_progress("AI กำลังเปลี่ยนทรงผม... (FLUX Kontext)", 20)
    result_url = await rep.change_hairstyle(person_b64, hairstyle_prompt, hair_color, strength)

    await on_progress("เสร็จแล้ว! ✦", 100)
    return result_url


# ──────────────────────────────────────────────────────────
# MAKEUP PIPELINE
# ──────────────────────────────────────────────────────────
async def run_makeup_pipeline(
    person_b64: str,
    makeup_style: str,
    intensity: float = 0.5,
    on_progress: ProgressFn = _noop,
) -> str:
    await on_progress("AI กำลังแต่งหน้า... (FLUX Kontext)", 20)
    result_url = await rep.apply_makeup(person_b64, makeup_style, intensity)

    await on_progress("เสร็จแล้ว! ✦", 100)
    return result_url
