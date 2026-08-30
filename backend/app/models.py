import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

GenderEnum = Enum("male", "female", "unknown", name="gender_enum")
FeedingStatusEnum = Enum("fed", "partial", "refused", "skipped", name="feeding_status_enum")
EnvironmentSourceEnum = Enum("manual", "sensor", name="environment_source_enum")
AuditActionEnum = Enum("insert", "update", "delete", name="audit_action_enum")


def _uuid_pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    """所有業務資料表共用：建立/更新時間 + 軟刪除欄位。

    `audit_logs` 本身是附加式（append-only）的稽核紀錄表，不套用本 mixin：
    它不會被軟刪除，也不需要對「稽核紀錄本身的異動」再產生稽核紀錄（避免遞迴）。
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index("uq_users_email_active", "email", unique=True, postgresql_where=text("is_deleted = false")),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    geckos: Mapped[list["Gecko"]] = relationship(back_populates="user")


class Gecko(Base, TimestampMixin):
    __tablename__ = "geckos"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    morph: Mapped[str | None] = mapped_column(String, nullable=True)
    gender: Mapped[str] = mapped_column(GenderEnum, nullable=False, default="unknown")
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    acquired_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    photo_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    feeding_interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    safe_temp_min: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    safe_temp_max: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    safe_humidity_min: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    safe_humidity_max: Mapped[float | None] = mapped_column(Numeric, nullable=True)

    # 新增下面任何一個 relationship 時，記得同步更新 app/deletion.py 的
    # soft_delete_gecko：軟刪除 cascade 是手動實作（見該檔案文件字串），
    # 不會自動套用到新的 relationship。
    user: Mapped[User] = relationship(back_populates="geckos")
    daily_logs: Mapped[list["DailyLog"]] = relationship(back_populates="gecko", cascade="all, delete-orphan")
    shedding_logs: Mapped[list["SheddingLog"]] = relationship(back_populates="gecko", cascade="all, delete-orphan")
    environment_logs: Mapped[list["EnvironmentLog"]] = relationship(
        back_populates="gecko", cascade="all, delete-orphan"
    )
    egg_logs: Mapped[list["EggLog"]] = relationship(back_populates="gecko", cascade="all, delete-orphan")


class DailyLog(Base, TimestampMixin):
    """進食＋排便＋體重，維持現有「一天一筆」組合方式，不拆表。"""

    __tablename__ = "daily_logs"
    __table_args__ = (
        Index(
            "uq_daily_logs_gecko_date_active",
            "gecko_id",
            "date",
            unique=True,
            postgresql_where=text("is_deleted = false"),
        ),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(FeedingStatusEnum, nullable=False)
    qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    food: Mapped[str | None] = mapped_column(String, nullable=True)
    food_size: Mapped[str | None] = mapped_column(String, nullable=True)
    poop: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    weight: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    gecko: Mapped[Gecko] = relationship(back_populates="daily_logs")


class SheddingLog(Base, TimestampMixin):
    __tablename__ = "shedding_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    gecko: Mapped[Gecko] = relationship(back_populates="shedding_logs")
    photos: Mapped[list["SheddingPhoto"]] = relationship(back_populates="shedding_log", cascade="all, delete-orphan")


class SheddingPhoto(Base, TimestampMixin):
    __tablename__ = "shedding_photos"

    id: Mapped[uuid.UUID] = _uuid_pk()
    shedding_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shedding_logs.id"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(Text, nullable=False)

    shedding_log: Mapped[SheddingLog] = relationship(back_populates="photos")


class EnvironmentLog(Base, TimestampMixin):
    __tablename__ = "environment_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    temperature: Mapped[float] = mapped_column(Numeric, nullable=False)
    humidity: Mapped[float] = mapped_column(Numeric, nullable=False)
    source: Mapped[str] = mapped_column(EnvironmentSourceEnum, nullable=False, default="manual")

    gecko: Mapped[Gecko] = relationship(back_populates="environment_logs")


class EggLog(Base, TimestampMixin):
    __tablename__ = "egg_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    egg_count: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    gecko: Mapped[Gecko] = relationship(back_populates="egg_logs")


class AuditLog(Base):
    """所有業務資料表（見 TimestampMixin 的表）新增/修改/刪除時的稽核紀錄。

    由 `app/audit.py` 的 SQLAlchemy `before_flush` event listener 自動寫入，
    不需（也不應）手動建立。`diff` 只記錄異動欄位：
    - insert：每個欄位 {"old": null, "new": 新值}
    - update：只包含真的變動的欄位 {"old": 舊值, "new": 新值}
    - delete（硬刪除，例如 cascade delete-orphan）：每個欄位 {"old": 舊值, "new": null}
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    table_name: Mapped[str] = mapped_column(String, nullable=False)
    record_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(AuditActionEnum, nullable=False)
    diff: Mapped[dict] = mapped_column(JSONB, nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
