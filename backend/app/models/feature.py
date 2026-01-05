from typing import Optional, Dict, Any, List
from sqlmodel import SQLModel, Field
from sqlmodel import JSON
from datetime import datetime

class FeatureFlagBase(SQLModel):
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    is_enabled: bool = Field(default=False) # Global Master Switch
    rollout_percentage: int = Field(default=0) # 0-100
    filters: Dict[str, Any] = Field(default={}, sa_type=JSON) # e.g., {"tenant_ids": [1, 2]}

class FeatureFlag(FeatureFlagBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FeatureFlagCreate(FeatureFlagBase):
    pass

class FeatureFlagRead(FeatureFlagBase):
    id: int
    created_at: datetime
