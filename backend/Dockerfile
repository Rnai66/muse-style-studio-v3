FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV + rembg
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Preload rembg ONNX model during build (saves ~40s on first request)
RUN python3 -c "import logging; logging.basicConfig(level=logging.INFO); from rembg import new_session; new_session('u2net'); print('rembg model ready')" || echo "rembg preload skipped"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
