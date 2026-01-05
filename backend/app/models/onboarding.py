from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime

class OnboardingStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class OnboardingBase(SQLModel):
    tenant_id: int = Field(foreign_key="tenant.id", unique=True)
    status: OnboardingStatus = Field(default=OnboardingStatus.PENDING)
    
    # Checklist items
    owner_invited: bool = Field(default=False)
    branding_configured: bool = Field(default=False)
    form_created: bool = Field(default=False)
    qr_generated: bool = Field(default=False)
    
    notes: Optional[str] = None

class Onboarding(OnboardingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to tenant
    tenant: Optional["Tenant"] = Relationship()

class OnboardingCreate(OnboardingBase):
    pass

class OnboardingUpdate(SQLModel):
    status: Optional[OnboardingStatus] = None
    owner_invited: Optional[bool] = None
    branding_configured: Optional[bool] = None
    form_created: Optional[bool] = None
    qr_generated: Optional[bool] = None
    notes: Optional[str] = None

class OnboardingRead(OnboardingBase):
    id: int
    created_at: datetime
    updated_at: datetime

class OnboardingWithTenant(OnboardingRead):
    tenant_name: str
    tenant_slug: str
