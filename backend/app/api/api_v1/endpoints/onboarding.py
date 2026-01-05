from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.api import deps
from app.models.onboarding import (
    Onboarding, OnboardingRead, OnboardingUpdate, OnboardingWithTenant, OnboardingStatus
)
from app.models.tenant import Tenant
from app.core.audit import audit_service

router = APIRouter()

@router.get("/", response_model=List[OnboardingWithTenant])
def list_onboarding(
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
    status: Optional[OnboardingStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List onboarding pipeline items.
    """
    query = select(Onboarding, Tenant.name, Tenant.slug).join(Tenant)
    if status:
        query = query.where(Onboarding.status == status)
    
    results = db.exec(query.offset(skip).limit(limit)).all()
    
    onboarding_list = []
    for onboarding, name, slug in results:
        data = onboarding.dict()
        data["tenant_name"] = name
        data["tenant_slug"] = slug
        onboarding_list.append(data)
        
    return onboarding_list

@router.get("/{id}", response_model=OnboardingWithTenant)
def get_onboarding(
    id: int,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Get onboarding details.
    """
    onboarding = db.get(Onboarding, id)
    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    
    data = onboarding.dict()
    data["tenant_name"] = onboarding.tenant.name
    data["tenant_slug"] = onboarding.tenant.slug
    return data

@router.patch("/{id}", response_model=OnboardingRead)
def update_onboarding(
    id: int,
    onboarding_in: OnboardingUpdate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Update onboarding progress.
    """
    onboarding = db.get(Onboarding, id)
    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    
    update_data = onboarding_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(onboarding, key, value)
    
    onboarding.updated_at = datetime.utcnow()
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)
    
    audit_service.log_action(
        db=db, 
        user=current_user, 
        action="update_onboarding", 
        target_type="onboarding", 
        target_id=onboarding.id,
        details=update_data
    )
    
    return onboarding
