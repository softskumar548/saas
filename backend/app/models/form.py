from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from sqlmodel import JSON
from datetime import datetime

class FormBase(SQLModel):
    title: str
    slug: str = Field(index=True, unique=True)
    is_published: bool = False
    is_default: bool = Field(default=False)
    form_schema: Dict[str, Any] = Field(default={}, sa_type=JSON)  # Unstructured Form Definition

class Form(FormBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tenant_id: int = Field(foreign_key="tenant.id")
    
    # Relationships
    tenant: "Tenant" = Relationship(back_populates="forms")
    responses: List["Values"] = Relationship(back_populates="form") # "Values" is the feedback table

class FormCreate(SQLModel):
    title: str
    slug: str
    form_schema: Dict[str, Any] = {}
    is_published: bool = False
    is_default: bool = False

class FormUpdate(SQLModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    form_schema: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None
    is_default: Optional[bool] = None

class FormRead(FormBase):
    id: int
    created_at: datetime
    tenant_id: int


# The Feedback Response Table
class ValuesBase(SQLModel):
    data: Dict[str, Any] = Field(default={}, sa_type=JSON) # Unstructured User Answers
    form_id: int = Field(foreign_key="form.id")
    location_id: Optional[int] = Field(default=None, foreign_key="location.id", nullable=True)

class Values(ValuesBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # AI Fields
    sentiment: Optional[str] = None
    ai_analysis: Optional[str] = None
    
    # Relationships
    form: "Form" = Relationship(back_populates="responses")

class ValuesCreate(ValuesBase):
    pass

class ValuesRead(ValuesBase):
    id: int
    created_at: datetime
