from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.api import deps
from app.models.tenant import Tenant, TenantRead, TenantCreate
from app.models.user import User
from app.models.plan import SubscriptionPlan, SubscriptionPlanRead
from pydantic import BaseModel, EmailStr, field_validator
import shutil
import os
from fastapi import UploadFile, File
from app.models.letterhead import LetterheadAsset, LetterheadAssetRead
from app.services.branding_service import branding_service

router = APIRouter()

# ...

@router.get("/plans", response_model=List[SubscriptionPlanRead])
def list_plans(
    db: Session = Depends(get_session),
) -> Any:
    """
    List available subscription plans.
    """
    return db.exec(select(SubscriptionPlan)).all()

class UpgradeRequest(BaseModel):
    plan_id: int

@router.post("/upgrade", response_model=TenantRead)
def upgrade_plan(
    upgrade: UpgradeRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Upgrade/Downgrade tenant plan (Mock Payment).
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with a tenant")
        
    tenant = db.get(Tenant, current_user.tenant_id)
    plan = db.get(SubscriptionPlan, upgrade.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # MOCK PAYMENT GATEWAY INTEGRATION
    # 1. Create Checkout Session (Stripe)
    # 2. Return URL or confirm payment
    # For now, immediate switch:
    
    tenant.plan_id = plan.id
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    brand_color: Optional[str] = None

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole

import secrets
import string

class TenantOnboardingRequest(TenantCreate):
    # Admin User Details
    admin_email: EmailStr
    admin_full_name: str
    admin_designation: Optional[str] = None
    admin_mobile: Optional[str] = None
    
    # Password Logic
    admin_password: Optional[str] = None
    should_auto_generate_password: bool = False

    @field_validator('admin_mobile')
    def validate_mobile_number(cls, v):
        if v:
            import re
            # Check if starts with +91 and follows with 10 digits
            if not re.match(r'^\+91\d{10}$', v):
                raise ValueError('Mobile number must start with +91 followed by 10 digits')
        return v

@router.post("/", response_model=TenantRead)
def create_tenant(
    tenant_in: TenantOnboardingRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Onboard new tenant: Create Tenant + Admin User + Handle Password & Email.
    """
    # 1. Handle Password Logic
    final_password = tenant_in.admin_password
    if tenant_in.should_auto_generate_password or not final_password:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        final_password = ''.join(secrets.choice(alphabet) for i in range(12))
        
    if not final_password:
         raise HTTPException(status_code=400, detail="Password is required if auto-generation is disabled.")

    # 2. Create Tenant
    # Extract only TenantCreate fields
    tenant_data = tenant_in.dict(exclude={"admin_email", "admin_full_name", "admin_designation", "admin_mobile", "admin_password", "should_auto_generate_password"})
    tenant = Tenant(**tenant_data)
    db.add(tenant)
    db.flush() # Get ID
    
    # 3. Create Admin User
    user = User(
        email=tenant_in.admin_email,
        hashed_password=get_password_hash(final_password),
        full_name=tenant_in.admin_full_name,
        designation=tenant_in.admin_designation,
        mobile_number=tenant_in.admin_mobile,
        role=UserRole.TENANT_ADMIN,
        tenant_id=tenant.id,
        is_active=True
    )
    db.add(user)
    
    db.commit()
    db.refresh(tenant)
    
    # 4. Mock Email Service (Log to Console)
    print("----------------------------------------------------------------")
    print(f"📧 [MOCK EMAIL SERVICE] Sending Credentials to {tenant_in.admin_email}")
    print(f"Subject: Welcome to {tenant.name} - Your Admin Credentials")
    print(f"Dear {tenant_in.admin_full_name},")
    print(f"Your account has been created.")
    print(f"Organization: {tenant.name}")
    print(f"Username: {tenant_in.admin_email}")
    print(f"Password: {final_password}")
    print("----------------------------------------------------------------")
    
    return tenant

@router.get("/me", response_model=TenantRead)
def read_current_tenant(
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user's tenant.
    """
    if not current_user.tenant_id:
         raise HTTPException(status_code=404, detail="User has no tenant")
    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.patch("/me", response_model=TenantRead)
def update_current_tenant(
    tenant_in: TenantUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Update current user's tenant.
    """
    if not current_user.tenant_id:
         raise HTTPException(status_code=404, detail="User has no tenant")
    
    # Check permissions? Assuming any tenant user can edit for now, or just admins.
    # UserRole is in user.py. 
    # For Sprint 3 speed, let's allow it.
    
    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if tenant_in.name is not None:
        tenant.name = tenant_in.name
    if tenant_in.logo_url is not None:
        tenant.logo_url = tenant_in.logo_url
    if tenant_in.brand_color is not None:
        tenant.brand_color = tenant_in.brand_color
        
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.post("/me/letterhead", response_model=LetterheadAssetRead)
async def upload_letterhead(
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Upload tenant letterhead and trigger analysis.
    """
    if not current_user.tenant_id:
         raise HTTPException(status_code=404, detail="User has no tenant")

    # Validate file type
    allowed_extensions = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Save file
    upload_dir = f"uploads/tenants/{current_user.tenant_id}/letterheads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Mock analysis for now
    analysis_data = {
        "logo": {"suggested_url": "https://img.logoipsum.com/280.svg", "placement": "top-center"},
        "brand_colors": {"primary": "#4F46E5", "secondary": "#374151"},
        "identity": {"organization_name": "[MOCK] Your Company"}
    }

    # Create LetterheadAsset
    asset = LetterheadAsset(
        tenant_id=current_user.tenant_id,
        original_file_url=file_path,
        extracted_metadata=analysis_data,
        analysis_status="complete"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    return asset

from fastapi import Form, File

@router.post("/me/branding-approve", response_model=TenantRead)
def approve_branding(
    name: str = Form(...),
    tagline: Optional[str] = Form(None),
    logo_position: str = Form("top-left"),
    primary_color: str = Form("#4F46E5"),
    secondary_color: Optional[str] = Form(None),
    accent_color: Optional[str] = Form(None),
    font_family: str = Form("Inter"),
    address: Optional[str] = Form(None),
    password: str = Form(...),
    logo_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Approve branding settings for the tenant with optional binary logo.
    """
    if not current_user.tenant_id:
         raise HTTPException(status_code=404, detail="User has no tenant")
    
    # Verify password
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Handle Logo Upload if provided
    if logo_file:
        upload_dir = f"uploads/tenants/{current_user.tenant_id}/logos"
        os.makedirs(upload_dir, exist_ok=True)
        # Use a safe filename or just 'logo' with extension
        ext = os.path.splitext(logo_file.filename)[1].lower()
        if not ext: ext = '.png'
        file_path = os.path.join(upload_dir, f"logo{ext}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(logo_file.file, buffer)
        
        # Normalize and set logo_url
        tenant.logo_url = "/" + file_path.replace("\\", "/")

    tenant.name = name
    tenant.tagline = tagline
    tenant.logo_position = logo_position
    tenant.primary_color = primary_color
    tenant.secondary_color = secondary_color
    tenant.accent_color = accent_color
    tenant.font_family = font_family
    tenant.address = address
    tenant.is_branding_approved = True
        
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

