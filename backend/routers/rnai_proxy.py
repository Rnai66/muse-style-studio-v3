import os
import httpx
import base64
import asyncio
import logging
import replicate
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

IS_RENDER = os.getenv("RENDER") == "true"

RNAI_BASE_URL = "https://rnai-io.vercel.app/api/v1"
RNAI_API_KEY = (os.getenv("VITE_RNAI_API_KEY") or "").strip()
HF_TOKEN = (os.getenv("HUGGINGFACE_API_TOKEN") or "").strip()
REPLICATE_API_TOKEN = (os.getenv("REPLICATE_API_TOKEN") or "").strip()

# Cleanup common copy-paste errors
if RNAI_API_KEY.startswith("VITE_RNAI_API_KEY="):
    RNAI_API_KEY = RNAI_API_KEY.replace("VITE_RNAI_API_KEY=", "").strip()
if HF_TOKEN.startswith("HUGGINGFACE_API_TOKEN="):
    HF_TOKEN = HF_TOKEN.replace("HUGGINGFACE_API_TOKEN=", "").strip()
if REPLICATE_API_TOKEN.startswith("REPLICATE_API_TOKEN="):
    REPLICATE_API_TOKEN = REPLICATE_API_TOKEN.replace("REPLICATE_API_TOKEN=", "").strip()

HF_GEN_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
HF_REMBG_URL = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4"

class ProxyRequest(BaseModel):
    image: Optional[str] = None
    prompt: Optional[str] = None
    mask: Optional[str] = None

@router.post("/remove-background")
async def proxy_remove_bg(req: ProxyRequest):
    if not req.image:
        raise HTTPException(status_code=400, detail="Missing image data")
    
    # 1. Try RNAI platform first (User's preferred choice)
    try:
        if RNAI_API_KEY:
            logger.info("Attempting RNAI platform call for background removal...")
            res = await forward_to_rnai("remove-background", req)
            if res and "image" in res:
                return res
    except Exception as e:
        logger.warning(f"RNAI platform call failed: {e}")

    # 2. Try Replicate (Powerful, stable, won't crash Render)
    if REPLICATE_API_TOKEN:
        try:
            logger.info("Attempting Replicate fallback for background removal...")
            
            # Clean base64 for Replicate - Replicate expects the header
            raw = req.image
            if not raw.startswith("data:"):
                raw = f"data:image/png;base64,{raw}"
            
            # Use synchronous replicate call inside to_thread
            def _run_replicate():
                # Setting token explicitly to avoid env issues
                client = replicate.Client(api_token=REPLICATE_API_TOKEN)
                output = client.run(
                    "cjwbw/rembg:fb8a0038258f4848510ee37f7a39482d2d8216cfa39ce37c2339f9571b0318d0",
                    input={"image": raw}
                )
                return output

            result_url = await asyncio.to_thread(_run_replicate)
            if result_url:
                logger.info(f"✓ Replicate success: {result_url}")
                return {"image": result_url}
        except Exception as e:
            logger.error(f"Replicate fallback failed: {str(e)}")

    # 3. Try direct Hugging Face
    if HF_TOKEN:
        try:
            logger.info("Attempting direct Hugging Face call for background removal...")
            raw = req.image
            if "," in raw:
                raw = raw.split(",", 1)[1]
            img_bytes = base64.b64decode(raw)

            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    HF_REMBG_URL,
                    content=img_bytes,
                    headers={"Authorization": f"Bearer {HF_TOKEN}"}
                )
                if res.status_code == 200:
                    b64_out = base64.b64encode(res.content).decode()
                    return {"image": f"data:image/png;base64,{b64_out}"}
                logger.warning(f"HF direct call failed ({res.status_code}): {res.text}")
        except Exception as e:
            logger.error(f"HF direct call exception: {e}")

    # Final Fallback: Local rembg (Reliable but uses server CPU/RAM)
    if not IS_RENDER:
        try:
            logger.info("Falling back to LOCAL background removal engine...")
            from .rembg import _process_rembg
            raw = req.image
            if "," in raw:
                raw = raw.split(",", 1)[1]
            img_bytes = base64.b64decode(raw)
            
            # Run local rembg in a thread
            result_bytes = await asyncio.to_thread(_process_rembg, img_bytes)
            b64_out = base64.b64encode(result_bytes).decode()
            return {"image": f"data:image/png;base64,{b64_out}"}
        except Exception as e:
            logger.error(f"Local fallback failed: {e}")
            raise HTTPException(status_code=500, detail=f"All background removal methods failed (including local): {str(e)}")
    else:
        logger.warning("Local fallback skipped on Render to prevent OOM crash.")
        raise HTTPException(status_code=503, detail="AI services are temporarily busy. Please try again in 1 minute.")

@router.post("/generate")
async def proxy_generate(req: ProxyRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")

    if HF_TOKEN:
        try:
            logger.info("Attempting direct Hugging Face call for generation...")
            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(
                    HF_GEN_URL,
                    json={"inputs": req.prompt},
                    headers={"Authorization": f"Bearer {HF_TOKEN}"}
                )
                if res.status_code == 200:
                    b64_out = base64.b64encode(res.content).decode()
                    return {"image": f"data:image/png;base64,{b64_out}"}
                logger.warning(f"HF direct call failed ({res.status_code}): {res.text}")
        except Exception as e:
            logger.error(f"HF direct call exception: {e}")

    return await forward_to_rnai("generate", req)

@router.post("/edit")
async def proxy_edit(req: ProxyRequest):
    # Edit/Inpainting usually requires more complex handling or a specialized HF pipeline
    # For now, we forward to RNAI and hope the platform fix works
    return await forward_to_rnai("edit", req)

async def forward_to_rnai(endpoint: str, req: ProxyRequest):
    if not RNAI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing RNAI API Key")

    url = f"{RNAI_BASE_URL}/{endpoint}"
    payload = {k: v for k, v in req.model_dump().items() if v is not None}

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            res = await client.post(
                url, 
                json=payload, 
                headers={"Authorization": f"Bearer {RNAI_API_KEY}"}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()
        except Exception as exc:
            raise HTTPException(status_code=502, detail=str(exc))
