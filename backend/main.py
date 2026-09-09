import os
import shutil
from pathlib import Path
from typing import Annotated, List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Initialize FastAPI app instance
app = FastAPI(title="Local File Explorer & Editor API")

# Configure CORS to allow frontend communication from Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Data Models (Interface Segregation Principle) ---

class FileOverrideRequest(BaseModel):
    """Data model representing a file override request payload."""
    file_path: str = Field(..., description="Absolute path to target file")
    content: str = Field(..., description="New string content to write into file")


class SuggestionItem(BaseModel):
    """Small autocomplete result returned while a user is typing."""
    name: str
    path: str
    type: str
    extension: Optional[str] = None


# --- File System Service Layer (Single Responsibility Principle) ---

class FileSystemService:
    """Service class encapsulating low-level file system operations."""

    @staticmethod
    def search_directory(
        root_path: str,
        query: Optional[str] = None,
        extension: Optional[str] = None,
        is_directory_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Recursively searches local directory for files or folders matching given criteria.
        
        Args:
            root_path (str): Target directory to search.
            query (str, optional): Search term for matching file or directory names.
            extension (str, optional): File extension filter (e.g., 'py', '.json').
            is_directory_only (bool): If True, returns directories only.
            
        Returns:
            List[Dict[str, Any]]: Array of metadata dictionaries for matched items.
        """
        base_dir = Path(root_path).expanduser().resolve()

        # Validate path existence
        if not base_dir.exists() or not base_dir.is_dir():
            raise ValueError("Invalid or non-existent root directory.")

        results = []

        # Format extension filter if supplied
        target_ext = None
        if extension:
            target_ext = extension if extension.startswith(".") else f".{extension}"

        # Traverse directory tree
        try:
            for root, dirs, files in os.walk(base_dir):
                current_root = Path(root)

                # Process directories if directory filter active
                if is_directory_only:
                    for d in dirs:
                        if not query or query.lower() in d.lower():
                            results.append({
                                "name": d,
                                "path": str(current_root / d),
                                "type": "directory"
                            })
                    continue

                # Process files
                for f in files:
                    file_path = current_root / f

                    # Apply extension filter check
                    if target_ext and file_path.suffix.lower() != target_ext.lower():
                        continue

                    # Apply name search query check
                    if query and query.lower() not in f.lower():
                        continue

                    # Collect metadata
                    results.append({
                        "name": f,
                        "path": str(file_path),
                        "type": "file",
                        "extension": file_path.suffix,
                        "size": file_path.stat().st_size
                    })

                    # Safety cap to prevent UI freeze on large file trees
                    if len(results) >= 500:
                        break

        except PermissionError:
            # Gracefully handle restricted directories
            pass

        return results

    @staticmethod
    def suggest_paths(root_path: str, query: str, limit: int = 8) -> List[SuggestionItem]:
        """Return a bounded list of name matches for lightweight autocomplete."""
        # Step 1: Resolve and validate the directory once before walking it.
        base_dir = Path(root_path).expanduser().resolve()
        if not base_dir.exists() or not base_dir.is_dir():
            raise ValueError("Invalid or non-existent root directory.")
        # Step 2: Normalize the term so matching is case-insensitive.
        normalized_query = query.strip().lower()
        if not normalized_query:
            return []
        suggestions: List[SuggestionItem] = []
        # Step 3: Walk until the small response cap is reached.
        try:
            for current_root, directories, files in os.walk(base_dir):
                entries = [(name, "directory", None) for name in directories]
                entries.extend((name, "file", Path(name).suffix or None) for name in files)
                for name, item_type, extension in entries:
                    if normalized_query not in name.lower():
                        continue
                    suggestions.append(SuggestionItem(name=name, path=str(Path(current_root) / name), type=item_type, extension=extension))
                    if len(suggestions) >= limit:
                        return suggestions
        except PermissionError:
            # Step 4: Ignore inaccessible branches and keep useful matches.
            pass
        # Step 5: Return the compact response in discovery order.
        return suggestions

    @staticmethod
    def read_file_contents(path_str: str) -> Dict[str, Any]:
        """
        Reads string contents of a file safely, handling UTF-8 and binary formats.
        
        Args:
            path_str (str): Path of file to read.
            
        Returns:
            Dict[str, Any]: File content payload with binary flag.
        """
        target = Path(path_str).resolve()

        if not target.exists() or not target.is_file():
            raise FileNotFoundError("File not found or is a directory.")

        try:
            # Attempt plain text UTF-8 read
            content = target.read_text(encoding="utf-8")
            return {"path": str(target), "is_binary": False, "content": content}
        except UnicodeDecodeError:
            # Fallback for binary or non-text files
            return {
                "path": str(target),
                "is_binary": True,
                "content": f"[Binary File - Cannot display content. Size: {target.stat().st_size} bytes]"
            }

    @staticmethod
    def backup_and_override(file_path_str: str, content: str) -> Dict[str, str]:
        """
        Creates a .bak safety backup and writes new content to target file.
        
        Args:
            file_path_str (str): Target file path to override.
            content (str): New content string.
            
        Returns:
            Dict[str, str]: Confirmation message and backup file location.
        """
        target = Path(file_path_str).resolve()

        if not target.exists():
            raise FileNotFoundError("Target file does not exist.")

        # Create automated backup copy before modification
        backup_path = target.with_suffix(target.suffix + ".bak")
        shutil.copy(target, backup_path)

        # Write updated text contents
        target.write_text(content, encoding="utf-8")

        return {
            "message": "File overridden successfully.",
            "backup_created": str(backup_path)
        }


# --- API Controllers / Handlers ---

@app.get("/api/search")
def search_files_endpoint(
    root_path: str,
    query: Optional[str] = None,
    extension: Optional[str] = None,
    is_directory_only: bool = False
):
    """API Endpoint to trigger recursive file/directory search."""
    try:
        results = FileSystemService.search_directory(
            root_path=root_path,
            query=query,
            extension=extension,
            is_directory_only=is_directory_only
        )
        return {"results": results, "total": len(results)}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@app.get(
    "/api/suggestions",
    response_model=List[SuggestionItem],
    responses={400: {"description": "The root directory is invalid."}},
)
def suggestions_endpoint(
    root_path: str,
    query: Annotated[str, Query(min_length=1, max_length=120)],
    limit: Annotated[int, Query(ge=1, le=20)] = 8,
):
    """Return small, fast autocomplete results for the search input."""
    # Step 1: Delegate filesystem work to the service layer.
    try:
        # Step 2: Keep this controller limited to HTTP concerns.
        return FileSystemService.suggest_paths(root_path, query, limit)
    except ValueError as error:
        # Step 3: Translate invalid user input into a clear client response.
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/api/file/read")
def read_file_endpoint(path: str):
    """API Endpoint to read content from a specified file."""
    try:
        return FileSystemService.read_file_contents(path)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))


@app.post("/api/file/override")
def override_file_endpoint(payload: FileOverrideRequest):
    """API Endpoint to overwrite target file content after creating a backup."""
    try:
        return FileSystemService.backup_and_override(
            file_path_str=payload.file_path,
            content=payload.content
        )
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to override file: {str(e)}")