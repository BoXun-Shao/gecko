import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..common import get_gecko_or_404
from ..constants import DEFAULT_USER_ID
from ..database import get_db
from ..deletion import mark_deleted, soft_delete_shedding_log

router = APIRouter(tags=["shedding-logs"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "shedding_photos"


def _get_log_or_404(db: Session, log_id: uuid.UUID) -> models.SheddingLog:
    log = (
        db.query(models.SheddingLog)
        .join(models.Gecko, models.SheddingLog.gecko_id == models.Gecko.id)
        .filter(
            models.SheddingLog.id == log_id,
            models.SheddingLog.is_deleted.is_(False),
            models.Gecko.user_id == DEFAULT_USER_ID,
            models.Gecko.is_deleted.is_(False),
        )
        .first()
    )
    if log is None:
        raise HTTPException(status_code=404, detail="蛻皮紀錄不存在")
    return log


def _get_photo_or_404(db: Session, photo_id: uuid.UUID) -> models.SheddingPhoto:
    photo = (
        db.query(models.SheddingPhoto)
        .join(models.SheddingLog, models.SheddingPhoto.shedding_log_id == models.SheddingLog.id)
        .join(models.Gecko, models.SheddingLog.gecko_id == models.Gecko.id)
        .filter(
            models.SheddingPhoto.id == photo_id,
            models.SheddingPhoto.is_deleted.is_(False),
            models.Gecko.user_id == DEFAULT_USER_ID,
            models.Gecko.is_deleted.is_(False),
        )
        .first()
    )
    if photo is None:
        raise HTTPException(status_code=404, detail="照片不存在")
    return photo


@router.get("/geckos/{gecko_id}/shedding-logs", response_model=list[schemas.SheddingLogRead])
def list_shedding_logs(gecko_id: uuid.UUID, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    return (
        db.query(models.SheddingLog)
        .filter(models.SheddingLog.gecko_id == gecko_id, models.SheddingLog.is_deleted.is_(False))
        .order_by(models.SheddingLog.date.desc())
        .all()
    )


@router.post("/geckos/{gecko_id}/shedding-logs", response_model=schemas.SheddingLogRead, status_code=201)
def create_shedding_log(gecko_id: uuid.UUID, payload: schemas.SheddingLogCreate, db: Session = Depends(get_db)):
    get_gecko_or_404(db, gecko_id)
    log = models.SheddingLog(gecko_id=gecko_id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/shedding-logs/{log_id}", response_model=schemas.SheddingLogRead)
def get_shedding_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_log_or_404(db, log_id)


@router.patch("/shedding-logs/{log_id}", response_model=schemas.SheddingLogRead)
def update_shedding_log(log_id: uuid.UUID, payload: schemas.SheddingLogUpdate, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/shedding-logs/{log_id}", status_code=204)
def delete_shedding_log(log_id: uuid.UUID, db: Session = Depends(get_db)):
    log = _get_log_or_404(db, log_id)
    soft_delete_shedding_log(db, log)
    db.commit()


@router.post("/shedding-logs/{log_id}/photos", response_model=list[schemas.SheddingPhotoRead], status_code=201)
def upload_shedding_photos(
    log_id: uuid.UUID, files: list[UploadFile] = File(...), db: Session = Depends(get_db)
):
    log = _get_log_or_404(db, log_id)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    photos = []
    for file in files:
        ext = Path(file.filename or "").suffix.lstrip(".").lower() or "jpg"
        photo_id = uuid.uuid4()
        file_path = UPLOADS_DIR / f"{photo_id}.{ext}"
        with file_path.open("wb") as f:
            f.write(file.file.read())
        photo = models.SheddingPhoto(
            id=photo_id,
            shedding_log_id=log.id,
            file_path=f"/uploads/shedding_photos/{photo_id}.{ext}",
        )
        db.add(photo)
        photos.append(photo)
    db.commit()
    for photo in photos:
        db.refresh(photo)
    return photos


@router.delete("/shedding-photos/{photo_id}", status_code=204)
def delete_shedding_photo(photo_id: uuid.UUID, db: Session = Depends(get_db)):
    photo = _get_photo_or_404(db, photo_id)
    mark_deleted(photo)
    db.commit()
