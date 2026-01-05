from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api import deps
from app.models.user import User, UserRead, UserUpdate
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.patch("/me", response_model=UserRead)
def update_user_me(
    *,
    db: Session = Depends(deps.get_session),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own profile.
    """
    user_data = user_in.dict(exclude_unset=True)
    for field, value in user_data.items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/password")
def update_password_me(
    *,
    db: Session = Depends(deps.get_session),
    old_password: str,
    new_password: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own password.
    """
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.hashed_password = get_password_hash(new_password)
    db.add(current_user)
    db.commit()
    return {"status": "success", "message": "Password updated successfully"}
