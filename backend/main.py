import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from client_circout.backend.config import APP_HOST, APP_PORT, AUTH_AND_LOGGING_API_URL
from client_circout.backend.db.db import close_db, init_db
from client_circout.backend.logger import get_logger, setup_logging
from client_circout.backend.client_access import routers as  access_routers
from client_circout.backend.client_accounts import routers as account_routers
from client_circout.backend.client_communications import routers as commun_routers
from client_circout.backend.client_consents import routers as consents_routers
from client_circout.backend.client_files import routers as files_router
from client_circout.backend.client_history import routers as history_routers
from client_circout.backend.client_history.postprocessing import (
    start_visit_postprocessing_worker,
    stop_visit_postprocessing_worker,
)
from client_circout.backend.client_profile import routers as profile_routers
from client_circout.backend.client_review import routers as review_routers
from client_circout.backend.client_segments import routers as segments_routers
from client_circout.backend.clients_core import router as core_routers
import client_circout.backend.db.external_refs  # noqa: F401


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Application startup started.")

    await init_db()
    await start_visit_postprocessing_worker()

    logger.info("Application startup completed.")
    try:
        yield
    finally:
        logger.info("Application shutdown started.")
        await stop_visit_postprocessing_worker()
        await close_db()
        logger.info("Application shutdown completed.")

app = FastAPI(lifespan=lifespan)
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "fronted"
FRONTEND_TEMPLATES_DIR = FRONTEND_DIR / "templates"
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
CLIENT_PHOTOS_DIR = UPLOADS_DIR / "client-photos"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_DIR.exists():
    app.mount("/fronted", StaticFiles(directory=FRONTEND_DIR), name="fronted")
    app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="frontend_css")
    app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="frontend_js")

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
CLIENT_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/client-photos", StaticFiles(directory=CLIENT_PHOTOS_DIR), name="client_photos")
app.include_router(account_routers.router)
app.include_router(access_routers.router)
app.include_router(commun_routers.router)
app.include_router(files_router.router)
app.include_router(history_routers.router)
app.include_router(profile_routers.router)
app.include_router(review_routers.router)
app.include_router(segments_routers.router)
app.include_router(core_routers.router)


@app.post("/auth/2fa/max-webhook")
async def max_webhook_proxy(request: Request) -> dict:
    body = await request.body()
    headers = {"content-type": request.headers.get("content-type", "application/json")}
    targets = [AUTH_AND_LOGGING_API_URL.rstrip("/"), "http://127.0.0.1:7998"]
    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        last_error = None
        for target in dict.fromkeys(targets):
            try:
                response = await client.post(
                    f"{target}/auth/2fa/max-webhook",
                    content=body,
                    headers=headers,
                )
            except httpx.HTTPError as error:
                last_error = error
                continue
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
    raise HTTPException(status_code=502, detail=str(last_error) if last_error else "auth service unavailable")


@app.get("/health", tags=["health"])
async def healthcheck() -> dict[str, str]:
    logger.info("Healthcheck requested.")
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
async def frontend_index() -> FileResponse:
    return FileResponse(FRONTEND_TEMPLATES_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("client_circout.backend.main:app", host=APP_HOST, port=APP_PORT)
