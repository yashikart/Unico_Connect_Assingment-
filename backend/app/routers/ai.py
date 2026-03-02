import json
import os
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Project, User, Priority, Status
from ..schemas import (
    AIParseIssueRequest,
    AIParseIssueResponse,
    AITriageRequest,
    AITriageResponse,
)

try:
    import openai  # type: ignore
except ImportError:  # pragma: no cover - library may not be installed in all envs
    openai = None  # type: ignore


router = APIRouter(prefix="/api/ai", tags=["ai"])


def _get_openai_client():
    """
    Return an OpenAI client instance for the v1 SDK if available.
    For the legacy 0.x SDK, this returns None and we fall back to module-level calls.
    """
    if openai is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI functionality is not available (openai library not installed).",
        )
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI functionality is not configured (missing OPENAI_API_KEY).",
        )

    # v1+ SDK exposes OpenAI client class
    if hasattr(openai, "OpenAI"):
        return openai.OpenAI(api_key=api_key)  # type: ignore[attr-defined]

    # Legacy 0.x SDK – set global api_key and use ChatCompletion below
    openai.api_key = api_key  # type: ignore[assignment]
    return None


def _safe_priority(value: Optional[str]) -> Priority:
    try:
        return Priority(value or "MEDIUM")
    except ValueError:
        return Priority.MEDIUM


def _safe_status(value: Optional[str]) -> Status:
    try:
        return Status(value or "OPEN")
    except ValueError:
        return Status.OPEN


@router.post("/parse-issue", response_model=AIParseIssueResponse)
def parse_issue(
    payload: AIParseIssueRequest,
    session: Session = Depends(get_session),
) -> AIParseIssueResponse:
    """
    Take a free-text bug report and return structured issue fields.
    """
    client = _get_openai_client()

    projects: List[Project] = session.exec(select(Project)).all()
    users: List[User] = session.exec(select(User)).all()

    system_prompt = (
        "You are an assistant that converts messy bug reports into structured issue objects "
        "for a ticketing system. Always respond with STRICT JSON, no extra text."
    )

    projects_desc = [
        {"id": p.id, "name": p.name, "code": p.code} for p in projects if p.id is not None
    ]
    users_desc = [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users if u.id is not None
    ]

    user_prompt = f"""
Free-text issue description:
\"\"\"{payload.free_text}\"\"\"

Projects (id, name, code):
{json.dumps(projects_desc, indent=2)}

Users (id, name, email, role):
{json.dumps(users_desc, indent=2)}

Return a JSON object with the following shape:
{{
  "title": string,                // concise issue title
  "description": string,          // cleaned up description
  "project_id": number | null,    // choose the best matching project id or null
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "status": "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
  "assignee_id": number | null    // choose best matching assignee id or null
}}
Only output valid JSON, no comments, no markdown.
"""

    try:
        model = os.getenv("OPENAI_MODEL_PARSE_ISSUE", "gpt-4o-mini")
        if client is not None and hasattr(client, "chat"):
            # New v1 SDK style
            completion = client.chat.completions.create(  # type: ignore[attr-defined]
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            content = completion.choices[0].message.content or ""
        else:
            # Legacy 0.x style
            response = openai.ChatCompletion.create(  # type: ignore[attr-defined]
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            content = response["choices"][0]["message"]["content"]  # type: ignore[index]
    except Exception as exc:  # pragma: no cover - network / API errors
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error while parsing issue: {exc}",
        )

    try:
        raw = json.loads(content)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI response could not be parsed as JSON.",
        )

    title = (raw.get("title") or "").strip()
    description = (raw.get("description") or "").strip()
    if not title or not description:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI response did not contain a valid title/description.",
        )

    project_id = raw.get("project_id")
    if project_id is not None and not any(p.id == project_id for p in projects):
        project_id = None

    assignee_id = raw.get("assignee_id")
    if assignee_id is not None and not any(u.id == assignee_id for u in users):
        assignee_id = None

    priority = _safe_priority(raw.get("priority"))
    status_value = _safe_status(raw.get("status"))

    return AIParseIssueResponse(
        title=title,
        description=description,
        project_id=project_id,
        priority=priority,
        status=status_value,
        assignee_id=assignee_id,
    )


@router.post("/suggest-triage", response_model=AITriageResponse)
def suggest_triage(
    payload: AITriageRequest,
    session: Session = Depends(get_session),
) -> AITriageResponse:
    """
    Suggest priority and assignee for a new issue.
    """
    client = _get_openai_client()

    # Use only employees as candidate assignees
    users: List[User] = session.exec(select(User)).all()
    employee_users = [u for u in users if (u.role or "").upper() == "EMPLOYEE"]

    system_prompt = (
        "You are a triage assistant for a software issue tracker. "
        "Given an issue's title, description, and project, you suggest a priority "
        "and the best assignee from the provided employees. Respond with STRICT JSON."
    )

    employees_desc = [
        {"id": u.id, "name": u.name, "email": u.email} for u in employee_users if u.id is not None
    ]

    user_prompt = f"""
Issue to triage:
Title: {payload.title}
Description: {payload.description}
Project ID: {payload.project_id}

Employees (candidate assignees):
{json.dumps(employees_desc, indent=2)}

Return a JSON object with the following shape:
{{
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "assignee_id": number | null,   // pick the best employee id or null
  "rationale": string             // short explanation for your choice
}}
Only output valid JSON, no comments, no markdown.
"""

    try:
        model = os.getenv("OPENAI_MODEL_SUGGEST_TRIAGE", "gpt-4o-mini")
        if client is not None and hasattr(client, "chat"):
            completion = client.chat.completions.create(  # type: ignore[attr-defined]
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            content = completion.choices[0].message.content or ""
        else:
            response = openai.ChatCompletion.create(  # type: ignore[attr-defined]
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            content = response["choices"][0]["message"]["content"]  # type: ignore[index]
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error while suggesting triage: {exc}",
        )

    try:
        raw = json.loads(content)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI response could not be parsed as JSON.",
        )

    priority = _safe_priority(raw.get("priority"))
    assignee_id = raw.get("assignee_id")
    if assignee_id is not None and not any(u.id == assignee_id for u in employee_users):
        assignee_id = None

    rationale = (raw.get("rationale") or "").strip()
    if not rationale:
        rationale = "AI did not provide a detailed rationale."

    return AITriageResponse(
        priority=priority,
        assignee_id=assignee_id,
        rationale=rationale,
    )

