"""測試共用設定。

用獨立的 Postgres database（gecko_test，跟開發用的 gecko 資料庫在同一個
docker-compose db 容器內）而不是 SQLite，因為 schema 用到 Postgres 專屬的
partial unique index（見 models.py 的 uq_users_email_active／
uq_daily_logs_gecko_date_active），SQLite 測不出這些真實行為（例如 409 衝突）。

每個測試前清空所有表並重建預設 user，確保測試互不干擾、不用管執行順序。
"""
import psycopg2
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.constants import DEFAULT_USER_EMAIL, DEFAULT_USER_ID
from app.database import Base, get_db
from app.main import app
from app.models import User

TEST_DB_NAME = "gecko_test"
ADMIN_DATABASE_URL = "postgresql://gecko:gecko@localhost:5432/postgres"
TEST_DATABASE_URL = f"postgresql+psycopg2://gecko:gecko@localhost:5432/{TEST_DB_NAME}"


def _ensure_test_database_exists() -> None:
    conn = psycopg2.connect(ADMIN_DATABASE_URL)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,))
            if cur.fetchone() is None:
                cur.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        conn.close()


_ensure_test_database_exists()

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _clean_database():
    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.add(User(id=DEFAULT_USER_ID, email=DEFAULT_USER_EMAIL, password_hash="test"))
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    """測試需要直接查資料庫斷言（例如 audit_logs）時使用。"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def gecko(client):
    """建立一隻預設守宮，回傳 API 回應的 JSON（含 id）。"""
    res = client.post("/geckos", json={"name": "測試守宮"})
    assert res.status_code == 201
    return res.json()
