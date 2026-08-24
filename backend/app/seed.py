"""Seed 固定的預設 user（本階段不實作登入 UI，所有資料掛在這筆 user 底下）。
執行：python -m app.seed
"""

from .constants import DEFAULT_USER_EMAIL, DEFAULT_USER_ID
from .database import SessionLocal
from .models import User


def seed_default_user():
    db = SessionLocal()
    try:
        existing = db.get(User, DEFAULT_USER_ID)
        if existing:
            print(f"預設 user 已存在：{existing.email}")
            return
        user = User(
            id=DEFAULT_USER_ID,
            email=DEFAULT_USER_EMAIL,
            password_hash="unusable-no-login-implemented-yet",
        )
        db.add(user)
        db.commit()
        print(f"已建立預設 user：{DEFAULT_USER_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_default_user()
