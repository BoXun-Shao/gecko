from fastapi import FastAPI

app = FastAPI(title="肥尾日誌 API")


@app.get("/health")
def health():
    return {"status": "ok"}
