from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from enum import Enum
from pydantic import validator

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TaskBase(SQLModel):
    title: str = Field(index=True)
    due_date: datetime
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    notes: Optional[str] = None
    
    assigned_to_id: int = Field(foreign_key="users.id")
    lead_id: Optional[int] = Field(default=None, foreign_key="lead.id", nullable=True)
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenant.id", nullable=True)

    @validator("due_date", pre=False)
    def ensure_utc(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class FleeterTask(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    assigned_to: "User" = Relationship()
    lead: Optional["Lead"] = Relationship(back_populates="follow_ups")
    tenant: Optional["Tenant"] = Relationship()

class TaskCreate(TaskBase):
    pass

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    notes: Optional[str] = None
    lead_id: Optional[int] = None
    tenant_id: Optional[int] = None

class TaskRead(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    @validator("created_at", "updated_at", pre=False)
    def ensure_read_utc(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class TaskWithContext(TaskRead):
    lead_name: Optional[str] = None
    tenant_name: Optional[str] = None
