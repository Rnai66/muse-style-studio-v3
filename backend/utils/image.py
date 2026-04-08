"""Image preprocessing utilities for MUSE AI pipeline."""
import base64
import io
from typing import Optional
from PIL import Image
import numpy as np


def b64_to_pil(b64: str) -> Image.Image:
    """Decode base64 string to PIL Image."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    return Image.open(io.BytesIO(data))


def pil_to_b64(img: Image.Image, fmt: str = "JPEG", quality: int = 90) -> str:
    """Encode PIL Image to base64 data URL."""
    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=quality)
    encoded = base64.b64encode(buf.getvalue()).decode()
    mime = "image/jpeg" if fmt.upper() == "JPEG" else "image/png"
    return f"data:{mime};base64,{encoded}"


def pil_to_bytes(img: Image.Image, fmt: str = "JPEG") -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def resize_keep_aspect(img: Image.Image, max_dim: int = 1024) -> Image.Image:
    """Resize image keeping aspect ratio within max_dim."""
    w, h = img.size
    if max(w, h) <= max_dim:
        return img
    ratio = max_dim / max(w, h)
    new_w, new_h = int(w * ratio), int(h * ratio)
    return img.resize((new_w, new_h), Image.LANCZOS)


def remove_background(img: Image.Image) -> Image.Image:
    """Remove background using rembg."""
    try:
        from rembg import remove
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        result = remove(buf.getvalue())
        return Image.open(io.BytesIO(result)).convert("RGBA")
    except ImportError:
        # rembg not available — return as-is
        return img


def composite_on_white(img: Image.Image) -> Image.Image:
    """Composite RGBA image on white background."""
    if img.mode != "RGBA":
        return img.convert("RGB")
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    return bg.convert("RGB")


def crop_face(img: Image.Image, padding: float = 0.3) -> Optional[Image.Image]:
    """Basic face crop using OpenCV (no deep learning required)."""
    try:
        import cv2
        arr = np.array(img.convert("RGB"))
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = detector.detectMultiScale(gray, 1.1, 4)
        if len(faces) == 0:
            return None
        x, y, w, h = faces[0]
        pw = int(w * padding)
        ph = int(h * padding)
        x1, y1 = max(0, x - pw), max(0, y - ph)
        x2, y2 = min(img.width, x + w + pw), min(img.height, y + h + ph)
        return img.crop((x1, y1, x2, y2))
    except Exception:
        return None
