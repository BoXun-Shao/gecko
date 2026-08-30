import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..common import get_gecko_or_404
from ..constants import DEFAULT_USER_ID
from ..database import get_db
from ..deletion import soft_delete_gecko

router = APIRouter(prefix="/geckos", tags=["geckos"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "geckos"


@router.get("", response_model=list[schemas.GeckoRead])
def list_geckos(db: Session = Depends(get_db)):
    return (
        db.query(models.Gecko)
        .filter(models.Gecko.user_id == DEFAULT_USER_ID, models.Gecko.is_deleted.is_(False))
        .order_by(models.Gecko.created_at)
        .all()
    )


@router.post("", response_model=schemas.GeckoRead, status_code=201)
def create_gecko(payload: schemas.GeckoCreate, db: Session = Depends(get_db)):
    gecko = models.Gecko(user_id=DEFAULT_USER_ID, **payload.model_dump())
    db.add(gecko)
    db.commit()
    db.refresh(gecko)
    return gecko


@router.get("/{gecko_id}", response_model=schemas.GeckoRead)
def get_gecko(gecko_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_gecko_or_404(db, gecko_id)


@router.patch("/{gecko_id}", response_model=schemas.GeckoRead)
def update_gecko(gecko_id: uuid.UUID, payload: schemas.GeckoUpdate, db: Session = Depends(get_db)):
    gecko = get_gecko_or_404(db, gecko_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(gecko, field, value)
    db.commit()
    db.refresh(gecko)
    return gecko


@router.delete("/{gecko_id}", status_code=204)
def delete_gecko(gecko_id: uuid.UUID, db: Session = Depends(get_db)):
    gecko = get_gecko_or_404(db, gecko_id)
    soft_delete_gecko(db, gecko)
    db.commit()


@router.post("/{gecko_id}/photo", response_model=schemas.GeckoRead)
def upload_gecko_photo(gecko_id: uuid.UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    gecko = get_gecko_or_404(db, gecko_id)
    ext = Path(file.filename or "").suffix.lstrip(".").lower() or "jpg"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    for old_file in UPLOADS_DIR.glob(f"{gecko.id}.*"):
        old_file.unlink()
    file_path = UPLOADS_DIR / f"{gecko.id}.{ext}"
    with file_path.open("wb") as f:
        f.write(file.file.read())
    gecko.photo_path = f"/uploads/geckos/{gecko.id}.{ext}"
    db.commit()
    db.refresh(gecko)
    return gecko
