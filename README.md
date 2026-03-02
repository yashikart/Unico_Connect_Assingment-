# 🔗 Unico Connect — Issue Tracker

> An internal **Issue Tracker** for a small consulting firm (~15 users, 4 projects).  
> Built with **FastAPI + React + TypeScript**, featuring **AI-assisted issue management**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [AI Integration](#ai-integration)
- [Data Model](#data-model)

---

## Overview

Unico Connect is a full-stack issue tracking application designed to be **simple, fast to build, and production-ready**. It allows teams to create, assign, and track issues across multiple projects — with built-in AI assistance for parsing and triaging issues.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (SPA via Vite) |
| Backend | FastAPI (Python) |
| Database | SQLite (`issues_v2.db`) |
| ORM | SQLModel / SQLAlchemy |
| AI | OpenAI API (server-side) |

---

## Project Structure

```
Unico_Connect_Assingment-/
│
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point
│   ├── models.py             # SQLModel / DB models
│   ├── routes/               # API route handlers
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── issues.py
│   │   ├── projects.py
│   │   ├── comments.py
│   │   └── ai.py
│   └── database.py           # DB connection & session
│
├── frontend/                 # React + TypeScript SPA
│   ├── src/
│   │   ├── pages/            # Login, Dashboard, Issue Detail, etc.
│   │   ├── components/       # Reusable UI components
│   │   └── api/              # HTTP client (/api/...)
│   └── package.json
│
├── Architecture.md           # Detailed architecture notes
├── SAMPLE_ISSUES.md          # Sample issue data
├── requirements.txt          # Python dependencies
└── README.md
```

---

## Architecture

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

## Features

### Core
- 🗂 **Project Management** — Organize issues across multiple projects
- 🐛 **Issue Tracking** — Create, assign, update, and close issues
- 💬 **Comments** — Threaded comments on each issue
- 📎 **Attachments** — File uploads per issue
- 👥 **User Roles** — Admin and Employee dashboards
- 📊 **Stats & Charts** — Issues by project and priority

### AI-Powered
- 🤖 **AI Issue Parsing** — Paste rough text, AI fills the form fields
- 🎯 **AI Triage** — Auto-suggests priority and best assignee
- 🔍 **Duplicate Detection** — Warns when a similar issue already exists

### Frontend Screens
| Screen | Description |
|--------|-------------|
| Login | User authentication |
| Admin Dashboard | All issues, filters, assignments |
| Employee Dashboard | Personal issues and tasks |
| New Issue | Form + AI assist |
| Issue Detail | Full view with comments & status |
| Employees | User management |
| Assignments | View/manage assignments |
| History | Audit trail of changes |

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API Key

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/yashikart/Unico_Connect_Assingment-.git
cd Unico_Connect_Assingment-

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=your_openai_key_here

# Run the backend
cd backend
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Reference

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/issues` | List all issues (supports filters) |
| `POST` | `/api/issues` | Create a new issue |
| `GET` | `/api/issues/{id}` | Get issue details |
| `PATCH` | `/api/issues/{id}` | Update issue |
| `DELETE` | `/api/issues/{id}` | Delete issue |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/issues/{id}/comments` | List comments |
| `POST` | `/api/issues/{id}/comments` | Add a comment |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/parse-issue` | Parse free text into issue fields |
| `POST` | `/api/ai/suggest-triage` | Suggest priority & assignee |
| `POST` | `/api/ai/find-related` | Find duplicate/related issues |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats/issues-by-project` | Count per project |
| `GET` | `/api/stats/issues-by-priority` | Count per priority |
| `GET` | `/api/issues/export` | Export filtered issues as CSV |

---

## AI Integration

All AI functionality runs **server-side** — no API keys in the browser.

### Parse Issue (Free Text → Form Fields)

```json
POST /api/ai/parse-issue
{
  "free_text": "Login fails for Project Alpha when the password is wrong, it's urgent, assign to John."
}
```

Returns structured fields: `title`, `description`, `project_name`, `priority`, `status`, `assignee_name`

### Suggest Triage

```json
POST /api/ai/suggest-triage
{
  "title": "Crash on export to CSV",
  "description": "App crashes when exporting for Project Beta.",
  "project_id": "PROJECT_BETA_ID"
}
```

Returns: `priority`, `assignee_id`, `rationale`

---

## Data Model

```
Project ──< Issue ──< Comment
              │
              └──< Attachment

User ──< Issue (as assignee)
User ──< Comment (as author)
```

### Issue Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Primary key |
| `title` | string | Issue title |
| `description` | text | Full description |
| `project_id` | FK | Linked project |
| `priority` | enum | LOW / MEDIUM / HIGH / CRITICAL |
| `status` | enum | OPEN / IN_PROGRESS / RESOLVED / CLOSED |
| `assignee_id` | FK | Assigned user (nullable) |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## Author

**Yashika** — [github.com/yashikart](https://github.com/yashikart)
