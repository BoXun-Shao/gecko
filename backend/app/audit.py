"""自動稽核紀錄：透過 SQLAlchemy `before_flush` event，攔截 session 中所有
新增／修改／（硬）刪除的資料列，把差異寫入 `audit_logs` 表。

只要程式透過本專案的 `SessionLocal`／`Session` 寫入資料庫，就會自動記錄，
不需要在每個 CRUD 呼叫點手動補一行。`audit_logs` 表本身不被追蹤（見
`app/models.py` 的 `AuditLog` docstring），避免遞迴。

掛載方式：`app/__init__.py` 匯入本模組以觸發 `@event.listens_for` 註冊，
因此任何 `import app...` 都會啟用稽核紀錄。

已知限制：`before_flush` 在 SQLAlchemy 判斷 `cascade="all, delete-orphan"`
孤兒物件之前就已觸發，所以「把子物件從關聯集合移除（例如
`gecko.daily_logs.remove(log)`）」造成的刪除，目前不會進到這裡的
`session.deleted` 裡、也就不會有稽核紀錄。`app/deletion.py` 的 delete API 刻意避開了
這個缺口：一律用屬性賦值（設定 `is_deleted`/`deleted_at`）而不是從 collection 移除物件，
所以會落在 `session.dirty`（走 update 分支）而不是 `session.deleted`，稽核紀錄照常寫入。
若未來新增真正的硬刪除路徑，才需要重新面對這裡描述的缺口。
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session

from .models import AuditLog

_AUDITED_TABLES = {
    "users",
    "geckos",
    "daily_logs",
    "shedding_logs",
    "shedding_photos",
    "environment_logs",
    "egg_logs",
}


def _serialize(value: Any) -> Any:
    if isinstance(value, (uuid.UUID, datetime, date, Decimal)):
        return str(value)
    return value


def _apply_client_defaults(obj: Any) -> None:
    """在 before_flush 當下，把 ORM 層的純量／零參數 callable default（PK 的
    `uuid.uuid4`、`is_deleted` 的 `False` 等，見 `models._uuid_pk`／`TimestampMixin`）
    先寫回物件本身，讓 insert 的稽核紀錄能反映真正會寫入的值。專案目前的 default
    只有這兩種形式，不涵蓋 server_default（`created_at`/`updated_at` 用 DB 端
    `now()`）——這類欄位在 insert 稽核紀錄中會是 null，改看 audit_logs.changed_at
    即可（兩者時間差通常在毫秒等級）。
    """
    for column in obj.__table__.columns:
        if getattr(obj, column.name, None) is not None:
            continue
        default = column.default
        if default is None:
            continue
        if default.is_callable:
            # SQLAlchemy 會把使用者傳入的 callable default（即使是 0 參數，如
            # uuid.uuid4）包一層固定吃 `ctx` 參數的 wrapper，所以呼叫時要帶一個
            # 參數；我們的 default 用不到 ExecutionContext，帶 None 即可。
            setattr(obj, column.name, default.arg(None))
        elif default.is_scalar:
            setattr(obj, column.name, default.arg)


def _build_entry(obj: Any, action: str) -> AuditLog | None:
    table = obj.__table__
    if table.name not in _AUDITED_TABLES:
        return None

    diff: dict[str, dict[str, Any]] = {}

    if action == "update":
        state = inspect(obj)
        for attr in state.mapper.column_attrs:
            history = state.get_history(attr.key, True)
            if not history.has_changes():
                continue
            old = history.deleted[0] if history.deleted else None
            new = history.added[0] if history.added else None
            diff[attr.key] = {"old": _serialize(old), "new": _serialize(new)}
        if not diff:
            return None
    else:
        mapper = inspect(obj).mapper
        for attr in mapper.column_attrs:
            value = _serialize(getattr(obj, attr.key))
            diff[attr.key] = {"old": None, "new": value} if action == "insert" else {"old": value, "new": None}

    return AuditLog(table_name=table.name, record_id=obj.id, action=action, diff=diff)


@event.listens_for(Session, "before_flush")
def _record_audit_log(session: Session, flush_context, instances) -> None:
    entries: list[AuditLog] = []

    for obj in session.new:
        _apply_client_defaults(obj)
        entry = _build_entry(obj, "insert")
        if entry:
            entries.append(entry)

    for obj in session.dirty:
        if not session.is_modified(obj, include_collections=False):
            continue
        entry = _build_entry(obj, "update")
        if entry:
            entries.append(entry)

    for obj in session.deleted:
        entry = _build_entry(obj, "delete")
        if entry:
            entries.append(entry)

    for entry in entries:
        session.add(entry)
