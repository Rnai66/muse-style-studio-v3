"""
/api/tryon — Virtual Try-On endpoint
Streams progress via Server-Sent Events (SSE) so the frontend
can show a live progress bar during the 10-20s inference.
"""
import asyncio
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.pipeline import run_tryon_pipeline

router = APIRouter()


class TryOnRequest(BaseModel):
    person_image: str    # base64 data URL
    garment_image: str   # base64 data URL
    category: str = "upper_body"   # upper_body | lower_body | dresses
    upscale: bool = True


@router.post("/")
async def try_on(req: TryOnRequest):
    """
    SSE endpoint — yields progress events then the final image URL.

    Event format:
      data: {"type": "progress", "message": "...", "percent": 40}
      data: {"type": "result",   "url": "https://..."}
      data: {"type": "error",    "message": "..."}
    """
    async def event_stream():
        progress_events: list[str] = []

        async def on_progress(msg: str, pct: int):
            evt = json.dumps({"type": "progress", "message": msg, "percent": pct})
            progress_events.append(f"data: {evt}\n\n")

        # Start pipeline in background, draining events as they arrive
        pipeline_task = asyncio.create_task(
            run_tryon_pipeline(
                person_b64=req.person_image,
                garment_b64=req.garment_image,
                category=req.category,
                upscale=req.upscale,
                on_progress=on_progress,
            )
        )

        while not pipeline_task.done():
            while progress_events:
                yield progress_events.pop(0)
            await asyncio.sleep(0.2)

        # Drain final events
        while progress_events:
            yield progress_events.pop(0)

        try:
            result_url = pipeline_task.result()
            yield f"data: {json.dumps({'type': 'result', 'url': result_url})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/simple")
async def try_on_simple(req: TryOnRequest):
    """Non-streaming version — waits for full result (may timeout on slow networks)."""
    try:
        result_url = await run_tryon_pipeline(
            person_b64=req.person_image,
            garment_b64=req.garment_image,
            category=req.category,
            upscale=req.upscale,
        )
        return {"url": result_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
