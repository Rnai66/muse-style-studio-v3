"""Makeup router."""
import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.pipeline import run_makeup_pipeline

router = APIRouter()

MAKEUP_PRESETS = {
    "natural":    "natural, no-makeup look, dewy skin",
    "office":     "professional, subtle makeup, matte skin",
    "glam":       "full glam, smoky eye, bold lip, contoured",
    "smoky":      "dramatic smoky eye, nude lip",
    "bold_lip":   "bold red lip, minimal eye makeup",
    "korean":     "K-beauty style, gradient lip, glass skin",
    "evening":    "evening glam, bronze eye, highlighted cheeks",
    "editorial":  "high fashion editorial makeup, avant-garde",
}

class MakeupRequest(BaseModel):
    person_image: str
    style: str = "natural"   # key from MAKEUP_PRESETS or free text
    intensity: float = 0.5

@router.post("/")
async def apply_makeup(req: MakeupRequest):
    prompt = MAKEUP_PRESETS.get(req.style, req.style)
    async def stream():
        events: list[str] = []
        async def prog(msg, pct): events.append(f"data: {json.dumps({'type':'progress','message':msg,'percent':pct})}\n\n")
        task = asyncio.create_task(run_makeup_pipeline(req.person_image, prompt, req.intensity, prog))
        while not task.done():
            while events: yield events.pop(0)
            await asyncio.sleep(0.2)
        while events: yield events.pop(0)
        try:
            yield f"data: {json.dumps({'type':'result','url':task.result()})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type':'error','message':str(e)})}\n\n"
    return StreamingResponse(stream(), media_type="text/event-stream")

@router.get("/presets")
async def presets():
    return {"presets": list(MAKEUP_PRESETS.keys())}
