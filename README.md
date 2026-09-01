# 肥尾日誌 · Fat-Tailed Gecko Log

`v0.2`

肥尾守宮（*Hemitheconyx caudicinctus*）飼育紀錄工具。正在從單一 HTML 檔（`index.html`）轉型為 React 前端 + FastAPI 後端 + PostgreSQL 資料庫，詳見 [docs/requirements/2026-08-23-資料庫化與商用架構規劃.md](docs/requirements/2026-08-23-資料庫化與商用架構規劃.md)。轉型完成前兩者並存；`index.html` 尚未淘汰，仍可獨立開啟使用。

## 新版（`frontend/` + `backend/`，開發中）

React + Mantine + Recharts 前端，呼叫 FastAPI + PostgreSQL 後端。功能已與 `index.html` 對等並新增三種紀錄類型：

- **多隻管理**：名字、品系、性別（公/母/未知）、出生日、入手日、照片、餵食頻率，新增/編輯/刪除
- **進食紀錄**：狀態四態（已餵食／部分進食／拒食／沒餵）、餌料與尺寸、排便、體重、備註；統計列、60 天斑帶圖、體重曲線、進食量圖表（天/週/餵食週期/月/年五種顆粒度）、餌料組成圖
- **蛻皮紀錄**（新）：日期、備註、多張照片上傳/瀏覽/刪除
- **環境溫濕度紀錄**（新）：量測時間、溫度、濕度、來源；每隻守宮可設安全範圍，超出範圍自動標示警示，趨勢圖含安全範圍參考線
- **下蛋紀錄**（新）：日期、蛋數、備註；下蛋數走勢圖

啟動方式見 [backend/README.md](backend/README.md)（先啟動 API）與 [frontend/README.md](frontend/README.md)（`npm run dev`，預設 http://localhost:5173）。資料存在 PostgreSQL，不受瀏覽器/裝置限制。Excel 匯出/匯入尚未於新架構重新實作，見 [TODO.md](TODO.md)。

## 舊版（`index.html`，仍可用）

單一 HTML 檔，無後端、無建置流程，開啟即用。

- **多隻管理**：每隻獨立的名字、品系（多基因不限字數）、性別、出生日、入手日、照片、餵食頻率
- **每日紀錄**：進食數量、餌料種類與尺寸、排便、體重、備註
- **狀態區分**：數量為 0 時可標記為「拒食」或「沒餵（非餵食日）」，非餵食日不會被誤計為拒食
- **60 天斑帶圖**：以守宮橫紋呈現，區分進食／拒食／沒餵／排定日未記錄／非餵食日
- **體重曲線**：含與前次量測的增減
- **進食量圖表**：可切換 天 / 週 / 餵食週期 / 月 / 年 五種顆粒度
- **餌料組成**：依「餌料＋尺寸」統計比例
- **Excel 匯出／匯入**：含照片，可完整還原

直接開啟 `index.html`，或部署到任何靜態主機。資料存在瀏覽器的 `localStorage`（key 為 `fattail-gecko-log-v1`），因此：

- 資料綁定**單一瀏覽器**，換裝置或清除瀏覽資料會遺失
- 請定期使用「匯出 Excel」備份（匯出檔含照片，可完整還原）

相依套件：[SheetJS](https://sheetjs.com/) 0.18.5，由 cdnjs CDN 載入，處理 Excel 匯出匯入。其餘皆為原生 JavaScript，圖表為手寫 SVG。

## Roadmap

長期方向：新架構補齊 Excel 匯出/匯入、照片改存伺服器檔案系統、功能對等驗證後淘汰 `index.html`，未來視需求評估多使用者/跨裝置帳號系統。

完整待辦清單與優先序見 [TODO.md](TODO.md)。開發流程規範見 [CLAUDE.md](CLAUDE.md)。
