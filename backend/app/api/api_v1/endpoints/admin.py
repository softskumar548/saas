from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlmodel import Session, select, func, update

from app.api import deps
from app.models.tenant import Tenant, TenantCreate, TenantRead, TenantWithAdmin, TenantUsage
from app.models.user import User, UserCreate, UserRole
from app.models.form import Form, Values
from app.models.location import Location
from app.models.plan import SubscriptionPlan, SubscriptionPlanCreate
from app.models.feature import FeatureFlag, FeatureFlagCreate
from app.models.audit import AuditLog
from app.models.setting import SystemSetting, SystemSettingCreate
from app.core.audit import audit_service
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr, field_validator
import secrets
import string
from sqlalchemy.exc import IntegrityError


router = APIRouter()

@router.get("/overview", response_model=Dict[str, Any])
def get_admin_stats(
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get platform-wide statistics for Super Admin dashboard.
    """
    
    # Tenant Metrics
    total_tenants = db.exec(select(func.count(Tenant.id))).one()
    active_tenants = db.exec(select(func.count(Tenant.id)).where(Tenant.is_active == True)).one()
    
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_tenants_7d = db.exec(select(func.count(Tenant.id)).where(Tenant.created_at >= seven_days_ago)).one()
    
    # Feedback Metrics
    total_feedback = db.exec(select(func.count(Values.id))).one()
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    feedback_today = db.exec(select(func.count(Values.id)).where(Values.created_at >= today_start)).one()
    
    # Subscription Breakdown
    # Get distinct plan names and their tenant counts
    # This roughly replicates: SELECT plan.name, COUNT(tenant.id) FROM tenant JOIN plan ON ... GROUP BY plan.name
    
    # SQLModel doesn't support easy GROUP BY with relations in one go sometimes, so we can iterate plans or use raw SQL.
    # For MVP scale, querying plans + counting is fine.
    plans = db.exec(select(SubscriptionPlan)).all()
    plan_stats = []
    for plan in plans:
        count = db.exec(select(func.count(Tenant.id)).where(Tenant.plan_id == plan.id)).one()
        plan_stats.append({"name": plan.name, "count": count})

    # Error Rate (Mock Analysis)
    # real system would query logs or separate "ErrorLog" table
    error_rate = 0.05 # 0.05%
    
    return {
        "tenants": {
            "total": total_tenants,
            "active": active_tenants,
            "new_7d": new_tenants_7d
        },
        "feedback": {
            "total": total_feedback,
            "today": feedback_today
        },
        "subscriptions": plan_stats,
        "system_health": {
            "error_rate_24h": error_rate,
            "status": "healthy"
        }
    }

@router.get("/tenants", response_model=List[TenantWithAdmin])
def list_tenants(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    List tenants with optional search.
    """
    query = select(Tenant)
    if search:
        query = query.where(Tenant.name.contains(search) | Tenant.slug.contains(search))
    tenants = db.exec(query.offset(skip).limit(limit)).all()
    
    results = []
    for t in tenants:
        admin = db.exec(select(User).where(User.tenant_id == t.id).where(User.role == UserRole.TENANT_ADMIN)).first()
        
        # Calculate usage summary
        forms_count = db.exec(select(func.count(Form.id)).where(Form.tenant_id == t.id)).one()
        locations_count = db.exec(select(func.count(Location.id)).where(Location.tenant_id == t.id)).one()
        submissions_count = db.exec(select(func.count(Values.id)).join(Form).where(Form.tenant_id == t.id)).one()

        data = TenantWithAdmin.from_orm(t)
        data.admin_email = admin.email if admin else None
        data.usage = TenantUsage(
            forms_count=forms_count,
            locations_count=locations_count,
            submissions_count=submissions_count
        )
        results.append(data)
    return results

class TenantCreateRequest(TenantCreate):
    admin_email: EmailStr
    admin_full_name: str
    admin_designation: Optional[str] = None
    admin_mobile: Optional[str] = None

    # Password Logic
    admin_password: Optional[str] = None
    should_auto_generate_password: bool = False

    @field_validator('admin_mobile')
    def validate_mobile_number(cls, v):
        if v:
            import re
            # Check if starts with +91 and follows with 10 digits
            if not re.match(r'^\+91\d{10}$', v):
                raise ValueError('Mobile number must start with +91 followed by 10 digits')
        return v

@router.post("/tenants", response_model=Tenant)
def create_tenant_admin(
    tenant_in: TenantCreateRequest,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create a new tenant (Super Admin Manual Onboard).
    """
    print(f"DEBUG: create_tenant_admin called. Email={tenant_in.admin_email}", flush=True)

    # 1. Handle Password Logic
    final_password = tenant_in.admin_password
    if tenant_in.should_auto_generate_password or not final_password:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        final_password = ''.join(secrets.choice(alphabet) for i in range(12))
        
    if not final_password:
         raise HTTPException(status_code=400, detail="Password is required if auto-generation is disabled.")

    try:
        # 2. Create Tenant
        # Extract only TenantCreate fields. exclude user/password fields
        # TenantCreate fields: name, slug, address, billing_address, brand_color, plan_id, etc.
        tenant_data = tenant_in.dict(exclude={"admin_email", "admin_full_name", "admin_designation", "admin_mobile", "admin_password", "should_auto_generate_password"})
        tenant = Tenant(**tenant_data)
        db.add(tenant)
        db.flush() 
        print(f"DEBUG: Tenant flushed. ID={tenant.id}", flush=True) 
        
        # 3. Create Admin User
        print(f"DEBUG: Creating user {tenant_in.admin_email} for tenant {tenant.id}", flush=True)
        user = User(
            email=tenant_in.admin_email,
            hashed_password=get_password_hash(final_password),
            full_name=tenant_in.admin_full_name,
            designation=tenant_in.admin_designation,
            mobile_number=tenant_in.admin_mobile,
            role=UserRole.TENANT_ADMIN,
            tenant_id=tenant.id,
            is_active=True
        )
        db.add(user)
        print("DEBUG: User added to session", flush=True)
        
        db.commit()
        db.refresh(tenant)
    except IntegrityError as e:
        db.rollback()
        err_msg = str(e.orig).lower()
        if "unique constraint failed" in err_msg:
            if "slug" in err_msg:
                raise HTTPException(status_code=400, detail="Tenant URL slug already exists. Please choose a different one.")
            if "email" in err_msg:
                raise HTTPException(status_code=400, detail="User email already registered. Please use a different email.")
        raise HTTPException(status_code=400, detail=f"Database Integrity Error: {e.orig}")
    
    audit_service.log_action(db=db, user=current_user, action="create_tenant", target_type="tenant", target_id=tenant.id, details=tenant.dict())

    # 4. Mock Email Service (Log to Console)
    print("----------------------------------------------------------------")
    print(f"📧 [MOCK EMAIL SERVICE] Sending Credentials to {tenant_in.admin_email}")
    print(f"Subject: Welcome to {tenant.name} - Your Admin Credentials")
    print(f"Dear {tenant_in.admin_full_name},")
    print(f"Your account has been created.")
    print(f"Organization: {tenant.name}")
    print(f"Username: {tenant_in.admin_email}")
    print(f"Password: {final_password}")
    print("----------------------------------------------------------------")

    return tenant

@router.get("/tenants/{tenant_id}", response_model=TenantWithAdmin)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    admin = db.exec(select(User).where(User.tenant_id == tenant.id).where(User.role == UserRole.TENANT_ADMIN)).first()
    
    # Calculate usage summary
    forms_count = db.exec(select(func.count(Form.id)).where(Form.tenant_id == tenant.id)).one()
    locations_count = db.exec(select(func.count(Location.id)).where(Location.tenant_id == tenant.id)).one()
    submissions_count = db.exec(select(func.count(Values.id)).join(Form).where(Form.tenant_id == tenant.id)).one()

    data = TenantWithAdmin.from_orm(tenant)
    data.admin_email = admin.email if admin else None
    data.usage = TenantUsage(
        forms_count=forms_count,
        locations_count=locations_count,
        submissions_count=submissions_count
    )
    return data

@router.post("/tenants/{tenant_id}/suspend", response_model=Tenant)
def suspend_tenant(
    tenant_id: int,
    suspend: bool, # True to suspend, False to activate
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.is_active = not suspend
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    action = "suspend_tenant" if suspend else "activate_tenant"
    audit_service.log_action(db=db, user=current_user, action=action, target_type="tenant", target_id=tenant.id)
    return tenant

@router.patch("/tenants/{tenant_id}/status", response_model=Tenant)
def update_tenant_status(
    tenant_id: int,
    is_active: bool = Body(..., embed=True),
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.is_active = is_active
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    action = "activate_tenant" if is_active else "suspend_tenant"
    audit_service.log_action(db=db, user=current_user, action=action, target_type="tenant", target_id=tenant.id)
    return tenant

# User Management

@router.get("/users", response_model=List[User])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    List all platform users with optional role filter.
    """
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(User.email.contains(search) | User.full_name.contains(search))
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/users", response_model=User)
def create_fleeter_user(
    user_in: UserCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create a new Fleeter (Sales) user.
    """
    # Enforce Fleeter role for now via this endpoint
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.FLEETER,
        is_active=True
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    audit_service.log_action(db=db, user=current_user, action="create_fleeter", target_type="user", target_id=user.id)
    return user

@router.delete("/users/{user_id}", response_model=Dict[str, str])
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db.delete(user)
        db.commit()
    except Exception:
        # User might have related data, handle gracefully or raise specific error
        raise HTTPException(status_code=400, detail="Cannot delete user with related data")
        
    audit_service.log_action(db=db, user=current_user, action="delete_user", target_type="user", target_id=user_id)
    return {"status": "success"}

class PasswordReset(BaseModel):
    password: str

@router.post("/users/{user_id}/password_reset", response_model=User)
def reset_password_action(
    user_id: int,
    body: PasswordReset,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(body.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    audit_service.log_action(db=db, user=current_user, action="reset_password", target_type="user", target_id=user.id)
    return user

@router.post("/users/{user_id}/status", response_model=User)
def toggle_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    
    audit_service.log_action(db=db, user=current_user, action="toggle_status", target_type="user", target_id=user.id, details={"status": is_active})
    return user

# Subscription Plans

@router.get("/plans", response_model=List[SubscriptionPlan])
def list_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    return db.exec(select(SubscriptionPlan).offset(skip).limit(limit)).all()

@router.post("/plans", response_model=SubscriptionPlan)
def create_plan(
    plan_in: SubscriptionPlanCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    plan = SubscriptionPlan.from_orm(plan_in)
    
    if plan.is_default:
        # Unset other defaults
        db.exec(update(SubscriptionPlan).values(is_default=False))
        
    db.add(plan)
    db.commit()
    db.refresh(plan)
    audit_service.log_action(db=db, user=current_user, action="create_plan", target_type="plan", target_id=plan.id)
    return plan

@router.put("/plans/{plan_id}", response_model=SubscriptionPlan)
def update_plan(
    plan_id: int,
    plan_in: SubscriptionPlanCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    plan = db.get(SubscriptionPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    plan_data = plan_in.dict(exclude_unset=True)
    for key, value in plan_data.items():
        setattr(plan, key, value)
        
    if plan.is_default:
        # Unset other defaults if this one is becoming default
        plans = db.exec(select(SubscriptionPlan)).all()
        for p in plans:
            if p.id != plan.id:
                p.is_default = False
                db.add(p)

    db.add(plan)
    db.commit()
    db.refresh(plan)
    audit_service.log_action(db=db, user=current_user, action="update_plan", target_type="plan", target_id=plan.id)
    return plan

@router.post("/plans/{plan_id}/status", response_model=SubscriptionPlan)
def toggle_plan_status(
    plan_id: int,
    is_active: bool,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    plan = db.get(SubscriptionPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    plan.is_active = is_active
    db.add(plan)
    db.commit()
    db.refresh(plan)
    audit_service.log_action(db=db, user=current_user, action="toggle_plan_status", target_type="plan", target_id=plan.id)
    return plan

@router.post("/plans/{plan_id}/default", response_model=SubscriptionPlan)
def set_default_plan(
    plan_id: int,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    plan = db.get(SubscriptionPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # Unset others
    plans = db.exec(select(SubscriptionPlan)).all()
    for p in plans:
        p.is_default = False
        db.add(p)
        
    plan.is_default = True
    db.add(plan)
    db.commit()
    db.refresh(plan)
    plan.is_default = True
    db.add(plan)
    db.commit()
    db.refresh(plan)
    audit_service.log_action(db=db, user=current_user, action="set_default_plan", target_type="plan", target_id=plan.id)
    return plan

# Metrics

class DailyMetric(BaseModel):
    date: str
    count: int

class TenantMetric(BaseModel):
    tenant_name: str
    count: int

class UsageMetrics(BaseModel):
    daily_submissions: List[DailyMetric]
    top_tenants: List[TenantMetric]
    requests_per_minute: int
    rate_limit_triggers: int

@router.get("/metrics", response_model=UsageMetrics)
def get_usage_metrics(
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    # 1. Daily Submissions (Last 30 Days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # SQLite specific date truncation
    date_col = func.strftime('%Y-%m-%d', Values.created_at)
    
    results = db.exec(
        select(date_col, func.count(Values.id))
        .where(Values.created_at >= thirty_days_ago)
        .group_by(date_col)
        .order_by(date_col)
    ).all()
    
    daily_data = [DailyMetric(date=r[0], count=r[1]) for r in results]
    
    # Fill in missing dates? For simplicity, frontend can handle gaps or we just return what we have.
    
    # 2. Top Tenants by Volume
    top_tenants_res = db.exec(
        select(Tenant.name, func.count(Values.id))
        .join(Form, Form.tenant_id == Tenant.id)
        .join(Values, Values.form_id == Form.id)
        .group_by(Tenant.id)
        .order_by(func.count(Values.id).desc())
        .limit(5)
    ).all()
    
    top_tenants_data = [TenantMetric(tenant_name=r[0], count=r[1]) for r in top_tenants_res]
    
    return UsageMetrics(
        daily_submissions=daily_data,
        top_tenants=top_tenants_data,
        requests_per_minute=42, # Mock
        rate_limit_triggers=0 # Mock
    )

# System Health

class SystemLog(BaseModel):
    id: int
    timestamp: datetime
    level: str
    message: str
    source: str

class SystemHealth(BaseModel):
    status: str
    db_connected: bool
    api_uptime_seconds: float
    active_workers: int
    error_rate_24h: float
    recent_logs: List[SystemLog]

@router.get("/metrics/health", response_model=SystemHealth)
def get_system_health(
    request: Request,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    # 1. DB Check
    db_connected = False
    try:
        db.exec(select(1)).first()
        db_connected = True
    except Exception:
        pass
        
    # 2. Uptime
    uptime = 0.0
    if hasattr(request.app.state, "start_time"):
        uptime = (datetime.utcnow() - request.app.state.start_time).total_seconds()
        
    # 3. Mock Logs
    mock_logs = [
        SystemLog(id=1, timestamp=datetime.utcnow(), level="INFO", message="Backup completed successfully", source="System"),
        SystemLog(id=2, timestamp=datetime.utcnow() - timedelta(minutes=5), level="WARNING", message="High memory usage detected on worker 2", source="Worker"),
        SystemLog(id=3, timestamp=datetime.utcnow() - timedelta(minutes=15), level="INFO", message="Cron job 'sync_metrics' started", source="Scheduler"),
        SystemLog(id=4, timestamp=datetime.utcnow() - timedelta(minutes=20), level="ERROR", message="Failed to send email notifiation: Timeout", source="EmailService"),
        SystemLog(id=5, timestamp=datetime.utcnow() - timedelta(hours=1), level="INFO", message="User 'admin@saas.com' logged in", source="Auth")
    ]
    
    return SystemHealth(
        status="healthy" if db_connected else "degraded",
        db_connected=db_connected,
        api_uptime_seconds=uptime,
        active_workers=4,
        error_rate_24h=0.02,
        recent_logs=mock_logs
    )

# Feature Flags

@router.get("/features", response_model=List[FeatureFlag])
def list_features(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    return db.exec(select(FeatureFlag).offset(skip).limit(limit)).all()

@router.post("/features", response_model=FeatureFlag)
def create_feature(
    feature_in: FeatureFlagCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    feature = FeatureFlag.from_orm(feature_in)
    db.add(feature)
    db.commit()
    db.refresh(feature)
    audit_service.log_action(db=db, user=current_user, action="create_feature", target_type="feature", target_id=feature.id)
    return feature

@router.put("/features/{feature_id}", response_model=FeatureFlag)
def update_feature(
    feature_id: int,
    feature_in: FeatureFlagCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    feature = db.get(FeatureFlag, feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    feature_data = feature_in.dict(exclude_unset=True)
    for key, value in feature_data.items():
        setattr(feature, key, value)
        
    db.add(feature)
    db.commit()
    db.refresh(feature)
    audit_service.log_action(db=db, user=current_user, action="update_feature", target_type="feature", target_id=feature.id)
    return feature

@router.post("/features/{feature_id}/toggle", response_model=FeatureFlag)
def toggle_feature_status(
    feature_id: int,
    is_enabled: bool,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    feature = db.get(FeatureFlag, feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    feature.is_enabled = is_enabled
    db.add(feature)
    db.commit()
    db.refresh(feature)
    audit_service.log_action(db=db, user=current_user, action="toggle_feature", target_type="feature", target_id=feature.id, details={"status": is_enabled})
    return feature

# Audit Logs

@router.get("/audit-logs", response_model=List[AuditLog])
def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if target_type:
        query = query.where(AuditLog.target_type == target_type)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        
    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    return db.exec(query).all()

# Settings

@router.get("/settings", response_model=List[SystemSetting])
def list_settings(
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    return db.exec(select(SystemSetting)).all()

@router.put("/settings/{key}", response_model=SystemSetting)
def update_setting(
    key: str,
    setting_in: SystemSettingCreate,
    db: Session = Depends(deps.get_session),
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    setting = db.get(SystemSetting, key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
        
    setting.value = setting_in.value
    setting.updated_at = datetime.utcnow()
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    
    audit_service.log_action(db=db, user=current_user, action="update_setting", target_type="setting", target_id=key, details=setting.value)
    return setting
