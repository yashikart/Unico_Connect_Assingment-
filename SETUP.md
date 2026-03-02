# Unico Connect - Complete Setup Guide

## Prerequisites

✅ **Node.js**: v22.21.0 (installed)
✅ **Python**: 3.11.9 (installed)
✅ **PostgreSQL**: 18.1 (installed)
✅ **Git**: Required for GitHub push

## Project Structure

```
Unico Connect/
├── frontend/          # Frontend application
│   ├── node_modules/  # Node.js dependencies
│   └── package.json   # Frontend dependencies
└── backend/           # Backend application
    └── venv/          # Python virtual environment
```

---

## 1. Frontend Setup

### Initialize Frontend Project

Navigate to the frontend folder and choose your framework:

#### Option A: React (Vite - Recommended)
```powershell
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

#### Option B: Next.js
```powershell
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install
```

#### Option C: Vue
```powershell
cd frontend
npm create vue@latest .
npm install
```

#### Option D: Basic Setup (Already initialized)
```powershell
cd frontend
npm install
```

### Start Frontend Development Server

```powershell
cd frontend
npm run dev          # For Vite/Next.js
# or
npm start            # For Create React App
```

### Frontend Environment Variables

Create `.env` file in `frontend/` folder:
```env
VITE_API_URL=http://localhost:8000
# or for Next.js:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 2. Backend Setup

### Activate Python Virtual Environment

**Windows PowerShell:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**
```cmd
cd backend
venv\Scripts\activate.bat
```

### Install Backend Dependencies

#### Option A: FastAPI (Recommended)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv alembic pydantic
```

#### Option B: Django
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv
```

#### Option C: Flask
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install flask flask-cors flask-sqlalchemy flask-migrate psycopg2-binary python-dotenv
```

### Create requirements.txt

After installing packages, create requirements file:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip freeze > requirements.txt
```

### Backend Environment Variables

Create `.env` file in `backend/` folder:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:post@localhost:5432/postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=post

# Application Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ENVIRONMENT=development

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### Start Backend Server

**FastAPI:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Django:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

**Flask:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app.py
# or
flask run
```

---

## 3. PostgreSQL Database Setup

### Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: postgres (or create a new one)
- **Username**: postgres
- **Password**: post

### Test Database Connection

```powershell
$env:PGPASSWORD="post"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT version();"
```

### Create New Database (Optional)

```powershell
$env:PGPASSWORD="post"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE unico_connect;"
```

### Connection String Format

```
postgresql://postgres:post@localhost:5432/postgres
```

### Python Database Connection Example

**Using SQLAlchemy:**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:post@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

**Using psycopg2:**
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="postgres",
    user="postgres",
    password="post"
)
```

---

## 4. Environment Files Setup

### Frontend .env
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### Backend .env
Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:post@localhost:5432/postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=post
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### .gitignore
Ensure `.gitignore` includes:
```
# Environment variables
.env
.env.local
.env.development
.env.production

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## 5. GitHub Setup & Push


https://github.com/yashikart/Unico_Connect_.git

### Initialize Git Repository

```powershell
# In project root
git init
```

### Create .gitignore

Create `.gitignore` in project root:
```
# Environment variables
.env
.env.local
.env.development
.env.production

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/
*.egg-info/
dist/
build/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
.pnpm-debug.log*

# Database
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
logs/

# OS
Thumbs.db
```

### Add Files to Git

```powershell
git add .
git commit -m "Initial commit: Unico Connect project setup"
```

### Connect to GitHub Repository

#### Option A: Create New Repository on GitHub
1. Go to https://github.com/new
2. Create a new repository (don't initialize with README)
3. Copy the repository URL

#### Option B: Use Existing Repository
```powershell
# Add remote (replace with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Or using SSH
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Push to GitHub

```powershell
# Set main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Verify Push

Check your GitHub repository to confirm all files are uploaded.

---

## 6. Quick Start Commands

### Start Development Servers

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Check Services

**PostgreSQL Service:**
```powershell
Get-Service postgresql-x64-18
```

**Test Database:**
```powershell
$env:PGPASSWORD="post"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l"
```

---

## 7. Troubleshooting

### PostgreSQL Connection Issues
- Verify service is running: `Get-Service postgresql-x64-18`
- Check password: Default is `post`
- Verify port: Default is `5432`

### Python Virtual Environment
- Always activate before installing packages: `.\venv\Scripts\Activate.ps1`
- If activation fails, check execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Node.js Issues
- Clear cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -r node_modules && npm install`

### Git Push Issues
- Verify remote: `git remote -v`
- Check authentication: Use Personal Access Token or SSH keys
- Pull before push: `git pull origin main --rebase`

---

## 8. Project Status

✅ Frontend folder created
✅ Backend folder created
✅ Python virtual environment created
✅ PostgreSQL 18.1 installed and configured
✅ Database password: `post`
✅ Git repository ready

---

## Next Steps

1. Choose your frontend framework and initialize
2. Choose your backend framework and install dependencies
3. Set up database models and migrations
4. Create API endpoints
5. Connect frontend to backend
6. Push to GitHub

---

## Support

For issues or questions:
- Check PostgreSQL logs: `C:\Program Files\PostgreSQL\18\data\log\`
- Check service status: `Get-Service postgresql-x64-18`
- Verify installations: `node --version`, `python --version`, `psql --version`
