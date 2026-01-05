# Import all models here so SQLModel/Alembic can discover them
from app.models.user import User
from app.models.tenant import Tenant
from app.models.plan import SubscriptionPlan
from app.models.form import Form, Values
from app.models.location import Location
from app.models.letterhead import LetterheadAsset
from app.models.audit import AuditLog
from app.models.feature import FeatureFlag
from app.models.setting import SystemSetting
from app.models.lead import Lead
from app.models.onboarding import Onboarding
from app.models.task import FleeterTask

# This file is imported by Alembic's env.py
