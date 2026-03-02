# AI Prompt History - Unico Connect Issue Tracker

This document tracks the key prompts and requests that shaped the development of this full-stack Issue Tracker application.

---

## Initial Project Setup

**Prompt:**
> "Build a full-stack Issue Tracker from scratch in 3 hours. Frontend and backend required. Core features: Issue creation form, Dashboard with filters, Issue detail view, REST API, Database with seed data. Bonus: Real-time updates, CSV export, charts, dark mode, Kanban board."

**Outcome:** Established the project scope and requirements. Created architecture documentation, build plan, and initial tech stack (FastAPI + React + SQLite).

---

## Backend Framework Selection

**Prompt:**
> "Can I use FastAPI for backend?"

**Outcome:** Confirmed FastAPI as the backend framework. Set up FastAPI with SQLModel, Pydantic schemas, and REST API endpoints.

---

## AI Integration Planning

**Prompt:**
> "Go with FastAPI, create md files a plan, with tells me AI integrated"

**Outcome:** Created `BUILD_PLAN.md` and `ARCHITECTURE.md` documenting AI integration points:
- AI-assisted issue parsing (`POST /api/ai/parse-issue`)
- AI triage suggestions (`POST /api/ai/suggest-triage`)

---

## Phase 1 & 2: Database & Core API

**Prompt:**
> "@BUILD_PLAN.md (31-79) do this" (Phase 1: Database & Models, Phase 2: Core REST API)

**Outcome:** 
- Implemented SQLModel models: `Project`, `User`, `Issue`, `Comment`, `Attachment`
- Created REST endpoints: `/api/projects`, `/api/users`, `/api/issues`, `/api/auth/login`
- Set up database seeding with projects and users

---

## Phase 3: Frontend Core

**Prompt:**
> "@BUILD_PLAN.md (83-111) now create" (Phase 3: Frontend Core)

**Outcome:**
- Built React dashboard with filters (project, priority, status, assignee, search)
- Created issue creation form
- Implemented issue detail view with comments
- Added status counts and basic UI

---

## UI/UX Redesign

**Prompt:**
> "I don't like THE DASHBOARD. CREATE CREATIVES, USE ATTRACTIVE DESIGN, A NICE THEME COLOR, WITH A TOUCH OF PROFESSIONAL THEME, AND THE LOGO THAT I HAVE SHARED, CREATE SIDE NAVIGATOR, USES GRAPH TO SHOW THE COUNTS, NICE INFOGRAPHICS WILL BE NICE"

**Outcome:**
- Redesigned dashboard with professional theme matching logo colors
- Added sidebar navigation with logo
- Implemented stats cards and status charts (Recharts)
- Improved filter layout and visual hierarchy

---

## Authentication & Role-Based Access

**Prompt:**
> "SO IN DATABASES MAKE ADMIN that have this http://localhost:5173/ and create login so employee can submit the Issue creation form, and can see the tracking"

**Outcome:**
- Implemented login system with email/password (SHA-256 hashing)
- Added role-based access: `ADMIN` and `EMPLOYEE`
- Created separate dashboards for admin and employees
- Employees can submit issues; admins manage everything

---

## Notification System

**Prompt:**
> "Create notification bell for new issues created by employees"

**Outcome:**
- Added notification bell for admins showing new issues (last 24h)
- Implemented notification dropdown with issue list
- Added "mark as read" functionality
- Created employee notifications for admin updates on assigned issues

---

## Employee Management

**Prompt:**
> "Create new login for employee" and "add Delete users options and edit too"

**Outcome:**
- Created "Employees" view for admins
- Added tabs: "Existing Users" and "Create New Employee Login"
- Implemented full CRUD: Create, Read, Update, Delete users
- Added success popups and form validation

---

## Employee Dashboard

**Prompt:**
> "For Employee create another dashboard" and "add notifications whatever updates comes from admin"

**Outcome:**
- Built separate employee dashboard showing only their assigned issues
- Added employee notification bell for admin updates
- Simplified issue creation form for employees (auto-assigns to them)

