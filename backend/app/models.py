from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Status(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class ProjectBase(SQLModel):
    name: str
    code: Optional[str] = None


class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class UserBase(SQLModel):
    name: str
    email: str
    role: str = "EMPLOYEE"  # ADMIN or EMPLOYEE by convention
    password_hash: str


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class IssueBase(SQLModel):
    title: str
    description: str
    priority: Priority = Priority.MEDIUM
    status: Status = Status.OPEN


class Issue(IssueBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    assignee_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CommentBase(SQLModel):
    body: str


class Comment(CommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    issue_id: int = Field(foreign_key="issue.id")
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AttachmentBase(SQLModel):
    filename: str
    content_type: str
    url: str  # public URL or path under /uploads


class Attachment(AttachmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    issue_id: int = Field(foreign_key="issue.id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

