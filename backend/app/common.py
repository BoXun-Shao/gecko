import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import models
from .constants import DEFAULT_USER_ID


def get_gecko_or_404(db: Session, gecko_id: uuid.UUID) -> models.Gecko:
    gecko = (
        db.query(models.Gecko)
        .filter(
            models.Gecko.id == gecko_id,
            models.Gecko.user_id == DEFAULT_USER_ID,
            models.Gecko.is_deleted.is_(False),
        )
        .first()
    )
    if gecko is None:
        raise HTTPException(status_code=404, detail="守宮不存在")
    return gecko
