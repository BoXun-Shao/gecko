# TESTING

本檔案定義肥尾日誌專案的測試規範。這是 [CLAUDE.md](CLAUDE.md)「完成一項變更前的品質關卡」的延伸與具體化，Claude 之後每次寫程式都要依此文件執行，不需要使用者每次重新要求。

## 總則（最優先規則）

1. **寫完或修改任何一段程式碼後，在標記完成前必須：**
   a. 執行相關的既有測試套件（unit + smoke／e2e），確保沒有破壞既有功能。
   b. 如果這段程式碼是新功能、新 API endpoint、新元件、新工具函式，或有意義的邏輯分支，**主動**補上對應的測試案例——不用等使用者開口要求。至少涵蓋一個 happy path 與已知的邊界情況（例如驗證錯誤、找不到資料、軟刪除後應被排除等）。
   c. 若某段變更確實無法測、或不值得測（見下方「例外與務實原則」），要在回報時明確說明「為什麼沒有測試」，不能悄悄跳過。
2. **測試沒過＝變更沒完成。** 不能因為「先求有再求好」而略過失敗的測試就回報完成。
3. **修 bug 時，優先寫一個能重現該 bug 的測試**（先讓它紅燈失敗），修好後這個測試轉綠燈——避免未來回歸。不是每個 bug 都強制這樣做，但邏輯類 bug（例如型別解析、邊界計算錯誤）應該這樣做。

## 後端（backend/）

- **框架**：pytest + FastAPI `TestClient`（或 `httpx.AsyncClient`）。
- **測試分類**：
  - **Unit test**：純邏輯函式，例如 `app/audit.py` 的欄位差異偵測、`app/deletion.py` 的 cascade 軟刪除邏輯、`app/schemas.py` 的驗證規則。
  - **API / Integration test**：透過 `TestClient` 呼叫每個 endpoint，涵蓋 CRUD、軟刪除（`DELETE` 後 `GET/LIST` 應排除）、cascade（刪除 `gecko` 應連帶軟刪除子紀錄）、衝突情境（例如 `daily_logs` 同一天重複建立應 409）、找不到資料應 404。
- **測試資料庫**：獨立的 Postgres database（例如 `gecko_test`，建在同一個 `docker-compose` 的 `db` 容器內，不要用 SQLite——本專案的 schema 用到 Postgres 專屬型別與 partial index，SQLite 測不出真實行為）。透過覆寫 `DATABASE_URL` 環境變數或 FastAPI 的 `app.dependency_overrides[get_db]` 指向測試資料庫；每個測試案例前建表、後清空或 rollback，不能污染開發用的 `gecko` 資料庫。
- **檔案位置**：`backend/tests/`，檔名比照 `app/` 結構命名（例如 `backend/tests/test_geckos.py` 對應 `app/routers/geckos.py`，`backend/tests/test_deletion.py` 對應 `app/deletion.py`）。
- **執行方式**：於 `backend/` 目錄執行 `pytest`。
- **新增/修改 API 或後端邏輯時**：對應的 `test_*.py` 必須同步新增或更新測試案例，這是品質關卡的一部分，不是「有空再補」。

## 前端（frontend/）

- **Unit / component test**：Vitest + React Testing Library。
  - 優先覆蓋 `src/utils/` 底下的純函式（例如 `feedingBand.ts`、`feedingBuckets.ts`、`dates.ts`）——這些是最容易因為改動而壞掉、也最容易寫測試的地方，價值最高。
  - `src/api/*.ts`（型別轉換、payload 組裝邏輯）與關鍵 hooks 視情況補測試。
  - 元件測試視複雜度斟酌，不用每個元件都測；但邏輯較重的表單（例如 `DailyLogForm` 的日期驅動新增/編輯切換、status 自動判斷邏輯）值得測。
