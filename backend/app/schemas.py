from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field as PydanticField

from .models import Priority, Status


class ProjectRead(BaseModel):
    id: int
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "EMPLOYEE"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


class CommentCreate(BaseModel):
    body: str = PydanticField(min_length=1)
    author_id: int


class CommentRead(BaseModel):
    id: int
    body: str
    author_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IssueBase(BaseModel):
    title: str = PydanticField(min_length=1)
    description: str = PydanticField(min_length=1)
    project_id: int
    priority: Priority
    status: Status
    assignee_id: Optional[int] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    assignee_id: Optional[int] = None


class IssueRead(BaseModel):
    id: int
    title: str
    description: str
    project_id: int
    priority: Priority
    status: Status
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IssueDetail(IssueRead):
    comments: List[CommentRead] = []
    # attachments field will be populated by the API layer
    # when returning an issue detail response
    # (avoids changing existing IssueRead usages)
    # type: ignore[assignment]
    attachments: List["AttachmentRead"] = []


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    user: UserRead


class AIParseIssueRequest(BaseModel):
    free_text: str = PydanticField(min_length=1)


class AIParseIssueResponse(BaseModel):
    title: str
    description: str
    project_id: Optional[int] = None
    priority: Priority
    status: Status
    assignee_id: Optional[int] = None


class AITriageRequest(BaseModel):
    title: str
    description: str
    project_id: int


class AITriageResponse(BaseModel):
    priority: Priority
    assignee_id: Optional[int] = None
    rationale: str


class AttachmentRead(BaseModel):
    id: int
    issue_id: int
    filename: str
    content_type: str
    url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class RecentActivityItem(BaseModel):
    id: int
    type: str  # "comment" or "attachment"
    issue_id: int
    issue_title: str
    project_name: Optional[str] = None
    author_name: Optional[str] = None
    filename: Optional[str] = None
    created_at: datetime
    preview: str

