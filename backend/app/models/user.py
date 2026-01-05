from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    FLEETER = "fleeter"
    TENANT_ADMIN = "tenant_admin"
    TENANT_STAFF = "tenant_staff"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    designation: Optional[str] = None
    mobile_number: Optional[str] = None
    role: UserRole = Field(default=UserRole.TENANT_ADMIN)
    is_active: bool = True
    email_notifications: bool = Field(default=True)
    push_notifications: bool = Field(default=True)
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenant.id", nullable=True)

class UserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    designation: Optional[str] = None
    mobile_number: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None

class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tenant: Optional["Tenant"] = Relationship(
        back_populates="users",
        sa_relationship_kwargs={"foreign_keys": "User.tenant_id"}
    )
    last_login: Optional[datetime] = Field(default=None)

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime]
