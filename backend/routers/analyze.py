"""
/api/analyze — Body & Style Analysis
Uses Claude Vision to analyze the person's photo.
"""
import os
import re
import json
import traceback
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger("muse.analyze")
router = APIRouter()

SYSTEM = """คุณคือ MUSE AI Fashion Analyst ผู้เชี่ยวชาญด้านแฟชั่น
ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่นใดก่อนหรือหลัง JSON
ห้ามใส่ markdown code block (```) ห้ามมี prefix ใดๆ"""

PROMPT = """วิเคราะห์รูปบุคคลนี้แล้วตอบเป็น JSON รูปแบบนี้เท่านั้น:
{
  "body_type": "hourglass",
  "body_type_th": "นาฬิกาทราย",
  "skin_tone": "medium",
  "style_vibe": ["casual", "feminine"],
  "color_palette": {
    "best_colors": ["#8B4513", "#D2691E", "#F4A460"],
    "season": "autumn"
  },
  "recommendations": {
    "clothing": ["แนะนำ Wrap dress เพราะเน้นเอว"],
    "avoid": ["หลีกเลี่ยงเสื้อ Boxy ที่ซ่อนเอว"],
    "accessories": ["Belt เพื่อเน้นเอว"]
  },
  "summary": "สรุปสั้นๆ 1-2 ประโยค"
}"""


class AnalyzeRequest(BaseModel):
    person_image: str


def extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{[\s\S]+\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Cannot parse JSON: {text[:200]}")


def get_media_type(data_url: str) -> str:
    if data_url.startswith("data:image/png"):  return "image/png"
    if data_url.startswith("data:image/webp"): return "image/webp"
    if data_url.startswith("data:image/gif"):  return "image/gif"
    return "image/jpeg"


def strip_prefix(data_url: str) -> str:
    return data_url.split(",", 1)[1] if "," in data_url else data_url


@router.post("/")
async def analyze_body(req: AnalyzeRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY ยังไม่ได้ตั้งค่า")

    try:
        media_type = get_media_type(req.person_image)
        b64 = strip_prefix(req.person_image)
        size_mb = len(b64) * 3 / 4 / (1024 * 1024)
        logger.info(f"Analyze request: {media_type}, {size_mb:.1f}MB")
        if size_mb > 4.5:
            raise HTTPException(413, f"รูปใหญ่เกินไป ({size_mb:.1f}MB) กรุณาย่อรูปก่อน")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"รูปภาพไม่ถูกต้อง: {e}")

    # BUG FIX: Use AsyncAnthropic — synchronous client blocks the FastAPI event loop
    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        msg = await client.messages.create(
            model="claude-sonnet-4-6",   # BUG FIX: "claude-opus-4-5" was an invalid model string
            max_tokens=1024,
            system=SYSTEM,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                {"type": "text",  "text": PROMPT},
            ]}],
        )
    except anthropic.BadRequestError as e:
        logger.warning(f"BadRequest: {e}")
        raise HTTPException(400, "ไม่สามารถวิเคราะห์รูปได้ กรุณาใช้รูปที่มีบุคคลชัดเจน")
    except anthropic.AuthenticationError:
        raise HTTPException(503, "ANTHROPIC_API_KEY ไม่ถูกต้อง")
    except anthropic.RateLimitError:
        raise HTTPException(429, "Rate limit — กรุณารอสักครู่")
    except Exception as e:
        logger.error(f"Claude error: {e}\n{traceback.format_exc()}")
        raise HTTPException(500, f"Claude API error: {str(e)}")

    try:
        raw = msg.content[0].text
        logger.info(f"Claude response: {raw[:300]}")
        return extract_json(raw)
    except Exception as e:
        logger.error(f"JSON parse error: {e}")
        return {
            "body_type": "unknown", "body_type_th": "ไม่สามารถวิเคราะห์ได้",
            "skin_tone": "medium", "style_vibe": [],
            "color_palette": {"best_colors": [], "season": ""},
            "recommendations": {"clothing": [], "avoid": [], "accessories": []},
            "summary": msg.content[0].text[:400],
        }


@router.get("/style-tips")
async def style_tips(body_type: str, occasion: str):
    tips = {
        ("hourglass","wedding"):  "เน้นชุดที่รัดเอว เช่น Wrap dress หรือ Fit-and-flare",
        ("pear","office"):        "เลือก blazer ที่ขยายช่วงไหล่ กางเกงทรง Wide-leg",
        ("apple","evening"):      "ชุดที่มีรายละเอียดบนชุดและ A-line ด้านล่าง",
        ("rectangle","casual"):   "สร้างเอวด้วย Belt หรือชุดที่มี Ruffle",
        ("inverted","wedding"):   "สะโพกบาน Maxi skirt หรือ Peplum top",
    }
    return {"tip": tips.get((body_type.lower(), occasion.lower()), "เลือกชุดที่ทำให้คุณรู้สึกมั่นใจ")}