# Backend

FastAPI + PostgreSQL + SQLAlchemy + Alembic。schema 定義見 [docs/requirements/2026-08-24-資料庫schema定案.md](../docs/requirements/2026-08-24-資料庫schema定案.md)。

## 本機開發設置

前置需求：Docker Desktop（跑 PostgreSQL）、Python 3.12+。

```bash
# 1. 啟動 Postgres（在 repo 根目錄）
docker compose up -d

# 2. 建立虛擬環境並安裝套件（在 backend/ 目錄）
python -m venv .venv
.venv/Scripts/activate      # Windows
pip install -r requirements.txt

# 3. 設定環境變數
cp .env.example .env        # 預設值已對應 docker-compose.yml 裡的帳密

# 4. 執行 migration，建立資料表
alembic upgrade head

# 5. Seed 固定的預設 user（本階段未實作登入 UI）
python -m app.seed

# 6. 啟動 API
uvicorn app.main:app --reload
```

啟動後可到 http://localhost:8000/docs 看自動產生的 API 文件，http://localhost:8000/health 確認服務存活。

## 現況

目前只有資料庫骨架（7 張表）與一個 `/health` 健康檢查端點，尚未實作實際的 CRUD API。下一步依 [TODO.md](../TODO.md) Epic「資料庫化與商用架構」的 Phase 1 → 2 順序進行。
