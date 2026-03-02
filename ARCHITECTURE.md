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

+─────────────────────────────────────────────────────────────+
│                    BROWSER (React SPA)                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Dashboard  │  │ Create Issue│  │   Issue Detail      │ │
│  │  (filters,  │  │ + AI Assist │  │ (comments, status)  │ │
│  │   table)    │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
+─────────────────────────────────────────────────────────────+
                          │
                  HTTPS / JSON (REST)
                          │
                          ▼
+─────────────────────────────────────────────────────────────+
│                  FASTAPI BACKEND (/api)                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth & Users │  │  Projects /  │  │  File Uploads    │  │
│  │ /api/users   │  │  Issues /    │  │  (attachments)   │  │
│  │              │  │  Comments    │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  AI Endpoints                        │   │
│  │  /api/ai/parse-issue   → structures free text        │   │
│  │  /api/ai/suggest-triage → priority + assignee        │   │
│  │  /api/ai/find-related  → duplicate detection         │   │
│  └───────────────────────────┬──────────────────────────┘   │
+───────────────────────────── │ ────────────────────────────+
                │              │
                ▼              ▼
+───────────────────+   +──────────────────+
│  SQLite Database  │   │   OpenAI API     │
│                   │   │                  │
│  ├─ project       │   │  (parse, triage, │
│  ├─ user          │   │   suggestions)   │
│  ├─ issue         │   │                  │
│  ├─ comment       │   +──────────────────+
│  └─ attachment    │
+───────────────────+


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

