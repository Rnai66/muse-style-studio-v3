"""
/api/compose — Multi-Image AI Style Composer
รับ: person photo + หลาย item images + text prompts
ส่งออก: รูปเดียวที่ AI รวมทุกอย่างเข้าด้วยกัน
"""
import asyncio
import json
import logging
import os
import traceback
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logger = logging.getLogger("muse.compose")
router = APIRouter()


class ItemSlot(BaseModel):
    image: Optional[str] = None
    category: str = "upper_body"
    description: str = ""


class TextPrompts(BaseModel):
    hair: str = ""
    hair_color: str = ""
    accessories: str = ""
    shoes: str = ""
    makeup: str = ""
    extra: str = ""


class ComposeRequest(BaseModel):
    person_image: str
    items: list[ItemSlot] = Field(default_factory=list)
    text_prompts: TextPrompts = Field(default_factory=TextPrompts)
    upscale: bool = True
    style_strength: float = 0.65


def _b64_to_bytes(data_url: str) -> bytes:
    import base64
    b64 = data_url.split(",", 1)[1] if "," in data_url else data_url
    return base64.b64decode(b64)


def _get_media_type(data_url: str) -> str:
    if data_url.startswith("data:image/png"):  return "image/png"
    if data_url.startswith("data:image/webp"): return "image/webp"
    return "image/jpeg"


async def _upload(data_url: str, filename: str) -> str:
    """Upload base64 image to Replicate and return hosted URL."""
    import replicate, io
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        raise RuntimeError("REPLICATE_API_TOKEN not set")
    client = replicate.Client(api_token=token)
    raw = _b64_to_bytes(data_url)
    buf = io.BytesIO(raw)
    buf.name = filename
    result = client.files.create(buf)
    return result.urls["get"]


async def _vton(person_url: str, garment_url: str, category: str) -> str:
    import replicate, os
    client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))
    out = await client.async_run(
        "yisol/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        input={
            "human_img": person_url,
            "garm_img": garment_url,
            "garment_des": f"fashion {category}",
            "is_checked": True,
            "is_checked_crop": False,
            "denoise_steps": 30,
            "seed": 42,
            "category": category,
        },
    )
    return str(out[0]) if isinstance(out, list) else str(out)


async def _rembg(image_url: str) -> str:
    import replicate, os
    client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))
    out = await client.async_run(
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        input={"image": image_url},
    )
    return str(out)


async def _sdxl(image_url: str, prompt: str, strength: float) -> str:
    import replicate, os
    client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))
    out = await client.async_run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        input={
            "image": image_url,
            "prompt": prompt,
            "negative_prompt": "changed identity, different person, blurry, bad anatomy, watermark",
            "num_inference_steps": 40,
            "guidance_scale": 7.5,
            "strength": strength,
        },
    )
    return str(out[0]) if isinstance(out, list) else str(out)


async def _upscale(image_url: str) -> str:
    import replicate, os
    client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))
    out = await client.async_run(
        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        input={"image": image_url, "scale": 2, "face_enhance": True},
    )
    return str(out)


def _build_prompt(tp: TextPrompts, items: list[ItemSlot]) -> str:
    parts = [
        "photorealistic full body fashion photo, same person, same face,",
        "high quality, professional photography, studio lighting,",
    ]
    if tp.hair:
        color = f" {tp.hair_color}" if tp.hair_color else ""
        parts.append(f"{tp.hair}{color} hairstyle,")
    if tp.accessories:
        parts.append(f"wearing {tp.accessories},")
    if tp.shoes:
        parts.append(f"{tp.shoes} shoes,")
    if tp.makeup:
        parts.append(f"{tp.makeup} makeup,")
    for it in items:
        if it.description and not it.image:
            parts.append(f"{it.description},")
    if tp.extra:
        parts.append(tp.extra)
    return " ".join(parts)


async def run_compose_pipeline(req: ComposeRequest, on_progress) -> str:
    await on_progress("เตรียมรูปภาพ...", 5)

    # Upload person
    person_url = await _upload(req.person_image, "person.jpg")
    await on_progress("อัปโหลดรูปคนสำเร็จ", 12)

    # Sort: dresses → upper → lower
    cat_order = {"dresses": 0, "upper_body": 1, "lower_body": 2}
    clothing = sorted(
        [it for it in req.items if it.image and it.category in cat_order],
        key=lambda x: cat_order.get(x.category, 9)
    )

    current_url = person_url
    total = len(clothing)

    for idx, item in enumerate(clothing):
        pct = 15 + idx * (45 // max(total, 1))
        desc = item.description or item.category
        await on_progress(f"AI ลองชุด ({idx+1}/{total}): {desc}...", pct)

        garment_url = await _upload(item.image, f"garment_{idx}.jpg")  # type: ignore
        try:
            garment_url = await _rembg(garment_url)
        except Exception as e:
            logger.warning(f"rembg skipped: {e}")

        current_url = await _vton(current_url, garment_url, item.category)
        await on_progress(f"ชุดที่ {idx+1} เสร็จแล้ว", pct + 10)

    # SDXL for hair/accessories/makeup/shoes
    tp = req.text_prompts
    text_items = [it for it in req.items if not it.image]
    has_hints = any([tp.hair, tp.accessories, tp.shoes, tp.makeup, tp.extra,
                     any(it.description for it in text_items)])

    if has_hints:
        await on_progress("AI ปรับแต่ง ผม / Accessories / เมคอัพ...", 65)
        prompt = _build_prompt(tp, text_items)
        logger.info(f"SDXL prompt: {prompt[:120]}")
        try:
            current_url = await _sdxl(current_url, prompt, req.style_strength)
        except Exception as e:
            logger.warning(f"SDXL step skipped: {e}")

    if req.upscale:
        await on_progress("เพิ่มความคมชัด...", 88)
        try:
            current_url = await _upscale(current_url)
        except Exception as e:
            logger.warning(f"Upscale skipped: {e}")

    await on_progress("เสร็จแล้ว! ✦", 100)
    return current_url


@router.post("/")
async def compose(req: ComposeRequest):
    async def stream():
        events: list[str] = []

        async def prog(msg: str, pct: int):
            events.append(f"data: {json.dumps({'type':'progress','message':msg,'percent':pct})}\n\n")

        task = asyncio.create_task(run_compose_pipeline(req, prog))
        while not task.done():
            while events:
                yield events.pop(0)
            await asyncio.sleep(0.2)
        while events:
            yield events.pop(0)
        try:
            url = task.result()
            yield f"data: {json.dumps({'type':'result','url':url})}\n\n"
        except Exception as e:
            logger.error(traceback.format_exc())
            yield f"data: {json.dumps({'type':'error','message':str(e)})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/simple")
async def compose_simple(req: ComposeRequest):
    try:
        async def noop(m, p): pass
        url = await run_compose_pipeline(req, noop)
        return {"url": url}
    except Exception as e:
        raise HTTPException(500, str(e))
