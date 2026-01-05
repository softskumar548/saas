from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, JSON, Relationship
from datetime import datetime

class LetterheadAssetBase(SQLModel):
    tenant_id: int = Field(foreign_key="tenant.id")
    original_file_url: str
    extracted_metadata: Dict[str, Any] = Field(default={}, sa_type=JSON)
    analysis_status: str = Field(default="pending")

class LetterheadAsset(LetterheadAssetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    # tenant: "Tenant" = Relationship(back_populates="letterhead_assets")

class LetterheadAssetCreate(LetterheadAssetBase):
    pass

class LetterheadAssetRead(LetterheadAssetBase):
    id: int
    created_at: datetime
