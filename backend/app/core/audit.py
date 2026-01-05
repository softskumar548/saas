import logging
from typing import Any, Dict, Optional
from sqlmodel import Session
from fastapi.encoders import jsonable_encoder
from app.models.user import User
from app.models.audit import AuditLog

logger = logging.getLogger("audit")

class AuditService:
    def log_action(self, db: Session, user: User, action: str, target_type: str, target_id: Any, details: Optional[Dict] = None):
        """
        Log a sensitive action performed by a user to the database.
        """
        try:
            log_entry = AuditLog(
                user_id=user.id,
                user_email=user.email,
                action=action,
                target_type=target_type,
                target_id=str(target_id),
                details=jsonable_encoder(details or {})
            )
            db.add(log_entry)
            db.commit()
            logger.info(f"AUDIT_LOG: {log_entry}")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")

audit_service = AuditService()
