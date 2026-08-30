import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..common import get_gecko_or_404
from ..constants import DEFAULT_USER_ID
from ..database import get_db
from ..deletion import mark_deleted

router = APIRouter(tags=["daily-logs"])


def _get_log_or_404(db: Session, log_id: uuid.UUID) -> models.DailyLog:
    log = (
        db.query(models.DailyLog)
        .join(models.Gecko, models.DailyLog.gecko_id == models.Gecko.id)
        .filter(
            models.DailyLog.id == log_id,
            models.DailyLog.is_deleted.is_(False),
            models.Gecko.user_id == DEFAULT_USER_ID,
            models.Gecko.is_deleted.is_(False),
        )
        .first()
    )
    if log is None:
        raise HTTPException(status_code=404, detail="紀錄不存在")
    return log


@router.get("/geckos/{gecko_id}/daily-logs", response_model=list[schemas.DailyLogRead])
def list_daily_logs(gecko_id: uuid.UUID, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    return (
        db.query(models.DailyLog)
        .filter(models.DailyLog.gecko_id == gecko_id, models.DailyLog.is_deleted.is_(False))
        .order_by(models.DailyLog.date.desc())
        .all()
    )


@router.post("/geckos/{gecko_id}/daily-logs", response_model=schemas.DailyLogRead, status_code=201)
def create_daily_log(gecko_id: uuid.UUID, payload: schemas.DailyLogCreate, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    log = models.DailyLog(gecko_id=gecko_id, **payload.model_dump())
    db.add(log)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="這隻守宮在這個日期已經有紀錄")
    db.refresh(log)
    return log


@router.get("/daily-logs/{log_id}", response_model=schemas.DailyLogRead)
def get_daily_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_log_or_404(db, log_id)


@router.patch("/daily-logs/{log_id}", response_model=schemas.DailyLogRead)
def update_daily_log(log_id: uuid.UUID, payload: schemas.DailyLogUpdate, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="這隻守宮在這個日期已經有紀錄")
    db.refresh(log)
    return log


@router.delete("/daily-logs/{log_id}", status_code=204)
def delete_daily_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    mark_deleted(log)
    db.commit()
