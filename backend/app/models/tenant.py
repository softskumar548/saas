from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class TenantBase(SQLModel):
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    plan_id: Optional[int] = Field(default=None, foreign_key="subscriptionplan.id")
    logo_url: Optional[str] = None
    logo_position: str = Field(default="top-left")
    tagline: Optional[str] = None
    primary_color: Optional[str] = "#000000"
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = "Inter"
    address: Optional[str] = None
    billing_address: Optional[str] = None
    is_branding_approved: bool = Field(default=False)
    is_active: bool = True
    assigned_fleeter_id: Optional[int] = Field(default=None, foreign_key="users.id")

class Tenant(TenantBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    users: List["User"] = Relationship(
        back_populates="tenant",
        sa_relationship_kwargs={"foreign_keys": "[User.tenant_id]"}
    )
    assigned_fleeter: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Tenant.assigned_fleeter_id]"}
    )
    forms: List["Form"] = Relationship(back_populates="tenant")
    locations: List["Location"] = Relationship(back_populates="tenant")

class TenantCreate(TenantBase):
    pass

class TenantRead(TenantBase):
    id: int
    created_at: datetime

class TenantUsage(SQLModel):
    forms_count: int
    submissions_count: int
    locations_count: int
    max_forms: int = 20
    max_submissions: int = 5000

class TenantWithAdmin(TenantRead):
    admin_email: Optional[str] = None
    usage: Optional[TenantUsage] = None
