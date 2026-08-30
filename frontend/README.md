# Frontend

React + TypeScript + Vite，透過 REST API 呼叫 [backend/](../backend)（FastAPI + PostgreSQL）。UI 元件庫 Mantine、圖表 Recharts、路由 react-router、資料層 TanStack React Query。技術選型與導覽架構決策見 [docs/requirements/2026-08-30-前端重寫規劃.md](../docs/requirements/2026-08-30-前端重寫規劃.md)。

## 本機開發設置

前置需求：Node.js（LTS），且 [backend/](../backend) 已依其 README 啟動（Postgres + `uvicorn`，預設 `http://localhost:8000`）。

```bash
# 1. 安裝套件
npm install

# 2. 設定環境變數（預設值已對應本機後端）
cp .env.example .env

# 3. 啟動 dev server
npm run dev
```

啟動後開啟 http://localhost:5173/。

## 更新 API 型別

後端 schema（`backend/app/schemas.py`）異動後，重新產生型別（需後端本機運行）：

```bash
npm run codegen
```

會依序抓取 `http://localhost:8000/openapi.json` 存成 `openapi.json`，再用 `openapi-typescript` 產生 `src/openapi-types.ts`（自動產生，勿手動修改），兩者一併 commit。

## 測試

測試規範見根目錄 [TESTING.md](../TESTING.md)。

```bash
npm run test       # Vitest，跑 src/**/*.test.ts(x) 的 unit test
npm run test:watch # Vitest watch 模式
npm run test:e2e   # Playwright smoke test（e2e/），需要 backend 已啟動；frontend dev server 沒開會自動幫你開
```

## 其他指令

```bash
npm run build     # 型別檢查 + production build
npm run lint      # oxlint
npm run preview   # 預覽 production build
```
