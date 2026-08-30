import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..common import get_gecko_or_404
from ..constants import DEFAULT_USER_ID
from ..database import get_db
from ..deletion import mark_deleted

router = APIRouter(tags=["environment-logs"])


def _get_log_or_404(db: Session, log_id: uuid.UUID) -> models.EnvironmentLog:
    log = (
        db.query(models.EnvironmentLog)
        .join(models.Gecko, models.EnvironmentLog.gecko_id == models.Gecko.id)
        .filter(
            models.EnvironmentLog.id == log_id,
            models.EnvironmentLog.is_deleted.is_(False),
            models.Gecko.user_id == DEFAULT_USER_ID,
            models.Gecko.is_deleted.is_(False),
        )
        .first()
    )
    if log is None:
        raise HTTPException(status_code=404, detail="溫濕度紀錄不存在")
    return log


@router.get("/geckos/{gecko_id}/environment-logs", response_model=list[schemas.EnvironmentLogRead])
def list_environment_logs(gecko_id: uuid.UUID, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    return (
        db.query(models.EnvironmentLog)
        .filter(models.EnvironmentLog.gecko_id == gecko_id, models.EnvironmentLog.is_deleted.is_(False))
        .order_by(models.EnvironmentLog.recorded_at.desc())
        .all()
    )


@router.post("/geckos/{gecko_id}/environment-logs", response_model=schemas.EnvironmentLogRead, status_code=201)
def create_environment_log(
    gecko_id: uuid.UUID, payload: schemas.EnvironmentLogCreate, db: Session = Depends(get_db)
):
    get_gecko_or_404(db, gecko_id)
    log = models.EnvironmentLog(gecko_id=gecko_id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/environment-logs/{log_id}", response_model=schemas.EnvironmentLogRead)
def get_environment_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_log_or_404(db, log_id)


@router.patch("/environment-logs/{log_id}", response_model=schemas.EnvironmentLogRead)
def update_environment_log(
    log_id: uuid.UUID, payload: schemas.EnvironmentLogUpdate, db: Session = Depends(get_db)
):
    log = _get_log_or_404(db, log_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/environment-logs/{log_id}", status_code=204)
def delete_environment_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    mark_deleted(log)
    db.commit()
