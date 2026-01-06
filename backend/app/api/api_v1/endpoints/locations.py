from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select, func
from app.db.session import get_session
from app.api import deps
from app.models.location import Location, LocationCreate, LocationRead, LocationUpdate
from app.models.tenant import Tenant
from app.models.plan import SubscriptionPlan
from app.models.user import User
import qrcode
import io

router = APIRouter()

@router.get("/", response_model=List[LocationRead])
def read_locations(
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve locations for the current tenant.
    """
    if not current_user.tenant_id:
        return []
        
    statement = select(Location).where(Location.tenant_id == current_user.tenant_id).offset(skip).limit(limit)
    return db.exec(statement).all()

@router.post("/", response_model=LocationRead)
def create_location(
    location: LocationCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Create a new location.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with a tenant")
    
    # Enforce Plan Limits
    tenant = db.get(Tenant, current_user.tenant_id)
    if tenant and tenant.plan_id:
        plan = db.get(SubscriptionPlan, tenant.plan_id)
        if plan:
            count = db.exec(select(func.count(Location.id)).where(Location.tenant_id == tenant.id)).one()
            if count >= plan.max_locations:
                raise HTTPException(status_code=402, detail="Plan limit reached. Upgrade to create more locations.")
    
    # Force tenant_id
    location_data = location.dict()
    location_data['tenant_id'] = current_user.tenant_id
    
    db_obj = Location(**location_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=LocationRead)
def update_location(
    id: int,
    location_in: LocationUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Update a location.
    """
    location = db.get(Location, id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    if location.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    update_data = location_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
        
    db.add(location)
    db.commit()
    db.refresh(location)
    return location

@router.get("/{id}/qr_image")
def get_qr_image(
    id: int,
    form_slug: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    location = db.get(Location, id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    if location.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.core.config import settings
    base_url = settings.FRONTEND_URL
    url = f"{base_url}/f/{form_slug}?loc={location.id}"
    
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")
