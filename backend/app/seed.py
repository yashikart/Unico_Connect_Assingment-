from sqlmodel import Session, select
import hashlib

from .database import engine
from .models import Project, User, Issue, Comment, Priority, Status


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_data() -> None:
    with Session(engine) as session:
        # avoid reseeding if projects already exist
        existing = session.exec(select(Project)).first()
        if existing:
            return

        projects = [
            Project(name="Project Alpha", code="ALPHA"),
            Project(name="Project Beta", code="BETA"),
            Project(name="Project Gamma", code="GAMMA"),
            Project(name="Project Delta", code="DELTA"),
        ]
        session.add_all(projects)

        users = [
            User(
                name="Admin User",
                email="admin@unico.local",
                role="ADMIN",
                password_hash=_hash_password("admin123"),
            ),
            User(
                name="Alice Johnson",
                email="alice@example.com",
                role="EMPLOYEE",
                password_hash=_hash_password("alice123"),
            ),
            User(
                name="Bob Smith",
                email="bob@example.com",
                role="EMPLOYEE",
                password_hash=_hash_password("bob123"),
            ),
            User(
                name="Charlie Lee",
                email="charlie@example.com",
                role="EMPLOYEE",
                password_hash=_hash_password("charlie123"),
            ),
            User(
                name="Dana Kapoor",
                email="dana@example.com",
                role="EMPLOYEE",
                password_hash=_hash_password("dana123"),
            ),
        ]
        session.add_all(users)
        session.commit()

        # At this point only projects and users are seeded.
        # Sample issues and comments were removed so that the dashboard starts empty.


if __name__ == "__main__":
    from .database import init_db

    init_db()
    seed_data()

