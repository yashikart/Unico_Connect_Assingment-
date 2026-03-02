## System Architecture – Block Diagram

### Tech Stack

- **Frontend**: React + TypeScript (SPA) — Screens: Login, Admin Dashboard, Employee Dashboard, New Issue, Issue Detail, Employees, Assignments, History. Communicates with the backend via JSON over HTTP (`/api/...`).
- **Backend**: FastAPI (Python) — exposes REST endpoints for auth, users, projects, issues, comments, AI helpers, and attachments. Handles validation, business rules, AI calls (OpenAI), and file uploads.
- **Database**: SQLite (`issues_v2.db`) accessed via SQLModel / SQLAlchemy — Tables: `project`, `user`, `issue`, `comment`, `attachment`.

---

### High-Level Block Diagram

```
+──────────────────────────────────────────────────────────────────+
│                      BROWSER (React SPA)                         │
│   React + TypeScript │ Vite │ Single-Page Application            │
│                                                                   │
│  Screens:                                                         │
│  Login · Admin Dashboard · Employee Dashboard · New Issue        │
│  Issue Detail · Employees · Assignments · History                │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Dashboard  │  │ Create Issue │  │     Issue Detail        │ │
│  │ (filters,   │  │ + AI Assist  │  │ (comments, status,      │ │
│  │  table)     │  │              │  │  attachments)           │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
+──────────────────────────────────────────────────────────────────+
                            │
              Talks only to backend via JSON over HTTP
                      HTTPS / REST (/api/...)
                            │
                            ▼
+──────────────────────────────────────────────────────────────────+
│                    FASTAPI BACKEND (/api)                         │
│   Python │ FastAPI │ Pydantic validation │ Auto-docs at /docs    │
│   Handles: validation · business rules · AI calls · file uploads │
│                                                                   │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │ Auth & Users  │  │  Projects /    │  │   File Uploads       │ │
│  │ /api/users    │  │  Issues /      │  │   (attachments)      │ │
│  │ /api/auth     │  │  Comments      │  │                      │ │
│  └───────────────┘  └────────────────┘  └──────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     AI Endpoints                           │  │
│  │  /api/ai/parse-issue    → structures free text into fields │  │
│  │  /api/ai/suggest-triage → suggests priority + assignee     │  │
│  │  /api/ai/find-related   → duplicate / related detection    │  │
│  └──────────────────────────────┬─────────────────────────────┘  │
+─────────────────────────────────│────────────────────────────────+
               │                  │
               ▼                  ▼
+─────────────────────+   +──────────────────+
│   SQLite Database   │   │   OpenAI API     │
│   issues_v2.db      │   │                  │
│   SQLModel /        │   │  (parse, triage, │
│   SQLAlchemy ORM    │   │   suggestions)   │
│                     │   │                  │
│   ├─ project        │   +──────────────────+
│   ├─ user           │
│   ├─ issue          │
│   ├─ comment        │
│   └─ attachment     │
+─────────────────────+
```

---

### Data Flow Summary

```
User Action (Browser)
      │
      │  JSON over HTTP (/api/...)
      ▼
FastAPI Backend
      ├──► Validate & process request (Pydantic)
      ├──► Query / write SQLite DB  (SQLModel ORM)
      └──► Call OpenAI API (AI endpoints only)
                │
                ▼
         Return JSON response to Frontend
```
