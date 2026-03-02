from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os


# Use a new SQLite file name so schema changes (like new columns) don't conflict with any old DB.
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./issues_v2.db")

# For SQLite, need check_same_thread=False when using in web apps
engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})


def init_db() -> None:
    """Create all tables."""
    from . import models  # noqa: F401  # ensure models are imported

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

