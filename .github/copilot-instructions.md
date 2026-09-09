# Project Architectural Guidelines

## Core Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn, Standard Library (`pathlib`, `os`, `shutil`).
- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, Lucide-React icons.

## Software Design Principles (SOLID)

- **Single Responsibility Principle (SRP):** Keep API route handlers, business logic, and file system operations strictly separated.
- **Open/Closed Principle (OCP):** Extend file reader/writer modules to handle new formats without modifying core routing functions.
- **Liskov Substitution Principle (LSP):** Ensure custom error handling classes extend standard HTTP Exceptions predictably.
- **Interface Segregation Principle (ISP):** Keep API request models minimal and modular; avoid bloated payload schemas.
- **Dependency Inversion Principle (DIP):** Pass dependencies (e.g., directory base paths, config settings) explicitly into functions.

## Code Quality & Documentation Rules

- Every Python function MUST include a clear docstring explaining its purpose, arguments, and return types.
- Write inline comments under each core logical block inside functions to explain complex file system operations.
- Enforce strict typing across both Python (Pydantic, type hints) and React (TypeScript interfaces).

## Backend Safety Rules

- Use `pathlib.Path` exclusively for file operations.
- Return explicit HTTP status codes (`400`, `403`, `404`, `500`).
- Handle non-UTF8/binary files safely without crashing.

## Frontend UI Rules

- Use functional TypeScript components.
- Use Tailwind CSS exclusively for styling.
- Provide clean loading, error, and confirmation states for all file overrides.
