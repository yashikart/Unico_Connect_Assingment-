from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
import os
import uuid
from datetime import datetime

from ..database import get_session
from ..models import Issue, Comment, Attachment, Project, User
from ..schemas import (
    IssueCreate,
    IssueRead,
    IssueUpdate,
    IssueDetail,
    CommentCreate,
    CommentRead,
    AttachmentRead,
    RecentActivityItem,
)


router = APIRouter(prefix="/api/issues", tags=["issues"])


@router.get("/", response_model=List[IssueRead])
def list_issues(
    session: Session = Depends(get_session),
    project_id: Optional[int] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    status_param: Optional[str] = Query(default=None, alias="status"),
    assignee_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
) -> List[IssueRead]:
    query = select(Issue)

    if project_id is not None:
        query = query.where(Issue.project_id == project_id)
    if priority is not None:
        query = query.where(Issue.priority == priority)
    if status_param is not None:
        query = query.where(Issue.status == status_param)
    if assignee_id is not None:
        query = query.where(Issue.assignee_id == assignee_id)
    if search:
        like = f"%{search}%"
        query = query.where((Issue.title.ilike(like)) | (Issue.description.ilike(like)))

    issues = session.exec(query.order_by(Issue.created_at.desc())).all()
    return issues


@router.post("/", response_model=IssueRead, status_code=status.HTTP_201_CREATED)
def create_issue(data: IssueCreate, session: Session = Depends(get_session)) -> IssueRead:
    issue = Issue.from_orm(data)
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.get("/{issue_id}", response_model=IssueDetail)
def get_issue(issue_id: int, session: Session = Depends(get_session)) -> IssueDetail:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    # load comments
    comments = session.exec(select(Comment).where(Comment.issue_id == issue_id)).all()
    attachments = session.exec(select(Attachment).where(Attachment.issue_id == issue_id)).all()
    return IssueDetail.from_orm(issue).model_copy(
        update={
            "comments": comments,
            "attachments": [AttachmentRead.model_validate(a) for a in attachments],
        }
    )


@router.patch("/{issue_id}", response_model=IssueRead)
def update_issue(issue_id: int, data: IssueUpdate, session: Session = Depends(get_session)) -> IssueRead:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(issue, field, value)

    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.post("/{issue_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(issue_id: int, data: CommentCreate, session: Session = Depends(get_session)) -> CommentRead:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    comment = Comment(issue_id=issue_id, author_id=data.author_id, body=data.body)
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


@router.post(
    "/{issue_id}/attachments",
    response_model=AttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_attachment(
    issue_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> AttachmentRead:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    # simple size guard: rely on client-side guidance and server limits; could extend later
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

    public_url = f"/uploads/{unique_name}"

    attachment = Attachment(
        issue_id=issue_id,
        filename=file.filename or unique_name,
        content_type=file.content_type or "application/octet-stream",
        url=public_url,
    )
    session.add(attachment)
    session.commit()
    session.refresh(attachment)

    return AttachmentRead.model_validate(attachment)


@router.get("/{issue_id}/attachments", response_model=list[AttachmentRead])
def list_attachments(issue_id: int, session: Session = Depends(get_session)) -> list[AttachmentRead]:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    attachments = session.exec(select(Attachment).where(Attachment.issue_id == issue_id)).all()
    return [AttachmentRead.model_validate(a) for a in attachments]


@router.get("/activity/recent", response_model=list[RecentActivityItem])
def recent_activity(limit: int = 20, session: Session = Depends(get_session)) -> list[RecentActivityItem]:
    """
    Recent comments (from employees) and attachments across all issues,
    for use in the admin notification panel.
    """
    limit = max(1, min(limit, 50))

    comments = session.exec(
        select(Comment).order_by(Comment.created_at.desc()).limit(limit * 2)
    ).all()
    attachments = session.exec(
        select(Attachment).order_by(Attachment.uploaded_at.desc()).limit(limit * 2)
    ).all()

    items: list[RecentActivityItem] = []

    # Build comment-based activity (only from EMPLOYEE users)
    for c in comments:
        issue = session.get(Issue, c.issue_id)
        if not issue:
            continue
        project = session.get(Project, issue.project_id)
        author = session.get(User, c.author_id)
        if not author or (author.role or "").upper() != "EMPLOYEE":
            continue
        preview = (c.body or "").strip()
        if len(preview) > 140:
            preview = preview[:137] + "..."
        items.append(
            RecentActivityItem(
                id=c.id,
                type="comment",
                issue_id=issue.id,  # type: ignore[arg-type]
                issue_title=issue.title,
                project_name=project.name if project else None,
                author_name=author.name,
                filename=None,
                created_at=c.created_at,
                preview=preview,
            )
        )

    # Build attachment-based activity (any uploader)
    for a in attachments:
        issue = session.get(Issue, a.issue_id)
        if not issue:
            continue
        project = session.get(Project, issue.project_id)
        preview = f"File attached: {a.filename}"
        items.append(
            RecentActivityItem(
                id=a.id,
                type="attachment",
                issue_id=issue.id,  # type: ignore[arg-type]
                issue_title=issue.title,
                project_name=project.name if project else None,
                author_name=None,
                filename=a.filename,
                created_at=a.uploaded_at,
                preview=preview,
            )
        )

    # Sort combined by created_at desc and take top N
    items.sort(key=lambda x: x.created_at, reverse=True)
    return items[:limit]

