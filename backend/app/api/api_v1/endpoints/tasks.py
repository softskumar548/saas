from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.api import deps
from app.models.task import FleeterTask, TaskCreate, TaskRead, TaskUpdate, TaskWithContext, TaskStatus
from app.models.user import User
from app.models.lead import Lead
from app.models.tenant import Tenant
from app.core.audit import audit_service

router = APIRouter()

@router.get("/", response_model=List[TaskWithContext])
def list_tasks(
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
    status: Optional[TaskStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List tasks assigned to the current fleeter.
    """
    query = select(FleeterTask).where(FleeterTask.assigned_to_id == current_user.id)
    if status:
        query = query.where(FleeterTask.status == status)
    
    tasks = db.exec(query.offset(skip).limit(limit)).all()
    
    results = []
    for t in tasks:
        data = t.dict()
        if t.lead_id:
            lead = db.get(Lead, t.lead_id)
            if lead:
                data["lead_name"] = lead.business_name
        if t.tenant_id:
            tenant = db.get(Tenant, t.tenant_id)
            if tenant:
                data["tenant_name"] = tenant.name
        results.append(data)
        
    return results

@router.post("/", response_model=TaskRead)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Create a new task.
    """
    task = FleeterTask.from_orm(task_in)
    task.assigned_to_id = current_user.id
    db.add(task)
    db.commit()
    db.refresh(task)
    
    audit_service.log_action(
        db=db, 
        user=current_user, 
        action="create_task", 
        target_type="task", 
        target_id=task.id
    )
    return task

@router.patch("/{id}", response_model=TaskRead)
def update_task(
    id: int,
    task_in: TaskUpdate,
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Update a task.
    """
    task = db.get(FleeterTask, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.assigned_to_id != current_user.id and current_user.role != "super_admin":
         raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    update_data = task_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    task.updated_at = datetime.utcnow()
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task

@router.delete("/{id}")
def delete_task(
    id: int,
    db: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_fleeter),
) -> Any:
    """
    Delete a task.
    """
    task = db.get(FleeterTask, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.assigned_to_id != current_user.id and current_user.role != "super_admin":
         raise HTTPException(status_code=403, detail="Not authorized to delete this task")
         
    db.delete(task)
    db.commit()
    return {"status": "success"}
