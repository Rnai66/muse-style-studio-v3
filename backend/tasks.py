"""
Celery task queue for heavy AI jobs.
Allows queuing multiple requests without blocking the API server.

Usage (from routers):
    task = run_tryon_task.delay(person_b64, garment_b64, category)
    # Poll: GET /api/tasks/{task.id}
"""
import os
from celery import Celery
from services.pipeline import run_tryon_pipeline, run_hair_pipeline, run_makeup_pipeline
import asyncio

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery("muse", broker=REDIS_URL, backend=REDIS_URL)
app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    result_expires=3600,  # results kept for 1 hour
)


def _run_async(coro):
    """Run async coroutine in sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@app.task(bind=True, name="tasks.tryon")
def run_tryon_task(self, person_b64: str, garment_b64: str, category: str = "upper_body"):
    self.update_state(state="PROGRESS", meta={"percent": 5, "message": "เริ่มต้น..."})
    result_url = _run_async(
        run_tryon_pipeline(person_b64, garment_b64, category)
    )
    return {"url": result_url}


@app.task(bind=True, name="tasks.hair")
def run_hair_task(self, person_b64: str, hairstyle: str, color: str = None, strength: float = 0.6):
    self.update_state(state="PROGRESS", meta={"percent": 5, "message": "เริ่มต้น..."})
    result_url = _run_async(run_hair_pipeline(person_b64, hairstyle, color, strength))
    return {"url": result_url}


@app.task(bind=True, name="tasks.makeup")
def run_makeup_task(self, person_b64: str, style: str, intensity: float = 0.5):
    self.update_state(state="PROGRESS", meta={"percent": 5, "message": "เริ่มต้น..."})
    result_url = _run_async(run_makeup_pipeline(person_b64, style, intensity))
    return {"url": result_url}
