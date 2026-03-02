## Overview

Internal **Issue Tracker** for a small consulting firm (≈15 users, 4 projects).  
Stack is designed to be **simple, fast to build in a few hours**, but still **production‑ready** and easy to extend.

- **Frontend**: React + TypeScript (SPA, built with Vite or Create React App)
- **Backend**: FastAPI (Python) exposing a clean REST API
- **Database**: SQLite for the timed exercise (easily swappable to Postgres)
- **ORM**: SQLModel or SQLAlchemy
- **AI Integration**: OpenAI (or compatible) models called from the backend

The frontend is a pure client consuming the FastAPI REST API. All AI functionality is implemented server‑side behind dedicated endpoints so the UI stays simple and the API remains usable from Postman/cURL.

---


- **Frontend**
  - React + TypeScript single‑page app.
  - Screens: Login, Admin Dashboard, Employee Dashboard, New Issue, Issue Detail, Employees, Assignments, History.
  - Talks only to the backend via JSON over HTTP (`/api/...`).

- **Backend**
  - FastAPI application exposing REST endpoints for auth, users, projects, issues, comments, AI helpers, and attachments.
  - Handles validation, business rules, AI calls (OpenAI), and file uploads.

- **Database**
  - SQLite file (`issues_v2.db`) accessed via SQLModel/SQLAlchemy.
  - Tables: `project`, `user`, `issue`, `comment`, `attachment`.

### High‑Level Block Diagram

```text
[ Browser (React SPA) ]
        │
        │  HTTPS / JSON (REST API)
        ▼
[ FastAPI Backend ]
   ├─ Auth & Users (login, roles)
   ├─ Projects / Issues / Comments
   ├─ AI Endpoints (parse issue, suggest triage)
   ├─ File Uploads (attachments)
   ▼
[ SQLite Database ]
   ├─ project
   ├─ user
   ├─ issue
   ├─ comment
   └─ attachment
```

```text
[ Employee Dashboard ]
   ├─ New Issue form (+ AI assist)
   ├─ My Issues / History
   └─ Comments + Attachments
        │
        ▼
[ Admin Dashboard ]
   ├─ All Issues + Filters
   ├─ Assignments
   ├─ Employees
   └─ Notifications (new issues, messages)
```

---

## Tech Stack & Rationale

- **FastAPI (Backend)**
  - Great DX: type hints, automatic docs at `/docs`, easy validation via Pydantic.
  - Very fast to stand up a REST API with proper status codes and error handling.
  - Natural place to centralize **AI calls** (no API keys in the browser).

- **React + TypeScript (Frontend)**
  - Common and realistic for internal tools.
  - Component-based structure for dashboard, filters, forms, and detail view.
  - Easy to add charts and modern UI patterns.

- **SQLite (DB)**
  - Zero-configuration for local dev and a timed challenge.
  - Schema easily migrates to Postgres by changing the connection string and running migrations.

- **SQLModel / SQLAlchemy (ORM)**
  - Typed models and clean relationships.
  - Easy to define `Issue`, `Project`, `User`, and `Comment` models and run seed scripts.

- **OpenAI (AI)**
  - Used for **structuring free‑text into issue fields** and **suggesting triage** (priority and assignee).
  - All prompts and responses handled server‑side with strict JSON contracts to keep behavior predictable.

---

## Data Model

### Entities

- **Project**
  - `id` (UUID or int PK)
  - `name` (e.g. "Project Alpha")
  - `code` (short identifier, optional)

- **User**
  - `id`
  - `name`
  - `email`

- **Issue**
  - `id`
  - `title`
  - `description`
  - `project_id` → FK to `Project`
  - `priority` → enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `status` → enum: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
  - `assignee_id` → FK to `User` (nullable if unassigned)
  - `created_at`
  - `updated_at`

- **Comment**
  - `id`
  - `issue_id` → FK to `Issue`
  - `author_id` → FK to `User`
  - `body` (text)
  - `created_at`

### Relationships

- `Project` 1‑N `Issue`
- `User` 1‑N `Issue` (as assignee)
- `Issue` 1‑N `Comment`
- `User` 1‑N `Comment` (as author)

---

## REST API Design

Base URL: `/api`

### Core Resources

- **Projects**
  - `GET /api/projects`  
    - List all projects (used to populate dropdowns).

- **Users**
  - `GET /api/users`  
    - List all users (for assignee dropdown).

- **Issues**
  - `GET /api/issues`
    - Query params for filters:
      - `project_id`
      - `priority`
      - `status`
      - `assignee_id`
      - `search` (search in title/description)
    - Returns paginated list of issues + counts per status.
  - `POST /api/issues`
    - Body: validated issue creation payload (all fields required).
    - Returns created issue with `201 Created`.
  - `GET /api/issues/{issue_id}`
    - Returns issue details including comments.
  - `PATCH /api/issues/{issue_id}`
    - Allows partial updates (e.g. status, title, assignee).
  - `DELETE /api/issues/{issue_id}` (optional; not essential for the test).

- **Comments**
  - `POST /api/issues/{issue_id}/comments`
    - Body: `{ "body": string, "author_id": string }`
    - Returns created comment with timestamp.
  - `GET /api/issues/{issue_id}/comments`
    - Typically included in `GET /api/issues/{issue_id}`, but can be separate if needed.

### Bonus Endpoints

