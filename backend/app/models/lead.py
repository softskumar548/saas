from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from enum import Enum
from pydantic import validator

class LeadStatus(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    DEMO_SCHEDULED = "DEMO_SCHEDULED"
    CONVERTED = "CONVERTED"
    DROPPED = "DROPPED"

class FollowUpStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class LeadBase(SQLModel):
    business_name: str = Field(index=True)
    contact_person: str
    email: Optional[str] = None
    phone: Optional[str] = None
    business_type: Optional[str] = None
    notes: Optional[str] = None
    status: LeadStatus = Field(default=LeadStatus.NEW)
    assigned_to_id: Optional[int] = Field(default=None, foreign_key="users.id")

class Lead(LeadBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    follow_ups: List["FleeterTask"] = Relationship(back_populates="lead")

class FollowUpBase(SQLModel):
    lead_id: int = Field(foreign_key="lead.id")
    scheduled_at: datetime
    notes: Optional[str] = None
    status: FollowUpStatus = Field(default=FollowUpStatus.PENDING)

class FollowUp(FollowUpBase):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    


class LeadCreate(LeadBase):
    pass

class LeadUpdate(SQLModel):
    business_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    business_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[LeadStatus] = None
    assigned_to_id: Optional[int] = None

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpRead(FollowUpBase):
    id: int
    created_at: datetime

    @validator("scheduled_at", "created_at", pre=False)
    def ensure_utc(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class LeadRead(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    @validator("created_at", "updated_at", pre=False)
    def ensure_read_utc(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class LeadWithFollowUps(LeadRead):
    follow_ups: List["TaskRead"] = []
