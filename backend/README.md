# QR Feedback SaaS - Backend

## Prerequisites
- Python 3.9+ installed
- Git installed (optional, for version control)

## Quick Start (Local Development)

This is the recommended way to run the application for development and testing.

### 1. Set up the Virtual Environment
Create an isolated environment for python dependencies to avoid conflicts.

```powershell
# Navigate to the backend directory
cd backend

# Create the virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment
# You will see (venv) at the start of your command prompt after this
.\venv\Scripts\Activate
```

### 2. Install Dependencies
Install all the required Python packages (FastAPI, SQLModel, etc.) listed in `requirements.txt`.

```powershell
pip install -r requirements.txt
```

### 3. Initialize the Database
This script creates the database tables (in `sql_app.db` for local SQLite) and seeds initial data (Admin user, Default Plan, Demo Tenant).

```powershell
python -m app.initial_data
```
*Note: If you see "Initial data created", it worked successfully.*

### 4. Run the Server
Start the development server using Uvicorn. The `--reload` flag ensures the server restarts automatically when you make code changes.

```powershell
uvicorn app.main:app --reload
```

## Verifying it works

Open your browser and navigate to:
- **API Root**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/) (Should show `{"status": "ok"}`)
- **Interactive Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Swagger UI)

## Docker (Alternative)

If you prefer using Docker and Docker Compose (simulates production with PostgreSQL):

```powershell
# Builds and starts the containers
docker-compose up --build
```
