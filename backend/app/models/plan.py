from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class SubscriptionPlanBase(SQLModel):
    name: str = Field(unique=True)
    price_monthly: float
    billing_cycle: str = Field(default="monthly") # monthly, yearly
    description: Optional[str] = None
    
    # Limits
    max_forms: int
    max_responses_per_month: int
    max_locations: int = Field(default=1)
    max_team_members: int = Field(default=1)
    
    # Status
    is_active: bool = Field(default=True)
    is_default: bool = Field(default=False)

class SubscriptionPlan(SubscriptionPlanBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanRead(SubscriptionPlanBase):
    id: int
