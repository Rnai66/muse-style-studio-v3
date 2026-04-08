"""
/api/tasks — Poll Celery task status (alternative to SSE).
Useful for mobile clients that don't support SSE well.

GET /api/tasks/{task_id}
→ { "status": "PENDING|PROGRESS|SUCCESS|FAILURE", "percent": 0-100, "url": "..." }
"""
from fastapi import APIRouter, HTTPException
from tasks import app as celery_app

router = APIRouter()


@router.get("/{task_id}")
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)

    if result.state == "PENDING":
        return {"status": "pending", "percent": 0, "message": "รอในคิว..."}

    if result.state == "PROGRESS":
        meta = result.info or {}
        return {
            "status": "running",
            "percent": meta.get("percent", 0),
            "message": meta.get("message", ""),
        }

    if result.state == "SUCCESS":
        return {"status": "done", "percent": 100, "url": result.result.get("url")}

    if result.state == "FAILURE":
        raise HTTPException(status_code=500, detail=str(result.result))

    return {"status": result.state.lower(), "percent": 0}
