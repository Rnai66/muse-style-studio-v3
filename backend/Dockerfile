FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV + rembg
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-load ONNX models during build to reduce cold-start time
# This way first request won't take 30-45 seconds
RUN python3 -c "from rembg import new_session; new_session(model_name='u2net')" || true

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
