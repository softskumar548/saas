from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User, UserRole, UserCreate
from app.models.tenant import Tenant
from app.models.plan import SubscriptionPlan
from app.models.form import Form
from app.models.feature import FeatureFlag
from app.models.audit import AuditLog
from app.models.setting import SystemSetting
from app.core.security import get_password_hash
from app.db import base  # noqa: F401

def init_db(session: Session):
    # Tables are created by SQLModel.metadata.create_all(engine) in main.py or prestart
    # Here we seed data
    
    # 1. Create Super Admin
    user = session.exec(select(User).where(User.email == "admin@saas.com")).first()
    if not user:
        user_in = UserCreate(
            email="admin@saas.com",
            password="adminpassword",
            full_name="Super Admin",
            role=UserRole.SUPER_ADMIN,
        )
        user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    # 2. Create Basic Plan
    plan = session.exec(select(SubscriptionPlan).where(SubscriptionPlan.name == "Free Tier")).first()
    if not plan:
        plan = SubscriptionPlan(
            name="Free Tier",
            price_monthly=0.0,
            max_forms=3,
            max_responses_per_month=100,
            max_locations=1,
            max_team_members=1,
            is_active=True,
            is_default=True,
            description="Perfect for small businesses"
        )
        session.add(plan)
        session.commit()
        session.refresh(plan)

    # 3. Create Demo Tenant
    tenant = session.exec(select(Tenant).where(Tenant.slug == "demo-hospital")).first()
    if not tenant:
        tenant = Tenant(
            name="City Hospital",
            slug="demo-hospital",
            plan_id=plan.id,
            primary_color="#0047AB"
        )
        session.add(tenant)
        session.commit()
        session.refresh(tenant)

    # 4. Create Tenant Users (Admin & Staff)
    # Tenant Admin
    tenant_admin = session.exec(select(User).where(User.email == "admin@hospital.com")).first()
    if not tenant_admin:
        tenant_admin = User(
            email="admin@hospital.com",
            hashed_password=get_password_hash("password"),
            full_name="Dr. Smith",
            role=UserRole.TENANT_ADMIN,
            tenant_id=tenant.id
        )
        session.add(tenant_admin)

    # Tenant Staff
    tenant_staff = session.exec(select(User).where(User.email == "staff@hospital.com")).first()
    if not tenant_staff:
        tenant_staff = User(
            email="staff@hospital.com",
            hashed_password=get_password_hash("password"),
            full_name="Nurse Jackie",
            role=UserRole.TENANT_STAFF,
            tenant_id=tenant.id
        )
        session.add(tenant_staff)

    # 5. Create Fleeter (Sales)
    fleeter = session.exec(select(User).where(User.email == "sales@saas.com")).first()
    if not fleeter:
        fleeter = User(
            email="sales@saas.com",
            hashed_password=get_password_hash("password"),
            full_name="Sales Rep",
            role=UserRole.FLEETER,
        )
        session.add(fleeter)

    # 6. Create Demo Form
    form = session.exec(select(Form).where(Form.slug == "er-feedback")).first()
    if not form:
        form_schema = {
            "title": "Patient Feedback",
            "fields": [
                {"id": "q1", "type": "rating", "label": "How was your waiting time?", "max": 5},
                {"id": "q2", "type": "text", "label": "Any comments?"}
            ]
        }
        
        form = Form(
            title="ER Feedback",
            slug="er-feedback",
            is_published=True,
            form_schema=form_schema,
            tenant_id=tenant.id
        )
        session.add(form)
    
    # 7. Create Feature Flags
    # AI Summaries (Disabled by default)
    flag_ai = session.exec(select(FeatureFlag).where(FeatureFlag.name == "ai_summaries")).first()
    if not flag_ai:
        flag_ai = FeatureFlag(
            name="ai_summaries",
            description="AI-powered feedback summarization",
            is_enabled=False,
            rollout_percentage=0,
            filters={"tenant_ids": []}
        )
        session.add(flag_ai)

    # New Field Types (Percentage Rollout)
    flag_fields = session.exec(select(FeatureFlag).where(FeatureFlag.name == "new_fields")).first()
    feature_new_fields = session.exec(select(FeatureFlag).where(FeatureFlag.name == "new_fields")).first()
    if not feature_new_fields:
        feature_new_fields = FeatureFlag(
            name="new_fields",
            description="Advanced form fields (Signature, File Upload)",
            is_enabled=True,
            rollout_percentage=20,
            filters={}
        )
        session.add(feature_new_fields)

    # 8. Create System Settings
    # Branding
    if not session.get(SystemSetting, "branding"):
        session.add(SystemSetting(
            key="branding",
            value={"logo_url": "", "primary_color": "#6d28d9", "platform_name": "Antigravity SaaS"},
            description="Platform visual identity"
        ))
    
    # Support
    if not session.get(SystemSetting, "support"):
        session.add(SystemSetting(
            key="support",
            value={"email": "support@antigravity.io", "phone": "+1-555-0123", "help_center_url": ""},
            description="Contact info displayed to tenants"
        ))

    # Limits
    if not session.get(SystemSetting, "limits"):
        session.add(SystemSetting(
            key="limits",
            value={"default_max_forms": 3, "default_max_responses": 100},
            description="Global default limits for new plans"
        ))

    session.commit()
