import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..common import get_gecko_or_404
from ..constants import DEFAULT_USER_ID
from ..database import get_db
from ..deletion import mark_deleted

router = APIRouter(tags=["egg-logs"])


def _get_log_or_404(db: Session, log_id: uuid.UUID) -> models.EggLog:
    log = (
        db.query(models.EggLog)
        .join(models.Gecko, models.EggLog.gecko_id == models.Gecko.id)
        .filter(
            models.EggLog.id == log_id,
            models.EggLog.is_deleted.is_(False),
            models.Gecko.user_id == DEFAULT_USER_ID,
            models.Gecko.is_deleted.is_(False),
        )
        .first()
    )
    if log is None:
        raise HTTPException(status_code=404, detail="下蛋紀錄不存在")
    return log


@router.get("/geckos/{gecko_id}/egg-logs", response_model=list[schemas.EggLogRead])
def list_egg_logs(gecko_id: uuid.UUID, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    return (
        db.query(models.EggLog)
        .filter(models.EggLog.gecko_id == gecko_id, models.EggLog.is_deleted.is_(False))
        .order_by(models.EggLog.date.desc())
        .all()
    )


@router.post("/geckos/{gecko_id}/egg-logs", response_model=schemas.EggLogRead, status_code=201)
def create_egg_log(gecko_id: uuid.UUID, payload: schemas.EggLogCreate, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    log = models.EggLog(gecko_id=gecko_id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/egg-logs/{log_id}", response_model=schemas.EggLogRead)
def get_egg_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_log_or_404(db, log_id)


@router.patch("/egg-logs/{log_id}", response_model=schemas.EggLogRead)
def update_egg_log(log_id: uuid.UUID, payload: schemas.EggLogUpdate, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/egg-logs/{log_id}", status_code=204)
def delete_egg_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    mark_deleted(log)
    db.commit()
