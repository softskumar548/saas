from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class LocationBase(SQLModel):
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    address: Optional[str] = None
    tenant_id: int = Field(foreign_key="tenant.id")
    default_form_id: Optional[int] = Field(default=None, foreign_key="form.id", nullable=True)

class Location(LocationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenant: "Tenant" = Relationship(back_populates="locations")

class LocationCreate(LocationBase):
    tenant_id: Optional[int] = None
    default_form_id: Optional[int] = None

class LocationUpdate(SQLModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    address: Optional[str] = None
    default_form_id: Optional[int] = None

class LocationRead(LocationBase):
    id: int
    created_at: datetime
    default_form_id: Optional[int] = None
