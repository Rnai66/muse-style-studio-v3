"""
/api/chat — AI Stylist Chat Proxy
Proxies chat requests to Anthropic Claude, keeping the API key server-side.
"""
import os
import traceback
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
import logging

logger = logging.getLogger("muse.chat")
router = APIRouter()


class ChatRequest(BaseModel):
    system: str
    messages: list[Any]   # list of Anthropic-format message dicts
    model: str = "claude-sonnet-4-6"   # BUG FIX: "claude-opus-4-5" was an invalid model string
    max_tokens: int = 1024


@router.post("/")
async def chat(req: ChatRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY ยังไม่ได้ตั้งค่า")

    # BUG FIX: Use AsyncAnthropic — synchronous client blocks the FastAPI event loop
    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        msg = await client.messages.create(
            model=req.model,
            max_tokens=req.max_tokens,
            system=req.system,
            messages=req.messages,
        )
        return {"content": [{"type": "text", "text": msg.content[0].text}]}
    except anthropic.AuthenticationError:
        raise HTTPException(503, "ANTHROPIC_API_KEY ไม่ถูกต้อง")
    except anthropic.RateLimitError:
        raise HTTPException(429, "Rate limit — กรุณารอสักครู่")
    except anthropic.BadRequestError as e:
        logger.warning(f"BadRequest: {e}")
        raise HTTPException(400, f"ข้อความไม่ถูกต้อง: {e}")
    except Exception as e:
        logger.error(f"Claude chat error: {e}\n{traceback.format_exc()}")
        raise HTTPException(500, f"Claude API error: {str(e)}")
