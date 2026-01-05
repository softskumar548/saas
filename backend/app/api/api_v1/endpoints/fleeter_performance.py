from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.api import deps
from app.models.lead import Lead, LeadStatus
from app.models.tenant import Tenant
from app.models.onboarding import Onboarding, OnboardingStatus
from app.models.user import User

router = APIRouter()

class MonthlyStat(BaseModel):
    month: str
    conversions: int
    leads: int

class PerformanceMetrics(BaseModel):
    leads_total: int
    leads_converted: int
    conversion_rate: float
    tenants_activated: int
    avg_onboarding_days: float
    monthly_stats: List[MonthlyStat]
    target_leads: int = 50
    target_conversions: int = 15

@router.get("/", response_model=PerformanceMetrics)
def get_performance_metrics(
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Get performance metrics for the current fleeter.
    """
    # 1. Lead Metrics
    leads_total = db.exec(select(func.count(Lead.id)).where(Lead.assigned_to_id == current_user.id)).one()
    leads_converted = db.exec(
        select(func.count(Lead.id))
        .where(Lead.assigned_to_id == current_user.id)
        .where(Lead.status == LeadStatus.CONVERTED)
    ).one()
    
    conversion_rate = (leads_converted / leads_total * 100) if leads_total > 0 else 0
    
    # 2. Tenant Metrics
    tenants_activated = db.exec(
        select(func.count(Tenant.id))
        .where(Tenant.assigned_fleeter_id == current_user.id)
        .where(Tenant.is_active == True)
    ).one()
    
    # 3. Onboarding Time
    completed_onboardings = db.exec(
        select(Onboarding)
        .join(Tenant)
        .where(Tenant.assigned_fleeter_id == current_user.id)
        .where(Onboarding.status == OnboardingStatus.COMPLETED)
    ).all()
    
    total_days = 0
    for ob in completed_onboardings:
        duration = ob.updated_at - ob.created_at
        total_days += duration.days + (duration.seconds / 86400)
        
    avg_onboarding_days = (total_days / len(completed_onboardings)) if completed_onboardings else 0
    
    # 4. Monthly Stats (Last 6 months)
    monthly_stats = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0)
        # Simple month/year label
        month_label = month_start.strftime("%b %Y")
        
        # This is a bit simplified for SQLite, but good for demo
        end_date = (month_start + timedelta(days=32)).replace(day=1)
        
        m_leads = db.exec(
            select(func.count(Lead.id))
            .where(Lead.assigned_to_id == current_user.id)
            .where(Lead.created_at >= month_start)
            .where(Lead.created_at < end_date)
        ).one()
        
        m_conversions = db.exec(
            select(func.count(Lead.id))
            .where(Lead.assigned_to_id == current_user.id)
            .where(Lead.status == LeadStatus.CONVERTED)
            .where(Lead.updated_at >= month_start)
            .where(Lead.updated_at < end_date)
        ).one()
        
        monthly_stats.append(MonthlyStat(
            month=month_label,
            conversions=m_conversions,
            leads=m_leads
        ))
        
    return PerformanceMetrics(
        leads_total=leads_total,
        leads_converted=leads_converted,
        conversion_rate=round(conversion_rate, 1),
        tenants_activated=tenants_activated,
        avg_onboarding_days=round(avg_onboarding_days, 1),
        monthly_stats=monthly_stats
    )
