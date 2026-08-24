"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-24

依 docs/requirements/2026-08-24-資料庫schema定案.md 建立初始 7 張表。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

gender_enum = sa.Enum("male", "female", "unknown", name="gender_enum")
feeding_status_enum = sa.Enum("fed", "partial", "refused", "skipped", name="feeding_status_enum")
environment_source_enum = sa.Enum("manual", "sensor", name="environment_source_enum")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "geckos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("morph", sa.String(), nullable=True),
        sa.Column("gender", gender_enum, nullable=False, server_default="unknown"),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("acquired_date", sa.Date(), nullable=True),
        sa.Column("photo_path", sa.Text(), nullable=True),
        sa.Column("feeding_interval_days", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("safe_temp_min", sa.Numeric(), nullable=True),
        sa.Column("safe_temp_max", sa.Numeric(), nullable=True),
        sa.Column("safe_humidity_min", sa.Numeric(), nullable=True),
        sa.Column("safe_humidity_max", sa.Numeric(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "daily_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("gecko_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("geckos.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", feeding_status_enum, nullable=False),
        sa.Column("qty", sa.Integer(), nullable=True),
        sa.Column("food", sa.String(), nullable=True),
        sa.Column("food_size", sa.String(), nullable=True),
        sa.Column("poop", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("weight", sa.Numeric(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("gecko_id", "date", name="uq_daily_logs_gecko_date"),
    )

    op.create_table(
        "shedding_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("gecko_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("geckos.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "shedding_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "shedding_log_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("shedding_logs.id"), nullable=False
        ),
        sa.Column("file_path", sa.Text(), nullable=False),
    )

    op.create_table(
        "environment_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("gecko_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("geckos.id"), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("temperature", sa.Numeric(), nullable=False),
        sa.Column("humidity", sa.Numeric(), nullable=False),
        sa.Column("source", environment_source_enum, nullable=False, server_default="manual"),
    )

    op.create_table(
        "egg_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("gecko_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("geckos.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("egg_count", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("egg_logs")
    op.drop_table("environment_logs")
    op.drop_table("shedding_photos")
    op.drop_table("shedding_logs")
    op.drop_table("daily_logs")
    op.drop_table("geckos")
    op.drop_table("users")
    environment_source_enum.drop(op.get_bind(), checkfirst=True)
    feeding_status_enum.drop(op.get_bind(), checkfirst=True)
    gender_enum.drop(op.get_bind(), checkfirst=True)
