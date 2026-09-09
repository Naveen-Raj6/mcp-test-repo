# File Explorer

A local file explorer and editor with a React + Vite frontend and FastAPI backend.

## Features

- Search files recursively by name and extension.
- Debounced autocomplete suggestions from the FastAPI backend.
- Open files with a click, double-click, keyboard activation, or the Open button.
- Read text files and safely override them with an automatic `.bak` backup.
- Detect binary and media files and disable direct text editing to prevent corruption.
- Dark glass-inspired interface with responsive layouts and file-type badges.

## Project Layout

- `frontend/`: React, TypeScript, Vite, and Lucide UI.
- `backend/`: FastAPI file search, suggestions, reading, and override endpoints.

## Run Locally

### Backend

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000`.

## Security

Local environment files, credentials, dependencies, caches, and build output are excluded from version control. Do not commit secrets or personal access tokens.