- **Smoke test（e2e）**：Playwright，模擬使用者在瀏覽器中的關鍵操作流程（golden path）。例如：
  - 新增守宮 → 編輯 → 刪除。
  - 新增/編輯/刪除一筆進食紀錄，確認統計數字、60 天斑帶圖、圖表同步更新。
  - 之後每上線一種新紀錄類型（蛻皮／環境／下蛋），都要新增對應的 smoke test 流程，不能只在開發時手動跑一次就丟掉。
- **檔案位置**：
  - `frontend/src/**/*.test.ts(x)` 或對應的 `__tests__/` 資料夾——unit / component test。
  - `frontend/e2e/*.spec.ts`——Playwright smoke test。
- **執行方式**：
  - `npm run test`（Vitest，於 `frontend/` 目錄）。
  - `npm run test:e2e`（Playwright；需要 backend 與 frontend dev server 都在跑，或由 Playwright 的 `webServer` 設定自動啟動）。

## 「新增功能時要自己補 test case」的具體意思

不是被動等使用者說「幫我寫測試」，而是：**每次實作一個新功能（新 API、新表單、新頁面、新工具函式）的同一個工作階段內，測試就跟著程式碼一起寫好、一起跑過、一起 commit**，如同這件事本來就是「寫完功能」的一部分，而不是額外請求。

## 例外與務實原則

- 不要為了測試而測試：不需要對純排版/樣式調整寫測試，也不需要測第三方套件（Mantine、Recharts、FastAPI 本身）的行為。
- 測試的目的是保護「這個專案自己寫的邏輯」與「使用者實際會走的路徑」。優先順序：**後端業務邏輯 > 前端純函式 > 使用者關鍵流程（smoke）> 元件細節**。
- 如果一個變更真的很小、很難測（例如只是調整文字或間距），在回報時直接說明「這類變更不需要測試」即可，不用為了硬湊測試而寫沒意義的斷言。

## 與 CLAUDE.md 品質關卡的關係

本文件是 [CLAUDE.md](CLAUDE.md)「完成一項變更前的品質關卡」第 1 項的具體化：新架構下，自動化 unit/smoke test 是主要防線；瀏覽器手動測試在自動化測試建立後仍建議在功能完成時走一次 golden path 作為最後確認，但不再是唯一手段。

## 測試基礎建設現況（2026-08-30 已補齊 M1/M2）

- **後端**：`backend/tests/`，pytest + FastAPI TestClient，獨立 `gecko_test` 資料庫，涵蓋 geckos／daily-logs／shedding-logs（含照片上傳）／environment-logs／egg-logs 的 CRUD、軟刪除、cascade、409 衝突、audit log 稽核紀錄，共 35 個測試案例。過程中額外抓到並修好兩個真的 bug：
  1. `DailyLogUpdate`/`SheddingLogUpdate`/`EggLogUpdate` 的 `date` 欄位因為欄位名稱與型別名稱相同，被 pydantic 解析成 `NoneType`，PATCH 帶 `date` 一律 422（`app/schemas.py`）。
  2. `SheddingLogRead.photos` 直接從未過濾的 ORM relationship 序列化，軟刪除的照片不會消失（`app/schemas.py`，改用 Pydantic `field_validator` 過濾，刻意不動 ORM relationship 定義，避免誤觸 `cascade="all, delete-orphan"`）。
- **前端**：Vitest 涵蓋 `src/utils/`（`dates.ts`／`feedingBand.ts`／`feedingBuckets.ts`／`feedingConstants.ts`）純函式，共 29 個測試案例；Playwright（`frontend/e2e/`）涵蓋守宮新增/編輯、進食紀錄新增/編輯/刪除（含統計列、斑帶圖、圖表同步）、蛻皮紀錄新增/編輯/刪除（含多張照片上傳/刪除）共三條 golden path。
- 之後 M4–M5（環境／下蛋）與 M6（功能對等驗證）都要比照本文件規範，隨功能一起補測試，不要留到最後才補。
