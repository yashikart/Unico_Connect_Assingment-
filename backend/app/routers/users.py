from typing import List
import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..schemas import UserRead, UserCreate, UserUpdate


router = APIRouter(prefix="/api/users", tags=["users"])


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.get("/", response_model=List[UserRead])
def list_users(session: Session = Depends(get_session)) -> List[UserRead]:
    users = session.exec(select(User)).all()
    return users


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, session: Session = Depends(get_session)) -> UserRead:
    # Simple uniqueness check on email
    existing = session.exec(select(User).where(User.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")

    user = User(
        name=data.name,
        email=data.email,
        role=data.role or "EMPLOYEE",
        password_hash=_hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, data: UserUpdate, session: Session = Depends(get_session)) -> UserRead:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check email uniqueness if email is being updated
    if data.email and data.email != user.email:
        existing = session.exec(select(User).where(User.email == data.email)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")
        user.email = data.email

    if data.name is not None:
        user.name = data.name
    if data.role is not None:
        user.role = data.role
    if data.password is not None:
        user.password_hash = _hash_password(data.password)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    session.delete(user)
    session.commit()
    return None

