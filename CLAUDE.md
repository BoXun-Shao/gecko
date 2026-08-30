# CLAUDE.md

本檔案定義本專案（肥尾日誌）的開發流程（SDLC）。每次協助開發時都應遵循以下規則。

## 專案性質

**現況（尚未變更）**：單一 HTML 檔（`index.html`）、無建置流程、無後端。資料存在瀏覽器 `localStorage`，可匯出/匯入 Excel。詳見 [README.md](README.md)。

**架構轉型中**：依 [2026-08-23-資料庫化與商用架構規劃.md](docs/requirements/2026-08-23-資料庫化與商用架構規劃.md)，專案正在規劃轉型為 React 前端 + Python（FastAPI）後端 + PostgreSQL 資料庫，並以未來可能商用（多使用者）的角度設計 schema。轉型完成、新版功能與舊版對等後，舊的單一 HTML 檔架構會被淘汰。**在轉型完成前，上面「現況」描述仍然有效**；開發時以該需求書為 source of truth，不要提前假設新架構已經到位。

## 需求驅動開發（最優先規則）

開發任何功能之前，必須先有對應的需求書（見下方「需求書管理」）。沒有需求書涵蓋的工作不開發；訪談階段沒問清楚的地方不要邊做邊猜。

開發過程中，只要為了實作而必須做的選擇（技術方案、UI 細節、資料結構、邊界情況處理等）與需求書內容**衝突**，或是需求書**沒有涵蓋到**：

1. **立即停止該項工作**，不繼續往下實作、不自行假設。
2. **馬上向用戶提出衝突點**，說明需求書寫的是什麼、實作上遇到什麼狀況、為什麼有衝突。
3. **重新進行需求訪談**確認新的決定，並更新對應的需求書。
4. 確認後才能繼續開發。

不可先斬後奏、不可用「合理猜測」帶過需求書沒寫清楚的地方。

## 需求書管理

- 每次需求訪談完成後，在 `docs/requirements/` 建立一份新文件，命名格式：`YYYY-MM-DD-主題.md`（日期用訪談當天的絕對日期）。
- 內容至少包含：訪談日期、範圍/主題、需求細項、開放性問題的決策記錄與理由。
- 需求書是開發依據的 source of truth；[TODO.md](TODO.md) 只是從需求書萃取出的待辦追蹤清單（勾選狀態用），細節與最終依據仍以對應的需求書為準。
- 需求異動（含衝突後的重新確認）一律**新增**一份需求書記錄異動內容，不覆蓋或刪除舊需求書，保留完整決策歷史。

## 開發流程

**分支策略：Trunk-based。** 直接在 `main` 上開發，小步提交，不開 feature branch。

**Commit 規範：Conventional Commits。**
格式：`<type>: <description>`，常用 type：
- `feat`：新功能
- `fix`：修 bug
- `docs`：文件異動（README、TODO 等）
- `chore`：雜項維護（不影響功能）
- `refactor`：不改變行為的程式碼調整

## 完成一項變更前的品質關卡

一項變更在標記為完成之前，須通過以下五項：

1. **自動化測試（unit + smoke/e2e）**：規範見 [TESTING.md](TESTING.md)——寫完/修改程式碼後要跑既有測試，新功能要主動補測試案例，不用等使用者要求。這是 `backend/`、`frontend/` 新架構程式碼的主要防線。
2. **瀏覽器手動測試**：舊版 `index.html` 尚未淘汰前，異動它時仍要實際開啟走過 golden path 與邊界情況（例如：拒食 vs 沒餵、0 隻/多隻切換、圖表各種粒度）；`frontend/` 新功能完成時也建議手動走一次 golden path 作為最後確認，但不是唯一手段（見 TESTING.md）。
3. **Code review**：用 `/code-review` 檢查正確性與可簡化之處。
4. **文件同步更新**：功能異動需同步更新 README（功能說明、Roadmap/版本號）與 [TODO.md](TODO.md)（勾掉已完成項目）。
5. **資料相容性檢查**：見下方「資料結構變更政策」。

## 資料結構變更政策

`localStorage`（key: `fattail-gecko-log-v1`）與 Excel 匯出/匯入格式的任何 schema 變更，**必須實作自動遷移邏輯**：

- 舊版 `localStorage` 資料讀取時要能自動轉換成新結構，不可要求使用者手動處理。
- 舊版匯出的 Excel 檔案要能被新版正確匯入還原。
- 不可因為 schema 變更而讓使用者遺失既有紀錄（守宮飼育史是無法重建的真實資料）。

範例：TODO.md 中「`qty` + `skipped` 改為單一 `status` 列舉」這類變更，需要寫讀取時的轉換邏輯（偵測舊格式 → 轉換為新格式），而不是要求使用者重新輸入。

**後端 PostgreSQL schema（`backend/app/models.py` + Alembic migration）變更後**，需在 `backend/` 目錄執行 `python -m scripts.generate_schema_doc`，重新產生 [docs/database/schema.md](docs/database/schema.md)（資料表定義 + Mermaid ER 圖），保持與實際 DB schema 同步。該檔案為自動產生，不手動編輯。

## 版本號

在 README 標註簡單版本號（例如 `v0.1` → `v0.2`），對應重大功能里程碑，不做完整 semver。目前尚未有版本號時視為 `v0.1`（未版本化的初始狀態）。

## 待辦追蹤

所有待辦事項（功能、bug、雜項）記錄在 [TODO.md](TODO.md)，分類為 Bug / Feature / Chore，並標註優先序。每個 TODO 項目應對應 `docs/requirements/` 中的一份需求書（細節以需求書為準）。README 的 Roadmap 區塊只保留長期願景重點，並指向 TODO.md 取得完整清單。

完成項目：在對應的 commit 中把 TODO.md 裡的項目打勾或移除，保持清單與實際進度一致。
