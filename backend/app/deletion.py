"""軟刪除 cascade 邏輯，見 docs/requirements/2026-08-30-軟刪除cascade決策與API開發啟動.md。

一律透過設定 `is_deleted`/`deleted_at` 屬性（而非從 relationship collection 移除物件），
確保會進入 `app/audit.py` 的 `session.dirty` 稽核紀錄，且不觸發該檔案文件中提到的
delete-orphan 稽核缺口。
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from . import models


def mark_deleted(obj) -> None:
    if obj.is_deleted:
        return
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)


def soft_delete_shedding_log(db: Session, shedding_log: models.SheddingLog) -> None:
    photos = (
        db.query(models.SheddingPhoto)
        .filter(
            models.SheddingPhoto.shedding_log_id == shedding_log.id,
            models.SheddingPhoto.is_deleted.is_(False),
        )
        .all()
    )
    for photo in photos:
        mark_deleted(photo)
    mark_deleted(shedding_log)


def soft_delete_gecko(db: Session, gecko: models.Gecko) -> None:
    daily_logs = (
        db.query(models.DailyLog)
        .filter(models.DailyLog.gecko_id == gecko.id, models.DailyLog.is_deleted.is_(False))
        .all()
    )
    for log in daily_logs:
        mark_deleted(log)

    shedding_logs = (
        db.query(models.SheddingLog)
        .filter(models.SheddingLog.gecko_id == gecko.id, models.SheddingLog.is_deleted.is_(False))
        .all()
    )
    for shedding_log in shedding_logs:
        soft_delete_shedding_log(db, shedding_log)

    environment_logs = (
        db.query(models.EnvironmentLog)
        .filter(models.EnvironmentLog.gecko_id == gecko.id, models.EnvironmentLog.is_deleted.is_(False))
        .all()
    )
    for log in environment_logs:
        mark_deleted(log)

    egg_logs = (
        db.query(models.EggLog)
        .filter(models.EggLog.gecko_id == gecko.id, models.EggLog.is_deleted.is_(False))
        .all()
    )
    for log in egg_logs:
        mark_deleted(log)

    mark_deleted(gecko)
