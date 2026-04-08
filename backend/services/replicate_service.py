"""
Replicate API service — wraps all AI model calls.

Models used:
  - Virtual Try-On : cuuupid/idm-vton
  - Background rm  : lucataco/remove-bg
  - Hair           : flux-kontext-apps/change-haircut  (FLUX.1 Kontext)
  - Makeup         : black-forest-labs/flux-kontext-pro (FLUX.1 Kontext)
  - Upscaler       : nightmareai/real-esrgan
"""
import os
import io
import asyncio
import base64
import replicate
from replicate.exceptions import ReplicateError
from typing import Optional


def _client() -> replicate.Client:
    token = os.environ.get("REPLICATE_API_TOKEN", "")
    if not token:
        raise RuntimeError("REPLICATE_API_TOKEN is not set")
    # Strip whitespace, newlines (\r), and potential quotes from env file
    token = token.strip().strip('"').strip("'")
    return replicate.Client(api_token=token)


async def _run_with_retry(client: replicate.Client, model: str, input_data: dict, max_retries: int = 5):
    """Run a replicate model with automatic retry on 429 rate limit errors."""
    last_err = None
    for attempt in range(max_retries):
        try:
            return await client.async_run(model, input=input_data)
        except ReplicateError as e:
            err_str = str(e).lower()
            if "429" in err_str or "throttled" in err_str or "rate limit" in err_str:
                last_err = e
                # Rate limit for free tier is 1 req per sec (bursts reset in ~2s)
                # Wait 2.5 seconds before trying again
                await asyncio.sleep(2.5)
            else:
                raise e
    
    # If it fails all retries, raise the last rate limit error
    raise last_err


def _b64_to_fileobj(b64_data_url: str, filename: str = "image.jpg") -> io.BytesIO:
    """Convert base64 data URL or raw base64 string to a BytesIO file object."""
    if "," in b64_data_url:
        b64_data_url = b64_data_url.split(",", 1)[1]
    data = base64.b64decode(b64_data_url)
    buf = io.BytesIO(data)
    buf.name = filename
    buf.seek(0)   # reset pointer so SDK can read from beginning
    return buf


# ─────────────────────────────────────────────────────────────
# 1. VIRTUAL TRY-ON  (IDM-VTON by cuuupid)
# ─────────────────────────────────────────────────────────────
async def virtual_tryon(
    person_b64: str,
    garment_b64: str,
    category: str = "upper_body",  # upper_body | lower_body | dresses | outerwear | accessories | shoes
) -> str:
    """
    Run virtual try-on using FLUX.1 Kontext Pro.
    We pass the person image, then prompt Kontext to dress them in the garment.
    """
    client = _client()
    person_file  = _b64_to_fileobj(person_b64,  "person.jpg")

    # Map category to natural-language description
    cat_map = {
        "upper_body": "top / shirt / blouse",
        "lower_body": "pants / skirt",
        "dresses":    "dress",
        "outerwear":  "jacket / coat",
        "accessories": "accessory / jewellery",
        "shoes":       "shoes / footwear",
    }
    item_desc = cat_map.get(category, "outfit / garment")

    prompt = (
        f"Dress this person wearing the {item_desc} shown in the reference garment image. "
        "Keep the person's face, body shape, skin tone, pose, and background exactly the same. "
        "Only replace what they are wearing with the new garment, maintaining realistic lighting and fabric texture."
    )

    output = await _run_with_retry(
        client,
        "black-forest-labs/flux-kontext-pro",
        input_data={
            "image":          person_file,
            "prompt":         prompt,
            "output_quality": 90,
        },
    )
    if isinstance(output, list):
        return str(output[0])
    return str(output)


# ─────────────────────────────────────────────────────────────
# 2. BACKGROUND REMOVAL
# ─────────────────────────────────────────────────────────────
async def remove_background(image_b64: str) -> str:
    client = _client()
    image_file = _b64_to_fileobj(image_b64, "image.jpg")
    output = await _run_with_retry(
        client,
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        input_data={"image": image_file},
    )
    return str(output)


# ─────────────────────────────────────────────────────────────
# 3. HAIR STYLE CHANGE  (FLUX.1 Kontext — change-haircut)
# ─────────────────────────────────────────────────────────────
async def change_hairstyle(
    person_b64: str,
    hairstyle_prompt: str,
    hair_color: Optional[str] = None,
    strength: float = 0.65,      # kept for API compat, Kontext ignores it
) -> str:
    client = _client()
    image_file = _b64_to_fileobj(person_b64, "person.jpg")

    color_part = f" with {hair_color} color" if hair_color else ""
    prompt = f"Change the hair to {hairstyle_prompt} hairstyle{color_part}. Keep the face, expression and background exactly the same."

    output = await _run_with_retry(
        client,
        "flux-kontext-apps/change-haircut",
        input_data={
            "image":  image_file,
            "prompt": prompt,
        },
    )
    # Kontext returns a single URL or FileOutput object
    if isinstance(output, list):
        return str(output[0])
    return str(output)


# ─────────────────────────────────────────────────────────────
# 4. MAKEUP  (FLUX.1 Kontext Pro — text-guided editing)
# ─────────────────────────────────────────────────────────────
async def apply_makeup(
    person_b64: str,
    makeup_style: str,
    intensity: float = 0.5,
) -> str:
    client = _client()
    image_file = _b64_to_fileobj(person_b64, "face.jpg")

    # Map intensity to descriptive word
    if intensity < 0.35:
        level = "very subtle, barely-there"
    elif intensity < 0.6:
        level = "natural, elegant"
    else:
        level = "bold, dramatic, full glam"

    prompt = (
        f"Apply {level} {makeup_style} makeup to this person. "
        "Keep the face structure, identity, lighting and background exactly the same. "
        "Only change the makeup on the face."
    )

    output = await _run_with_retry(
        client,
        "black-forest-labs/flux-kontext-pro",
        input_data={
            "image":       image_file,
            "prompt":      prompt,
            "output_quality": 90,
        },
    )
    if isinstance(output, list):
        return str(output[0])
    return str(output)


# ─────────────────────────────────────────────────────────────
# 5. UPSCALING (Real-ESRGAN)
# ─────────────────────────────────────────────────────────────
async def upscale_image(image_url: str, scale: int = 2) -> str:
    """Upscale an already-hosted image URL."""
    client = _client()
    output = await _run_with_retry(
        client,
        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        input_data={
            "image":        image_url,
            "scale":        scale,
            "face_enhance": True,
        },
    )
    return str(output)


# ─────────────────────────────────────────────────────────────
# Helper: upload bytes → Replicate file URL  (kept for pipeline compat)
# ─────────────────────────────────────────────────────────────
async def upload_image_bytes(image_bytes: bytes, filename: str = "image.jpg") -> str:
    """
    Upload raw bytes to Replicate via its Files API and return the hosted URL.
    Uses asyncio.to_thread because client.files.create is synchronous.
    """
    client = _client()
    file_obj = io.BytesIO(image_bytes)
    file_obj.name = filename
    result = await asyncio.to_thread(client.files.create, file_obj)
    return result.urls["get"]
