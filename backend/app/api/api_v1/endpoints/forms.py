from typing import Any, Optional, Dict, List
from datetime import datetime
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, SQLModel
from app.db.session import get_session
from app.api import deps
from app.models.form import Form, FormCreate, FormUpdate, FormRead, Values, ValuesCreate, FormBase
from app.models.tenant import Tenant
from app.models.user import User
from sqlalchemy import func
from app.models.plan import SubscriptionPlan
from app.core.limiter import limiter

router = APIRouter()

# --- Tenant Admin Endpoints ---

@router.get("/", response_model=List[FormRead])
def read_forms(
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve forms for the current tenant.
    """
    if not current_user.tenant_id:
        return []
    
    statement = select(Form).where(Form.tenant_id == current_user.tenant_id).offset(skip).limit(limit)
    return db.exec(statement).all()

@router.post("/", response_model=FormRead)
def create_form(
    form_in: FormCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Create a new form.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with a tenant")

    # Enforce Plan Limits
    tenant = db.get(Tenant, current_user.tenant_id)
    if tenant and tenant.plan_id:
        plan = db.get(SubscriptionPlan, tenant.plan_id)
        if plan:
            count = db.exec(select(func.count(Form.id)).where(Form.tenant_id == tenant.id)).one()
            if count >= plan.max_forms:
                raise HTTPException(status_code=402, detail="Plan limit reached. Upgrade to create more forms.")

    # Check for duplicate slug globally or per tenant? 
    # Slug is unique=True in model, so globally unique.
    existing_slug = db.exec(select(Form).where(Form.slug == form_in.slug)).first()
    if existing_slug:
        raise HTTPException(status_code=400, detail="Slug already exists")

    form_data = form_in.dict()
    form_data["tenant_id"] = current_user.tenant_id
    
    # Auto-set as default if this is the first form for the tenant
    existing_default = db.exec(
        select(Form).where(Form.tenant_id == current_user.tenant_id, Form.is_default == True)
    ).first()
    
    if not existing_default:
        form_data["is_default"] = True
    
    form = Form(**form_data)
    
    db.add(form)
    db.commit()
    db.refresh(form)
    return form

@router.get("/{id}", response_model=FormRead)
def read_form(
    id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_user),
) -> Any:
    """
    Get a specific form by ID.
    """
    form = db.get(Form, id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return form

@router.put("/{id}", response_model=FormRead)
def update_form(
    id: int,
    form_in: FormUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Update a form.
    """
    form = db.get(Form, id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    form_data = form_in.dict(exclude_unset=True)
    for key, value in form_data.items():
        setattr(form, key, value)

    db.add(form)
    db.commit()
    db.refresh(form)
    return form

@router.post("/{id}/set_default", response_model=FormRead)
def set_default_form(
    id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_admin),
) -> Any:
    """
    Set a form as the default for the tenant.
    Unsets any existing default.
    """
    form = db.get(Form, id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 1. Unset existing default(s)
    statement = select(Form).where(Form.tenant_id == current_user.tenant_id, Form.is_default == True)
    existing_defaults = db.exec(statement).all()
    for f in existing_defaults:
        f.is_default = False
        db.add(f)
        
    # 2. Set new default
    form.is_default = True
    db.add(form)
    
    db.commit()
    db.refresh(form)
    return form

# --- Analytics Endpoint ---

from app.core.ai import ai_service

# ... (omitted)

class FeedbackStat(SQLModel):
    total_responses: int
    field_summaries: Dict[str, Any] = {}
    recent_responses: List[Any]
    ai_summary: Optional[str] = None

@router.get("/{id}/stats", response_model=FeedbackStat)
def get_form_stats(
    id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_user),
    location_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Any:
    """
    Get statistics for a form with optional filters.
    """
    form = db.get(Form, id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # query
    query = select(Values).where(Values.form_id == id)
    
    if location_id:
        query = query.where(Values.location_id == location_id)
    if start_date:
        query = query.where(Values.created_at >= start_date)
    if end_date:
        query = query.where(Values.created_at <= end_date)
        
    responses = db.exec(query).all()
    total = len(responses)
    
    # Calculate Field Summaries (Avg Rating)
    field_stats = {}
    if form.form_schema and "fields" in form.form_schema:
        for field in form.form_schema["fields"]:
            if field.get("type") == "rating":
                fid = field.get("id")
                # Extract values
                values = [r.data.get(fid) for r in responses if r.data.get(fid) is not None]
                # Convert to ints
                valid_values = []
                for v in values:
                    try: 
                        valid_values.append(int(v))
                    except: 
                        pass
                
                if valid_values:
                    avg = sum(valid_values) / len(valid_values)
                else:
                    avg = 0
                
                field_stats[fid] = {
                    "label": field.get("label"),
                    "type": "rating",
                    "average": round(avg, 2),
                    "count": len(valid_values)
                }

    # Recent list
    recent = []
    text_corpus = []
    for r in responses[-50:]:
        recent.append({
            "id": r.id,
            "created_at": r.created_at,
            "data": r.data,
            "location_id": r.location_id,
            "sentiment": r.sentiment # Include sentiment in recent list
        })
        # Extract text for summary
        if r.data:
            for v in r.data.values():
                if isinstance(v, str):
                    text_corpus.append(v)
    
    summary = ai_service.generate_summary(text_corpus)
        
    return FeedbackStat(
        total_responses=total,
        field_summaries=field_stats,
        recent_responses=reversed(recent), # Show newest first
        ai_summary=summary
    )


# --- Public Endpoints ---

class TenantBranding(SQLModel):
    name: str
    tagline: Optional[str] = None
    logo_url: Optional[str] = None
    logo_position: str = "top-left"
    primary_color: Optional[str] = "#4F46E5"
    secondary_color: Optional[str] = "#374151"
    accent_color: Optional[str] = "#F3F4F6"
    font_family: Optional[str] = "Inter"
    address: Optional[str] = None
    is_branding_approved: bool = False

class PublicFormRead(FormBase):
    id: int
    tenant: TenantBranding

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks

# ...

def send_alert_email(form_id: int, sentiment: str, feedback_id: int):
    # Mock Email Sending (Simulate latency)
    import time
    time.sleep(1) 
    print(f"BACKGROUND TASK: Sending alert email for Feedback {feedback_id} (Form {form_id}). Sentiment: {sentiment}")

# ... (inside submit_feedback)

@router.post("/public/feedback")
@limiter.limit("10/minute")
def submit_feedback(
    request: Request,
    feedback: ValuesCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
) -> Any:
    # ... (existing form check) ...
    # Verify form exists
    form = db.get(Form, feedback.form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    # Enforce Plan Limits (Monthly Responses)
    # Ensure tenant/plan loaded
    tenant = db.get(Tenant, form.tenant_id)
    if tenant and tenant.plan_id:
        plan = db.get(SubscriptionPlan, tenant.plan_id)
        if plan:
            now = datetime.utcnow()
            month_start = datetime(now.year, now.month, 1)
            
            # Count responses for this tenant this month
            # Join Values -> Form to filter by Tenant
            count = db.exec(
                select(func.count(Values.id))
                .join(Form)
                .where(Form.tenant_id == tenant.id)
                .where(Values.created_at >= month_start)
            ).one()
            
            if count >= plan.max_responses_per_month:
                 raise HTTPException(status_code=402, detail="Form quota exceeded for this month.")

    db_obj = Values.from_orm(feedback)
    
    # AI Sentiment Analysis
    text_content = ""
    if feedback.data:
        for v in feedback.data.values():
            if isinstance(v, str):
                text_content += v + " "
    
    sentiment = ai_service.analyze_sentiment(text_content.strip())
    db_obj.sentiment = sentiment
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Negative Feedback Alert (Background Task)
    if sentiment == "negative":
        background_tasks.add_task(send_alert_email, form.id, sentiment, db_obj.id)
        
    return {"status": "success", "id": db_obj.id, "sentiment": sentiment}

@router.get("/{id}/export", response_class=StreamingResponse)
def export_feedback_csv(
    id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_tenant_user),
    location_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Any:
    """
    Export feedback to CSV.
    """
    form = db.get(Form, id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Query logic shared (ideally refactor, but copy-paste for speed now)
    query = select(Values).where(Values.form_id == id)
    if location_id:
        query = query.where(Values.location_id == location_id)
    if start_date:
        query = query.where(Values.created_at >= start_date)
    if end_date:
        query = query.where(Values.created_at <= end_date)
    
    responses = db.exec(query).all()
    
    # Determine CSV Headers
    # Static: ID, Date, Location
    # Dynamic: Field Labels or IDs
    
    field_map = {} # id -> label
    field_order = []
    if form.form_schema and "fields" in form.form_schema:
        for f in form.form_schema["fields"]:
            fid = f.get("id")
            label = f.get("label", fid)
            field_map[fid] = label
            field_order.append(fid)
            
    header = ["ID", "Created At", "Location ID"] + [field_map[fid] for fid in field_order]
    
    # Create CSV Stream
    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write BOM for Excel compatibility
        output.write('\ufeff') 
        
        writer.writerow(header)
        output.seek(0)
        yield output.read()
        output.truncate(0)
        output.seek(0)
        
        for r in responses:
            row = [
                str(r.id),
                r.created_at.isoformat(),
                str(r.location_id or "")
            ]
            # Dynamic Data
            for fid in field_order:
                val = r.data.get(fid, "")
                row.append(str(val))
            
            writer.writerow(row)
            output.seek(0)
            yield output.read()
            output.truncate(0)
            output.seek(0)
            
    filename = f"export_{form.slug}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
@router.get("/public/{slug}", response_model=PublicFormRead)
@limiter.limit("5/minute")
def get_public_form(
    request: Request,
    slug: str,
    db: Session = Depends(get_session),
) -> Any:
    """
    Get a specific form by slug (Public Access) with Tenant Branding.
    """
    form = db.exec(select(Form).where(Form.slug == slug)).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.is_published:
         raise HTTPException(status_code=404, detail="Form not active")
         
    # Ensure tenant is loaded
    _ = form.tenant
    
    return form


