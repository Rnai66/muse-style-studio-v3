#!/bin/bash

# Start Celery worker in the background
celery -A tasks worker --loglevel=info --concurrency=2 &

# Start FastAPI server on the port provided by Render (or 8000 default)
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
