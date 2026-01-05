from fastapi import APIRouter
from app.api.api_v1.endpoints import login, forms, locations, tenants, users, admin, leads, onboarding, fleeter_tenants, tasks, fleeter_performance

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(fleeter_performance.router, prefix="/fleeter/performance", tags=["fleeter-performance"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(fleeter_tenants.router, prefix="/fleeter/tenants", tags=["fleeter-tenants"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
