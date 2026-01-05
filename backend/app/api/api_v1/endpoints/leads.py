from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from datetime import datetime

from app.api import deps
from app.models.lead import (
    Lead, LeadCreate, LeadRead, LeadUpdate, LeadWithFollowUps,
    FollowUp, FollowUpCreate, FollowUpRead, LeadStatus
)
from app.models.task import FleeterTask, TaskPriority, TaskStatus, TaskRead
from app.models.tenant import Tenant
from app.models.plan import SubscriptionPlan
from app.models.onboarding import Onboarding, OnboardingStatus
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.audit import audit_service
import secrets
import string

router = APIRouter()

@router.get("/", response_model=List[LeadRead])
def list_leads(
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
    skip: int = 0,
    limit: int = 100,
    status: Optional[LeadStatus] = None,
    search: Optional[str] = None,
) -> Any:
    """
    List leads with optional search and status filter.
    """
    query = select(Lead)
    if status:
        query = query.where(Lead.status == status)
    if search:
        query = query.where(
            Lead.business_name.contains(search) | 
            Lead.contact_person.contains(search)
        )
    
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=LeadRead)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Create a new lead.
    """
    lead = Lead.from_orm(lead_in)
    lead.assigned_to_id = current_user.id
    db.add(lead)
    db.commit()
    db.refresh(lead)
    audit_service.log_action(db=db, user=current_user, action="create_lead", target_type="lead", target_id=lead.id)
    return lead

@router.get("/{id}", response_model=LeadWithFollowUps)
def get_lead(
    id: int,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Get lead details by ID.
    """
    lead = db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.patch("/{id}", response_model=LeadRead)
def update_lead(
    id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Update a lead.
    """
    lead = db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_data = lead_in.dict(exclude_unset=True)
    for key, value in lead_data.items():
        setattr(lead, key, value)
    
    lead.updated_at = datetime.utcnow()
    db.add(lead)
    db.commit()
    db.refresh(lead)
    audit_service.log_action(db=db, user=current_user, action="update_lead", target_type="lead", target_id=lead.id)
    return lead

@router.post("/{id}/convert", response_model=dict)
def convert_lead_to_tenant(
    id: int,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Convert a lead to a tenant.
    Creates a tenant and a tenant admin user.
    """
    lead = db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead.status == LeadStatus.CONVERTED:
        raise HTTPException(status_code=400, detail="Lead already converted")

    # 1. Create Tenant
    slug = lead.business_name.lower().replace(" ", "-")
    # Check if slug exists, if so append random string
    existing_tenant = db.exec(select(Tenant).where(Tenant.slug == slug)).first()
    if existing_tenant:
        slug = f"{slug}-{secrets.token_hex(2)}"

    # Set default plan
    default_plan = db.exec(select(SubscriptionPlan).where(SubscriptionPlan.is_default == True)).first()
    plan_id = default_plan.id if default_plan else None

    tenant = Tenant(
        name=lead.business_name,
        slug=slug,
        plan_id=plan_id,
        is_active=True,
        assigned_fleeter_id=lead.assigned_to_id
    )
    db.add(tenant)
    db.flush()

    # 2. Create Admin User
    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for i in range(10))
    
    user = User(
        email=lead.email or f"admin@{slug}.com",
        full_name=lead.contact_person,
        hashed_password=get_password_hash(temp_password),
        role=UserRole.TENANT_ADMIN,
        tenant_id=tenant.id,
        is_active=True
    )
    db.add(user)

    # 3. Create Onboarding record
    onboarding = Onboarding(
        tenant_id=tenant.id,
        status=OnboardingStatus.IN_PROGRESS,
        owner_invited=True,
        notes=f"Lead converted from {lead.contact_person} at {lead.business_name}."
    )
    db.add(onboarding)

    # 4. Update Lead
    lead.status = LeadStatus.CONVERTED
    lead.updated_at = datetime.utcnow()
    db.add(lead)

    db.commit()
    
    audit_service.log_action(db=db, user=current_user, action="convert_lead", target_type="lead", target_id=lead.id, details={"tenant_id": tenant.id})

    return {
        "status": "success",
        "tenant_id": tenant.id,
        "admin_email": user.email,
        "temp_password": temp_password
    }

@router.post("/{id}/follow-ups", response_model=TaskRead)
def create_follow_up(
    id: int,
    follow_up_in: FollowUpCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Schedule a follow-up for a lead.
    Actually creates a FleeterTask to ensure it shows up on the dashboard.
    """
    lead = db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    task = FleeterTask(
        title=f"Follow-up: {lead.business_name}",
        due_date=follow_up_in.scheduled_at,
        notes=follow_up_in.notes,
        lead_id=id,
        assigned_to_id=current_user.id,
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/follow-ups/all", response_model=List[TaskRead])
def list_all_follow_ups(
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    List all tasks related to leads as follow-ups.
    """
    return db.exec(
        select(FleeterTask)
        .where(FleeterTask.lead_id != None)
        .order_by(FleeterTask.due_date.asc())
    ).all()
