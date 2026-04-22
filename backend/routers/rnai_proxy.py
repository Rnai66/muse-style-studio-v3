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
def clean_token(val: str, key_name: str) -> str:
    if not val: return ""
    v = val.strip().strip('"').strip("'")
    if v.startswith(f"{key_name}="):
        v = v.replace(f"{key_name}=", "").strip()
    return v

RNAI_API_KEY = clean_token(RNAI_API_KEY, "VITE_RNAI_API_KEY")
HF_TOKEN = clean_token(HF_TOKEN, "HUGGINGFACE_API_TOKEN")
REPLICATE_API_TOKEN = clean_token(REPLICATE_API_TOKEN, "REPLICATE_API_TOKEN")

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
    
    errors = []

    # 1. Try RNAI platform first
    try:
        if RNAI_API_KEY:
            logger.info("Attempting RNAI platform call...")
            res = await forward_to_rnai("remove-background", req)
            if res and "image" in res:
                return res
            errors.append("RNAI: Response missing 'image' field")
        else:
            errors.append("RNAI: API Key missing")
    except Exception as e:
        msg = f"RNAI failed: {str(e)}"
        logger.warning(msg)
        errors.append(msg)

    # 2. Try Replicate (Fallback)
    if REPLICATE_API_TOKEN:
        try:
            logger.info("Attempting Replicate fallback...")
            raw = req.image
            if not raw.startswith("data:"):
                raw = f"data:image/png;base64,{raw}"
            
            def _run_replicate(model_handle: str):
                client = replicate.Client(api_token=REPLICATE_API_TOKEN)
                output = client.run(model_handle, input={"image": raw})
                return output

            # Replicate Tier 1: 851-labs (Ultra fast, 21M runs)
            try:
                logger.info("Replicate Tier 1: 851-labs...")
                result_url = await asyncio.to_thread(_run_replicate, "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc")
                if result_url:
                    final_url = str(result_url)
                    logger.info(f"✓ Replicate T1 success: {final_url}")
                    return {"image": final_url}
            except Exception as e1:
                logger.warning(f"Replicate T1 failed: {str(e1)}")
                errors.append(f"Replicate T1 failed: {str(e1)}")

            # Replicate Tier 2: recraft-ai (Official)
            try:
                logger.info("Replicate Tier 2: recraft-ai...")
                result_url = await asyncio.to_thread(_run_replicate, "recraft-ai/recraft-remove-background")
                if result_url:
                    final_url = str(result_url)
                    logger.info(f"✓ Replicate T2 success: {final_url}")
                    return {"image": final_url}
            except Exception as e2:
                logger.warning(f"Replicate T2 failed: {str(e2)}")
                errors.append(f"Replicate T2 failed: {str(e2)}")

        except Exception as e:
            errors.append(f"Replicate Exception: {str(e)}")
    else:
        errors.append("Replicate: API Token missing")

    # 3. Final Fallback: Local rembg (Reliable but uses server RAM)
    if not IS_RENDER:
        try:
            logger.info("Falling back to LOCAL engine...")
            from .rembg import _process_rembg
            raw = req.image
            if "," in raw: raw = raw.split(",", 1)[1]
            img_bytes = base64.b64decode(raw)
            result_bytes = await asyncio.to_thread(_process_rembg, img_bytes)
            b64_out = base64.b64encode(result_bytes).decode()
            return {"image": f"data:image/png;base64,{b64_out}"}
        except Exception as e:
            errors.append(f"Local failed: {str(e)}")
            raise HTTPException(status_code=500, detail={"message": "All methods failed", "diagnostics": errors})
    else:
        logger.warning(f"Production safety skip. Errors: {errors}")
        raise HTTPException(
            status_code=503, 
            detail={
                "message": "AI services are currently busy at the source. Please check diagnostics.",
                "version": "v1.0.3",
                "diagnostics": errors
            }
        )

@router.post("/generate")
async def proxy_generate(req: ProxyRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")
    
    if HF_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(
                    HF_GEN_URL,
                    json={"inputs": req.prompt},
                    headers={"Authorization": f"Bearer {HF_TOKEN}"}
                )
                if res.status_code == 200:
                    b64_out = base64.b64encode(res.content).decode()
                    return {"image": f"data:image/png;base64,{b64_out}"}
        except: pass
    return await forward_to_rnai("generate", req)

@router.post("/edit")
async def proxy_edit(req: ProxyRequest):
    return await forward_to_rnai("edit", req)

async def forward_to_rnai(endpoint: str, req: ProxyRequest):
    if not RNAI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing RNAI API Key")
    url = f"{RNAI_BASE_URL}/{endpoint}"
    payload = {k: v for k, v in req.model_dump().items() if v is not None}
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            res = await client.post(url, json=payload, headers={"Authorization": f"Bearer {RNAI_API_KEY}"})
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()
        except Exception as exc:
            raise HTTPException(status_code=502, detail=str(exc))