- **CSV Export**
  - `GET /api/issues/export`
    - Query params reuse the same filters as `/api/issues`.
    - Returns `text/csv` of filtered issues.

- **Stats / Chart Data**
  - `GET /api/stats/issues-by-project`
    - Returns `{ project_id, project_name, count }[]`.
  - `GET /api/stats/issues-by-priority`
    - Returns counts per priority.

---

## AI Integration

AI is integrated as **server‑side helper endpoints** that the frontend can call.  
This keeps the core Issue Tracker functional even if AI is unavailable, and lets Postman/cURL users exercise AI features as well.

### 1. AI-Assisted Issue Parsing

- **Endpoint**: `POST /api/ai/parse-issue`
- **Purpose**: Take a rough, natural language description from the user and convert it into structured issue fields.
- **Request body example**:

```json
{
  "free_text": "Login fails for Project Alpha when the password is wrong, it's urgent, assign to John."
}
```

- **Backend behavior**:
  - Sends `free_text` plus a description of valid projects, users, and enums to the LLM (OpenAI).
  - Asks the model to respond with strict JSON matching a Pydantic schema:
    - `title`
    - `description`
    - `project_name`
    - `priority` (`LOW`|`MEDIUM`|`HIGH`|`CRITICAL`)
    - `status` (default `OPEN` unless otherwise implied)
    - `assignee_name` (optional)
  - Maps `project_name` and `assignee_name` to existing IDs.
  - Returns structured data to the frontend, which **prefills the issue creation form** (user can review/edit before submitting).

- **Why**:
  - Demonstrates AI used for **structuring free text**, not just generating prose.
  - Saves time for users logging many issues.

### 2. AI Triage Suggestions

- **Endpoint**: `POST /api/ai/suggest-triage`
- **Purpose**: Given a title, description, and project, suggest:
  - Priority (Low/Medium/High/Critical)
  - Assignee (best candidate user, based on simple project mapping or heuristics in the prompt)

- **Request body example**:

```json
{
  "title": "Crash on export to CSV",
  "description": "When exporting a report for Project Beta, the app crashes after a few seconds.",
  "project_id": "PROJECT_BETA_ID"
}
```

- **Response example**:

```json
{
  "priority": "HIGH",
  "assignee_id": "BACKEND_ENGINEER_ID",
  "rationale": "Crash affecting a core feature; assign to backend engineer handling exports."
}
```

- **Frontend behavior**:
  - Show suggestions next to the form controls with a **“Use AI suggestion”** button, or auto‑fill but allow user to override.

### 3. Optional: Duplicate / Related Issue Detection

- **Endpoint**: `POST /api/ai/find-related-issues`
- **Purpose**: While creating an issue, warn the user about possible duplicates.
- **High‑level approach**:
  - Backend fetches top N existing issues (e.g. by search keyword).
  - Sends list of titles + descriptions + the new issue to the LLM.
  - Asks the model to return IDs of potentially related/duplicate issues.

This can be implemented if time allows; otherwise documented as a “future improvement”.

---

## Frontend Architecture (React)

### High-Level Pages / Routes

- `/` – **Dashboard**
  - Table of all issues.
  - Filters: project, priority, status, assignee.
  - Search box for title/description.
  - Status counts summary bar.

- `/issues/new` – **Create Issue**
  - Traditional form (title, description, project, priority, status, assignee).
  - **AI assist section**:
    - Textarea for rough description.
    - Button “Let AI fill fields” → calls `/api/ai/parse-issue` and fills the form.
    - Button “Suggest priority/assignee” → calls `/api/ai/suggest-triage`.

- `/issues/:id` – **Issue Detail**
  - Shows all fields.
  - Status dropdown for changes (PATCH to `/api/issues/{id}`).
  - Comments list & “Add comment” form.
  - Optional: button to “Summarize issue” using AI (future work).

### Core Components (examples)

- `IssueTable`
- `IssueFilters`
- `IssueStatusBadge`
- `IssueForm`
- `CommentList`
- `CommentForm`
- `StatusSummaryBar`
- `ChartIssuesByProject` (consumes `/api/stats/issues-by-project`)

---

## Non-Functional Behavior

- **Responsiveness**
  - Mobile: filters stack vertically, table becomes cards.
  - Desktop: filters in a horizontal bar, table layout.

- **Error Handling**
  - Global API error toaster/banner for failed requests.
  - Per-view states:
    - Loading spinners.
    - “No issues found” empty state with guidance.
    - Clear messages when the backend or AI endpoints are down.

- **Logging & Observability (backend)**
  - Log key events (issue created, status changed, AI call error) using Python logging.
  - Avoid leaking sensitive info (e.g. API keys) in logs.

---

## What I Would Improve with More Time

- **Authentication & Authorization**
  - Basic login.
  - Role-based access (e.g. only certain users can close issues).

- **Move SQLite → Postgres**
  - For concurrency and durability in a production environment.

- **More Robust AI**
  - Use embeddings for more accurate duplicate detection.
  - Cache AI results for triage suggestions.
  - Add an “AI summary of issue + comments” on the detail page.

- **Testing**
  - Backend: pytest tests for each endpoint (success + failure cases).
  - Frontend: component tests for form validation and dashboard filters.

- **CI/CD**
  - Automated tests on push.
  - Automatic deployment to a small cloud instance (e.g. Render/Fly.io for FastAPI, Netlify/Vercel for frontend).

