import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..schemas import LoginRequest, LoginResponse, UserRead


router = APIRouter(prefix="/api/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)) -> LoginResponse:
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user or user.password_hash != _hash_password(data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return LoginResponse(user=UserRead.model_validate(user))

