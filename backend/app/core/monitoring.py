import time
import logging
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure Centralized Logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("saas.observability")

class MonitoringMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        path = request.url.path
        method = request.method
        client_ip = request.client.host if request.client else "unknown"
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as e:
            # Error Tracking
            status_code = 500
            logger.error(json.dumps({
                "event": "error",
                "message": str(e),
                "path": path,
                "method": method
            }), exc_info=True)
            raise e
        finally:
            # API Latency & Metrics
            process_time = time.time() - start_time
            duration_ms = round(process_time * 1000, 2)
            
            log_payload = {
                "event": "request_completed",
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip
            }
            
            # Public Endpoint Metrics Tagging
            if "/public/" in path:
                log_payload["metric_type"] = "public_usage"
            
            logger.info(json.dumps(log_payload))
