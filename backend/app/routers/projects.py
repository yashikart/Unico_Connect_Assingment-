from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import Project
from ..schemas import ProjectRead


router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectRead])
def list_projects(session: Session = Depends(get_session)) -> List[ProjectRead]:
    projects = session.exec(select(Project)).all()
    return projects

