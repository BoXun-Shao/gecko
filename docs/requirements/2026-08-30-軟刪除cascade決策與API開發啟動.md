# 需求書：軟刪除 cascade 決策 + API 開發啟動

- **訪談日期**：2026-08-30
- **範圍/主題**：解決 [2026-08-24-審計軟刪除機制.md](2026-08-24-審計軟刪除機制.md) 遺留的已知限制（父表軟刪除時子表 cascade 行為未定），並啟動 [2026-08-23-資料庫化與商用架構規劃.md](2026-08-23-資料庫化與商用架構規劃.md) 分期第 2 階段：API endpoints 開發。

## 背景

TODO.md 的 Chore 區塊明確標記：「CRUD delete API 開發時，決定父表軟刪除時子表（如 `geckos` → `daily_logs`/`shedding_logs` 等）要不要一併 cascade 軟刪除；目前 ORM 仍是 `cascade="all, delete-orphan"`（硬刪除子表），與軟刪除語意不一致，需另開需求訪談」。現在要開始開發 API（含 DELETE endpoints），此決策點必須先確認。

## 決策

| 項目 | 決策 |
|---|---|
| `gecko` 被軟刪除時，其底下的 `daily_logs`／`shedding_logs`／`shedding_photos`／`environment_logs`／`egg_logs` 如何處理 | **連帶軟刪除**：`gecko.is_deleted = true` 時，所有關聯子紀錄的 `is_deleted` 一併設為 `true`、`deleted_at` 一併設定 |
| 理由 | 查詢時父子狀態保持一致，符合「刪除守宮＝隱藏牠的飼育史」的直覺；避免出現「守宮已刪除但紀錄仍可查到」的不一致狀態 |
| 還原（若未來有 restore 功能） | 本次不實作 restore 功能，僅先確立 cascade 軟刪除規則；若未來要支援「復原守宮」，還原子紀錄的規則留待該次需求訪談再定 |
| 技術影響 | ORM 目前 `cascade="all, delete-orphan"` 是硬刪除語意，與軟刪除政策衝突，需要在 API 層（而非 ORM relationship cascade）實作軟刪除 cascade 邏輯，不能依賴 SQLAlchemy 預設 cascade 行為 |

## 本次同步啟動：API endpoints 開發

依 [2026-08-23-資料庫化與商用架構規劃.md](2026-08-23-資料庫化與商用架構規劃.md) 建議分期第 2 項，開發涵蓋以下資源的 REST API（FastAPI + Pydantic），欄位定義以既有需求書與 [backend/app/models.py](../../backend/app/models.py) 為準，不重新發明欄位：

- `geckos`：CRUD（含性別 男/女/未知、安全溫濕度範圍欄位）
- `daily_logs`：CRUD（進食 status 列舉、排便、體重）
- `shedding_logs` + `shedding_photos`：CRUD + 照片上傳（存後端本地檔案系統，DB 存路徑）
- `environment_logs`：CRUD（溫度、濕度、source）
- `egg_logs`：CRUD（日期、蛋數、備註）

**身份識別**：延續架構規劃決策，所有 API 呼叫對應到 seed 的固定預設 user，本次不實作登入驗證。

**軟刪除**：DELETE endpoint 一律為軟刪除（`is_deleted=true` + `deleted_at`），不做實體刪除；`geckos` 的 DELETE 依上方決策 cascade 至子表。GET/LIST endpoints 預設排除 `is_deleted=true` 的紀錄。

## 產出

- 本文件為軟刪除 cascade 規則的 source of truth，解除 [2026-08-24-審計軟刪除機制.md](2026-08-24-審計軟刪除機制.md) 的已知限制
- 待更新：[TODO.md](../../TODO.md)（勾掉/更新對應項目）
