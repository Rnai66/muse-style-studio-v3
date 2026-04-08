"""Hair styling router."""
import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.pipeline import run_hair_pipeline

router = APIRouter()

class HairRequest(BaseModel):
    person_image: str
    hairstyle: str          # e.g. "bob cut", "long wavy", "pixie cut"
    hair_color: Optional[str] = None   # e.g. "platinum blonde"
    strength: float = 0.6   # 0.4 (subtle) – 0.8 (dramatic)

@router.post("/")
async def change_hair(req: HairRequest):
    async def stream():
        events: list[str] = []
        async def prog(msg, pct): events.append(f"data: {json.dumps({'type':'progress','message':msg,'percent':pct})}\n\n")
        task = asyncio.create_task(run_hair_pipeline(req.person_image, req.hairstyle, req.hair_color, req.strength, prog))
        while not task.done():
            while events: yield events.pop(0)
            await asyncio.sleep(0.2)
        while events: yield events.pop(0)
        try:
            yield f"data: {json.dumps({'type':'result','url':task.result()})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type':'error','message':str(e)})}\n\n"
    return StreamingResponse(stream(), media_type="text/event-stream")
