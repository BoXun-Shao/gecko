from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .routers import daily_logs, egg_logs, environment_logs, geckos, shedding_logs

app = FastAPI(title="肥尾日誌 API")

UPLOADS_ROOT = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_ROOT), name="uploads")

app.include_router(geckos.router)
app.include_router(daily_logs.router)
app.include_router(shedding_logs.router)
app.include_router(environment_logs.router)
app.include_router(egg_logs.router)


@app.get("/health")
def health():
    return {"status": "ok"}
