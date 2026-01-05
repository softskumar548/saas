from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.db import base # Import models for side-effects
from app.core.monitoring import MonitoringMiddleware

from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="QR Feedback SaaS API",
    description="Backend for QR Code Customer Feedback Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Static file serving for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
# CORS Configuration
from app.core.config import settings

origins = [
    "http://localhost",
    "http://localhost:4200",
    "http://localhost:4201",
    "http://localhost:8100",
]

# Add origins from settings
if settings.BACKEND_CORS_ORIGINS:
    for origin in settings.BACKEND_CORS_ORIGINS:
        origins.append(str(origin).rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(MonitoringMiddleware)

from datetime import datetime

@app.on_event("startup")
async def startup_event():
    app.state.start_time = datetime.utcnow()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QR Feedback API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

from app.api.api_v1.api import api_router
from app.core.config import settings

app.include_router(api_router, prefix=settings.API_V1_STR)


# Reload trigger
