from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.api import deps
from app.models.tenant import Tenant
from app.models.plan import SubscriptionPlan
from app.models.onboarding import Onboarding
from app.models.form import Form, Values
from app.models.location import Location
from app.models.user import User

router = APIRouter()

class UsageSnapshot(BaseModel):
    forms_count: int
    locations_count: int
    submissions_count: int

class TenantSalesView(BaseModel):
    id: int
    name: str
    slug: str
    plan_name: Optional[str]
    created_at: datetime
    is_active: bool
    usage: UsageSnapshot
    onboarding_id: Optional[int]
    flags: List[str]
    admin_email: Optional[str] = None

@router.get("/", response_model=List[TenantSalesView])
def list_assigned_tenants(
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    List tenants assigned to the current fleeter.
    """
    query = select(Tenant).where(Tenant.assigned_fleeter_id == current_user.id)
    tenants = db.exec(query).all()
    
    results = []
    for t in tenants:
        # Get usage snapshot
        forms_count = db.exec(select(func.count(Form.id)).where(Form.tenant_id == t.id)).one()
        locations_count = db.exec(select(func.count(Location.id)).where(Location.tenant_id == t.id)).one()
        submissions_count = db.exec(select(func.count(Values.id)).join(Form).where(Form.tenant_id == t.id)).one()
        
        plan = db.get(SubscriptionPlan, t.plan_id) if t.plan_id else None
        onboarding = db.exec(select(Onboarding).where(Onboarding.tenant_id == t.id)).first()
        
        # Determine flags
        flags = []
        if not t.is_active:
            flags.append("Inactive")
        
        # Low usage: e.g. less than 5 submissions in the last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_submissions = db.exec(
            select(func.count(Values.id))
            .join(Form)
            .where(Form.tenant_id == t.id)
            .where(Values.created_at >= seven_days_ago)
        ).one()
        
        if recent_submissions < 5:
            flags.append("Low Usage")
            
        # Trial expiring: (Placeholder logic as trial_end not in model yet, but can be based on created_at + 14 days)
        if (datetime.utcnow() - t.created_at).days > 10 and (datetime.utcnow() - t.created_at).days <= 14:
            flags.append("Trial Expiring")

        results.append(TenantSalesView(
            id=t.id,
            name=t.name,
            slug=t.slug,
            plan_name=plan.name if plan else "Free",
            created_at=t.created_at,
            is_active=t.is_active,
            usage=UsageSnapshot(
                forms_count=forms_count,
                locations_count=locations_count,
                submissions_count=submissions_count
            ),
            onboarding_id=onboarding.id if onboarding else None,
            flags=flags,
            admin_email=db.exec(select(User.email).where(User.tenant_id == t.id).where(User.role == "tenant_admin")).first()
        ))
        
    return results

@router.post("/{tenant_id}/resend-invite")
def resend_invite(
    tenant_id: int,
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Resend invitation to the tenant admin.
    """
    admin = db.exec(select(User).where(User.tenant_id == tenant_id).where(User.role == "tenant_admin")).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Tenant admin not found")
    
    # Placeholder for actual email sending logic
    # In a real app, this would trigger a password reset or welcome email
    return {"status": "success", "message": f"Invitation resent to {admin.email}"}

@router.post("/{tenant_id}/escalate")
def escalate_to_support(
    tenant_id: int,
    reason: str,
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Escalate tenant issues to technical support.
    """
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    # Log escalation as an audit action
    from app.core.audit import audit_service
    audit_service.log_action(
        db=db, 
        user=current_user, 
        action="escalate_tenant", 
        target_type="tenant", 
        target_id=tenant_id,
        details={"reason": reason}
    )
    
    return {"status": "success", "message": "Ticket created for technical support"}
