# TODO

待辦事項清單，取代 README 中的詳細 Roadmap 勾選清單。分類：Bug / Feature / Chore。完成後打勾並在對應 commit 中同步更新。優先序：P0（高）→ P2（低）。

## Epic：資料庫化與商用架構

需求書：[docs/requirements/2026-08-23-資料庫化與商用架構規劃.md](docs/requirements/2026-08-23-資料庫化與商用架構規劃.md)

取代原本「接 Supabase」的規劃，改為自建 FastAPI + PostgreSQL + React。以下依需求書建議分期，完成後淘汰舊版 `index.html`：

- [x] P0 後端專案骨架：FastAPI + PostgreSQL 連線、user/gecko/log 資料表 migration、seed 預設 user
      性別欄位（公/母/未知）與下蛋紀錄（日期＋蛋數＋備註）已一併納入 schema，見 [docs/requirements/2026-08-24-性別與下蛋紀錄.md](docs/requirements/2026-08-24-性別與下蛋紀錄.md)
      已於本機驗證：`docker compose up -d` 啟動 Postgres → `alembic upgrade head` 建立全部 7 張表 → `python -m app.seed` 寫入預設 user → `uvicorn` 啟動後 `/health` 回應正常
- [ ] P0 API endpoints：涵蓋現有功能 + 下方「紀錄功能重新規劃」所有欄位（進食 status、蛻皮、溫濕度、下蛋）
- [ ] P0 前端重寫：React 專案，呼叫新 API，取代 localStorage 操作邏輯
- [ ] P1 照片改存後端伺服器本地檔案系統，資料表僅存路徑
- [x] P1 一次性資料遷移工具：讀現有 Excel 匯出檔 → 寫入 PostgreSQL
      需求書：[docs/requirements/2026-08-25-excel資料遷移.md](docs/requirements/2026-08-25-excel資料遷移.md)
      用法：於 `backend/` 目錄執行 `python -m scripts.migrate_excel <xlsx 路徑>`，可重複執行（upsert）
- [ ] P1 Excel 匯出/匯入功能於新架構下重新實作，轉型為備份/匯出用途
- [ ] P1 功能對等驗證後，淘汰/移除舊版 `index.html`
- [ ] P2 同步更新 [CLAUDE.md](CLAUDE.md)「專案性質」章節與品質關卡（新增後端 API 測試）

## Feature：紀錄功能重新規劃

需求書：[docs/requirements/2026-08-23-紀錄功能重新規劃.md](docs/requirements/2026-08-23-紀錄功能重新規劃.md)

以下欄位定義以此需求書為準，實作目標依上方 Epic 改為新的 FastAPI + PostgreSQL 架構（不再是 localStorage/Excel schema）：

- [ ] P1 新增蛻皮紀錄（日期／備註／多張照片，綁定守宮）
- [ ] P1 新增環境溫濕度紀錄（每隻守宮各自登記溫度+濕度，可設安全範圍並顯示警示）
- [ ] P1 性別欄位擴充為公/母/未知三選一
      需求書：[docs/requirements/2026-08-24-性別與下蛋紀錄.md](docs/requirements/2026-08-24-性別與下蛋紀錄.md)
- [ ] P1 新增下蛋紀錄（日期＋蛋數＋備註，綁定守宮，不追蹤受精/孵化）
      需求書：同上
- [ ] P2 除蟲/驅蟲用藥紀錄（已於 2026-08-23 訪談中明確排除，之後如需要另開需求訪談）
- [ ] P2 繁殖管理（受精狀態、孵化追蹤、配對/血系）——目前無繁殖計畫，明確排除，之後如需要另開需求訪談

## Chore

- [ ] P1 進食狀態改為單一 `status` 列舉（fed / partial / refused / skipped）
      需求書：[docs/requirements/2026-08-23-紀錄功能重新規劃.md](docs/requirements/2026-08-23-紀錄功能重新規劃.md)
      遷移規則（舊 localStorage 資料 → 新 status，經由上方一次性資料遷移工具帶入 PostgreSQL）見需求書
- [x] P0 全部業務資料表補齊 `created_at`/`updated_at`/`is_deleted`/`deleted_at`，新增 `audit_logs` 全域稽核紀錄機制（ORM event listener，只記變動欄位）
      需求書：[docs/requirements/2026-08-24-審計軟刪除機制.md](docs/requirements/2026-08-24-審計軟刪除機制.md)
      `users.email`、`daily_logs(gecko_id, date)` 的 UNIQUE 限制改為 partial index（`WHERE is_deleted = false`）
- [ ] P1 CRUD delete API 開發時，決定父表軟刪除時子表（如 `geckos` → `daily_logs`/`shedding_logs` 等）要不要一併 cascade 軟刪除；目前 ORM 仍是 `cascade="all, delete-orphan"`（硬刪除子表），與軟刪除語意不一致，需另開需求訪談
      需求書：[docs/requirements/2026-08-24-審計軟刪除機制.md](docs/requirements/2026-08-24-審計軟刪除機制.md)（已知限制章節）

## Bug

（目前無已知 bug）
