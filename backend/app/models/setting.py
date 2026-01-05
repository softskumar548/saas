from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field
from sqlmodel import JSON
from datetime import datetime

class SystemSettingBase(SQLModel):
    key: str = Field(primary_key=True)
    value: Dict[str, Any] = Field(default={}, sa_type=JSON) 
    description: Optional[str] = None

class SystemSetting(SystemSettingBase, table=True):
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingRead(SystemSettingBase):
    updated_at: datetime
