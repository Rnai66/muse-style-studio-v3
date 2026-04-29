FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV + rembg
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Preload rembg ONNX models during build to save 30-45s on first request
RUN python3 -c "
from rembg import new_session
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info('[BUILD] Preloading rembg u2netp ONNX model...')
try:
    session = new_session(model_name='u2netp', providers=['CPUExecutionProvider'])
    logger.info('[BUILD] ✓ rembg model preloaded successfully - first requests will be fast')
except Exception as e:
    logger.warning(f'[BUILD] Warning: Model preload failed (will load on first request): {e}')
"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
