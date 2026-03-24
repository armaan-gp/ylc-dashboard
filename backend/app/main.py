import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text

from app.database import engine, Base
import app.models  # noqa: F401 — ensure models are registered before create_all

from app.routers import auth, members, exercises, session_logs, analytics


def _run_migrations() -> None:
    """Add new columns to existing tables without Alembic."""
    migrations = [
        "ALTER TABLE exercises ADD COLUMN tracking_type VARCHAR DEFAULT 'weight_reps'",
        "ALTER TABLE session_logs ADD COLUMN duration_seconds FLOAT",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # column already exists


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    yield


app = FastAPI(
    title="Young Lifters Club API",
    version="1.0.0",
    lifespan=lifespan,
)

_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_DEV_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(exercises.router)
app.include_router(session_logs.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Young Lifters Club"}


# Serve the built React frontend (production only)
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static_frontend")
if os.path.isdir(_STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(_STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        index = os.path.join(_STATIC_DIR, "index.html")
        return FileResponse(index)
