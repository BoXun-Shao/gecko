import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

GenderEnum = Enum("male", "female", "unknown", name="gender_enum")
FeedingStatusEnum = Enum("fed", "partial", "refused", "skipped", name="feeding_status_enum")
EnvironmentSourceEnum = Enum("manual", "sensor", name="environment_source_enum")


def _uuid_pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    geckos: Mapped[list["Gecko"]] = relationship(back_populates="user")


class Gecko(Base):
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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="geckos")
    daily_logs: Mapped[list["DailyLog"]] = relationship(back_populates="gecko", cascade="all, delete-orphan")
    shedding_logs: Mapped[list["SheddingLog"]] = relationship(back_populates="gecko", cascade="all, delete-orphan")
    environment_logs: Mapped[list["EnvironmentLog"]] = relationship(
        back_populates="gecko", cascade="all, delete-orphan"
    )
    egg_logs: Mapped[list["EggLog"]] = relationship(back_populates="gecko", cascade="all, delete-orphan")


class DailyLog(Base):
    """進食＋排便＋體重，維持現有「一天一筆」組合方式，不拆表。"""

    __tablename__ = "daily_logs"
    __table_args__ = (UniqueConstraint("gecko_id", "date", name="uq_daily_logs_gecko_date"),)

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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    gecko: Mapped[Gecko] = relationship(back_populates="daily_logs")


class SheddingLog(Base):
    __tablename__ = "shedding_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    gecko: Mapped[Gecko] = relationship(back_populates="shedding_logs")
    photos: Mapped[list["SheddingPhoto"]] = relationship(back_populates="shedding_log", cascade="all, delete-orphan")


class SheddingPhoto(Base):
    __tablename__ = "shedding_photos"

    id: Mapped[uuid.UUID] = _uuid_pk()
    shedding_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shedding_logs.id"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(Text, nullable=False)

    shedding_log: Mapped[SheddingLog] = relationship(back_populates="photos")


class EnvironmentLog(Base):
    __tablename__ = "environment_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    temperature: Mapped[float] = mapped_column(Numeric, nullable=False)
    humidity: Mapped[float] = mapped_column(Numeric, nullable=False)
    source: Mapped[str] = mapped_column(EnvironmentSourceEnum, nullable=False, default="manual")

    gecko: Mapped[Gecko] = relationship(back_populates="environment_logs")


class EggLog(Base):
    __tablename__ = "egg_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    gecko_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("geckos.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    egg_count: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    gecko: Mapped[Gecko] = relationship(back_populates="egg_logs")