---

## Priority Alerts & Filters

**Prompt:**
> "Show here high cases notifications or Priority case" and "add filter based on Priority"

**Outcome:**
- Added priority column to All Issues table with color-coded badges
- Implemented priority alert banners (Critical/High) in dashboard header
- Added priority filter dropdown in All Issues table
- Made All Issues table read-only (no inline editing)

---

## File Attachments & Comments

**Prompt:**
> "Comments and old comments or chats can view here, even user can see and comment on that, this not be deleted or edited, user can share any files like image pdf etc etc and admin can views that"

**Outcome:**
- Enhanced comment system: full history visible, no edit/delete
- Implemented file upload endpoint (`POST /api/issues/{id}/attachments`)
- Added attachment display in issue detail view
- Combined comment form and file upload in single row
- Files stored in `/uploads` directory, served via FastAPI static files

---

## AI Features Implementation

**Prompt:**
> "@BUILD_PLAN.md (119-146) please implement this" (Feature A: AI-Assisted Issue Parsing, Feature B: AI Triage Suggestions)

**Outcome:**
- Implemented `POST /api/ai/parse-issue` - converts free text to structured issue fields
- Implemented `POST /api/ai/suggest-triage` - suggests priority and assignee
- Added AI buttons in employee issue creation form
- Integrated OpenAI API (with fallback for missing API key)
- Fixed OpenAI SDK compatibility (v1.x client vs legacy)

---

## History View

**Prompt:**
> "Create history of issues and shows its active or not add comment so user can sees"

**Outcome:**
- Added "History" navigation item in sidebar
- Created History view showing all issues (admin) or assigned issues (employee)
- Added "Active?" column (Active = OPEN/IN_PROGRESS, Closed = RESOLVED/CLOSED)
- Clicking history items opens issue detail with full comment thread

---

## Admin Activity Notifications

**Prompt:**
> "Add notifications or messages comes from admin, add here any chats or comments users sends to admin, show the history"

**Outcome:**
- Enhanced admin notification bell to show employee messages/activity
- Created `GET /api/issues/activity/recent` endpoint
- Notification panel now shows:
  - New issues (last 24h)
  - Recent comments from employees
  - Recent file attachments from employees
- Clickable notifications jump to issue detail

---

## Architecture Documentation

**Prompt:**
> "In architecture write simple frontend backend databases and block diagrams" and "remove unwanted and only put frontend and Backend and creates only a Block diagram"

**Outcome:**
- Simplified `ARCHITECTURE.md` to focus on Frontend/Backend split
- Added clear block diagram showing React SPA → FastAPI → SQLite flow
- Removed excessive detail, kept only essential architecture overview

---

## Key Technical Decisions Made

1. **FastAPI over Flask/Django** - Faster development, automatic docs, type safety
2. **SQLite over Postgres** - Zero-config for timed exercise, easy to migrate later
3. **React SPA** - Modern, component-based, easy to add charts/UI enhancements
4. **AI on Backend** - Keeps API keys secure, allows Postman/cURL testing
5. **Role-Based Dashboards** - Separate views for admin vs employee improve UX
6. **File Attachments** - Stored locally, served via FastAPI static files
7. **Dark Mode** - Implemented with CSS variables and localStorage persistence

---

## Lessons Learned

- **Start with core features, then enhance UI** - Built working API first, then redesigned frontend
- **AI integration should be optional** - App works even if OpenAI API key is missing
- **Role-based views reduce complexity** - Employees see simpler UI, admins get full control
- **Notifications improve workflow** - Real-time-like updates help admins track employee activity
- **File uploads need proper error handling** - Added size limits, clear error messages

---

## Future Improvements (Not Implemented)

- Real-time updates via WebSockets
- Drag-and-drop Kanban board view
- Duplicate issue detection using AI embeddings
- Advanced search with full-text indexing
- Email notifications for issue updates
- JWT-based authentication (currently simple session)
- Migration to PostgreSQL for production
