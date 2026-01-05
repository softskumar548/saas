from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field
from sqlmodel import JSON
from datetime import datetime

class AuditLogBase(SQLModel):
    user_id: Optional[int] = Field(default=None, index=True)
    user_email: Optional[str] = None
    action: str = Field(index=True) # e.g., create_tenant, suspend_user
    target_type: str = Field(index=True) # e.g., tenant, user
    target_id: Optional[str] = None
    details: Dict[str, Any] = Field(default={}, sa_type=JSON) 

class AuditLog(AuditLogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class AuditLogRead(AuditLogBase):
    id: int
    created_at: datetime
