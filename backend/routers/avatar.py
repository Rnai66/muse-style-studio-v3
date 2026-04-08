"""
/api/avatar/generate/ — Generate a photorealistic avatar portrait from user profile data.
Uses FLUX.1 Schnell (fast, high-quality text-to-image) on Replicate.

POST body:
{
  "skin_tone":   "medium",
  "hair_color":  "black",
  "hair_length": "shoulder",
  "hair_style":  "straight",
  "face_shape":  "oval",
  "body_type":   "hourglass",
  "name":        "My Style"   (optional)
}

Returns: { "url": "https://..." }
"""
import os
import asyncio
import replicate
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ── Label maps (mirrors frontend types) ──
SKIN_LABELS = {
    'ivory':  'very fair ivory skin',
    'fair':   'fair light skin',
    'light':  'light beige skin',
    'medium': 'warm medium tan skin',
    'tan':    'golden tan skin',
    'deep':   'deep brown skin',
    'dark':   'deep dark brown skin',
}
HAIR_COLOR_LABELS = {
    'black':      'jet black hair',
    'darkbrown':  'dark brown hair',
    'brown':      'chestnut brown hair',
    'lightbrown': 'light caramel brown hair',
    'blonde':     'golden blonde hair',
    'red':        'auburn red hair',
    'gray':       'silver gray hair',
    'white':      'white hair',
    'colored':    'vibrant colored hair',
}
HAIR_LENGTH_LABELS = {
    'bald':      'shaved bald',
    'short':     'short hair',
    'ear':       'ear-length bob hair',
    'shoulder':  'shoulder-length hair',
    'long':      'long hair past shoulders',
    'verylong':  'very long hair down to waist',
}
HAIR_STYLE_MAP = {
    'straight': 'straight',
    'wavy':     'wavy',
    'curly':    'curly',
    'afro':     'afro',
    'ponytail': 'ponytail',
    'bun':      'bun',
    'braids':   'braided',
    'updo':     'updo',
}
BODY_TYPE_MAP = {
    'hourglass': 'hourglass body shape',
    'pear':      'pear-shaped body',
    'apple':     'apple-shaped body',
    'rectangle': 'athletic rectangular body',
    'inverted':  'inverted triangle body shape',
}
FACE_SHAPE_MAP = {
    'oval':    'oval face',
    'round':   'round face',
    'square':  'square jaw face',
    'heart':   'heart-shaped face',
    'diamond': 'diamond-shaped face',
    'oblong':  'oblong face',
}


def build_prompt(req: 'AvatarRequest') -> str:
    skin  = SKIN_LABELS.get(req.skin_tone, 'medium skin')
    hair  = (
        f"{HAIR_STYLE_MAP.get(req.hair_style, 'straight')} "
        f"{HAIR_LENGTH_LABELS.get(req.hair_length, 'shoulder-length')} "
        f"{HAIR_COLOR_LABELS.get(req.hair_color, 'black hair')}"
    )
    body  = BODY_TYPE_MAP.get(req.body_type, 'slim body')
    face  = FACE_SHAPE_MAP.get(req.face_shape, 'oval face')

    return (
        f"Professional fashion portrait photo of a beautiful young Asian woman, "
        f"{skin}, {hair}, {face}, {body}. "
        "Full-body shot, standing confidently, wearing elegant minimal white outfit, "
        "soft studio lighting, clean white background, ultra-detailed, photorealistic, "
        "8k, fashion magazine style, high quality, sharp focus."
    )


class AvatarRequest(BaseModel):
    skin_tone:   str = 'medium'
    hair_color:  str = 'black'
    hair_length: str = 'shoulder'
    hair_style:  str = 'straight'
    face_shape:  str = 'oval'
    body_type:   str = 'hourglass'
    name: Optional[str] = None


@router.post("/generate/")
async def generate_avatar(req: AvatarRequest):
    token = os.environ.get("REPLICATE_API_TOKEN", "").strip().strip('"').strip("'")
    if not token:
        raise HTTPException(status_code=503, detail="REPLICATE_API_TOKEN not configured")

    prompt = build_prompt(req)
    client = replicate.Client(api_token=token)

    try:
        output = await client.async_run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt":          prompt,
                "num_outputs":     1,
                "aspect_ratio":    "2:3",        # portrait orientation
                "output_quality":  90,
                "output_format":   "webp",
            },
        )
        # flux-schnell returns a list of FileOutput objects
        if isinstance(output, list) and output:
            url = str(output[0])
        else:
            url = str(output)
        return {"url": url, "prompt": prompt}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar generation failed: {e}")
