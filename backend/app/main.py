from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import init_db
from .seed import seed_data
from .routers import projects, users, issues, auth, ai


def create_app() -> FastAPI:
    app = FastAPI(title="Issue Tracker API")

    # CORS – allow frontend dev server; adjust as needed
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()
        seed_data()

    app.include_router(projects.router)
    app.include_router(users.router)
    app.include_router(issues.router)
    app.include_router(auth.router)
    app.include_router(ai.router)

    # Serve uploaded files (attachments) from /uploads
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

    return app


app = create_app()

