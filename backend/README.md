# Backend

FastAPI + PostgreSQL + SQLAlchemy + Alembic。schema 定義見 [docs/requirements/2026-08-24-資料庫schema定案.md](../docs/requirements/2026-08-24-資料庫schema定案.md)（原始決策紀錄）與 [docs/database/schema.md](../docs/database/schema.md)（自動產生的最新 schema + ER 圖）。

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

## 更新 schema 文件

每次修改 `app/models.py` 並執行 `alembic upgrade head` 後，重新產生 schema 文件（`docs/database/schema.md`，含資料表定義與 Mermaid ER 圖）：

```bash
python -m scripts.generate_schema_doc
```

## 匯入舊版 Excel 資料

把 `index.html` 匯出的 Excel 檔匯入資料庫（可重複執行，會 upsert 不會產生重複資料）：

```bash
python -m scripts.migrate_excel "路徑/肥尾日誌_2026-08-24.xlsx"
```

細節與決策見 [docs/requirements/2026-08-25-excel資料遷移.md](../docs/requirements/2026-08-25-excel資料遷移.md)。

## 測試

測試規範見根目錄 [TESTING.md](../TESTING.md)。安裝測試相依套件、跑測試：

```bash
pip install -r requirements-dev.txt
pytest
```

測試會自動在同一個 Postgres 容器內建立/使用獨立的 `gecko_test` 資料庫（不影響開發用的 `gecko` 資料庫），每個測試前自動清空資料表並重建預設 user，測試之間互不干擾。

## API

CRUD REST API 已實作，涵蓋守宮基本資料與四種紀錄類型，全部掛在 seed 的固定預設 user 底下（本階段未實作登入）：

- `geckos`：CRUD + `POST /geckos/{id}/photo`（上傳大頭照）
- `geckos/{gecko_id}/daily-logs`、`daily-logs/{id}`：進食（`status`：`fed`/`partial`/`refused`/`skipped`）／排便／體重
- `geckos/{gecko_id}/shedding-logs`、`shedding-logs/{id}`：蛻皮紀錄 + `POST /shedding-logs/{id}/photos`（可上傳多張照片）
- `geckos/{gecko_id}/environment-logs`、`environment-logs/{id}`：環境溫濕度
- `geckos/{gecko_id}/egg-logs`、`egg-logs/{id}`：下蛋紀錄

所有 DELETE 皆為軟刪除（`is_deleted`/`deleted_at`）；刪除 `geckos` 會 cascade 軟刪除其底下所有紀錄，決策見 [docs/requirements/2026-08-30-軟刪除cascade決策與API開發啟動.md](../docs/requirements/2026-08-30-軟刪除cascade決策與API開發啟動.md)。照片存在 `backend/uploads/`，由 `/uploads` 靜態路徑提供。

啟動後可到 http://localhost:8000/docs 看完整、可互動的 API 文件（含所有 endpoint 與欄位定義）。

## 現況

資料庫骨架（7 張表）與 CRUD API 已完成。下一步依 [TODO.md](../TODO.md) Epic「資料庫化與商用架構」進行 React 前端重寫。
