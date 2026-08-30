import uuid
from datetime import date, datetime, timezone
from datetime import date as _Date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

GenderLiteral = Literal["male", "female", "unknown"]
FeedingStatusLiteral = Literal["fed", "partial", "refused", "skipped"]
EnvironmentSourceLiteral = Literal["manual", "sensor"]


# ---- Gecko ----


class GeckoCreate(BaseModel):
    name: str
    morph: Optional[str] = None
    gender: GenderLiteral = "unknown"
    birth_date: Optional[date] = None
    acquired_date: Optional[date] = None
    feeding_interval_days: int = 7
    note: Optional[str] = None
    safe_temp_min: Optional[float] = None
    safe_temp_max: Optional[float] = None
    safe_humidity_min: Optional[float] = None
    safe_humidity_max: Optional[float] = None


class GeckoUpdate(BaseModel):
    name: Optional[str] = None
    morph: Optional[str] = None
    gender: Optional[GenderLiteral] = None
    birth_date: Optional[date] = None
    acquired_date: Optional[date] = None
    feeding_interval_days: Optional[int] = None
    note: Optional[str] = None
    safe_temp_min: Optional[float] = None
    safe_temp_max: Optional[float] = None
    safe_humidity_min: Optional[float] = None
    safe_humidity_max: Optional[float] = None


class GeckoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    morph: Optional[str]
    gender: GenderLiteral
    birth_date: Optional[date]
    acquired_date: Optional[date]
    photo_path: Optional[str]
    feeding_interval_days: int
    note: Optional[str]
    safe_temp_min: Optional[float]
    safe_temp_max: Optional[float]
    safe_humidity_min: Optional[float]
    safe_humidity_max: Optional[float]
    created_at: datetime
    updated_at: datetime


# ---- DailyLog（進食＋排便＋體重） ----


class DailyLogCreate(BaseModel):
    date: date
    status: FeedingStatusLiteral
    qty: Optional[int] = None
    food: Optional[str] = None
    food_size: Optional[str] = None
    poop: bool = False
    weight: Optional[float] = None
    note: Optional[str] = None


class DailyLogUpdate(BaseModel):
    # _Date（非 date）：欄位名稱與型別名稱相同時，pydantic 解析 forward ref 會把 `date`
    # 解析成這個欄位自己的預設值 None，型別退化成 NoneType，導致 PATCH 這個欄位必壞。
    date: Optional[_Date] = None
    status: Optional[FeedingStatusLiteral] = None
    qty: Optional[int] = None
    food: Optional[str] = None
    food_size: Optional[str] = None
    poop: Optional[bool] = None
    weight: Optional[float] = None
    note: Optional[str] = None


class DailyLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gecko_id: uuid.UUID
    date: date
    status: FeedingStatusLiteral
    qty: Optional[int]
    food: Optional[str]
    food_size: Optional[str]
    poop: bool
    weight: Optional[float]
    note: Optional[str]
    created_at: datetime
    updated_at: datetime


# ---- SheddingLog / SheddingPhoto ----


class SheddingLogCreate(BaseModel):
    date: date
    note: Optional[str] = None


class SheddingLogUpdate(BaseModel):
    date: Optional[_Date] = None  # 同 DailyLogUpdate.date，避免欄位名稱與型別名稱衝突
    note: Optional[str] = None


class SheddingPhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_path: str
    created_at: datetime


class SheddingLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gecko_id: uuid.UUID
    date: date
    note: Optional[str]
    photos: list[SheddingPhotoRead]
    created_at: datetime
    updated_at: datetime


# ---- EnvironmentLog ----


class EnvironmentLogCreate(BaseModel):
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    temperature: float
    humidity: float
    source: EnvironmentSourceLiteral = "manual"


class EnvironmentLogUpdate(BaseModel):
    recorded_at: Optional[datetime] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    source: Optional[EnvironmentSourceLiteral] = None


class EnvironmentLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gecko_id: uuid.UUID
    recorded_at: datetime
    temperature: float
    humidity: float
    source: EnvironmentSourceLiteral
    created_at: datetime
    updated_at: datetime


# ---- EggLog ----


class EggLogCreate(BaseModel):
    date: date
    egg_count: int
    note: Optional[str] = None


class EggLogUpdate(BaseModel):
    date: Optional[_Date] = None  # 同 DailyLogUpdate.date，避免欄位名稱與型別名稱衝突
    egg_count: Optional[int] = None
    note: Optional[str] = None


class EggLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gecko_id: uuid.UUID
    date: date
    egg_count: int
    note: Optional[str]
    created_at: datetime
    updated_at: datetime
