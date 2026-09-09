import os
import mimetypes
from pathlib import Path
from urllib.parse import quote
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn

app = FastAPI(title="File Manager API")

# Enable CORS for React frontend (Vite/Port 5173 or 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base root directory for file searches
BASE_DIR = Path("C:/Users/NAVEEN RAJ").resolve()


def get_target_path(requested_path: str) -> Path:
    """Resolves relative or absolute path input safely."""
    clean_str = requested_path.strip('"').strip("'")
    path_obj = Path(clean_str)

    if path_obj.is_absolute():
        target_path = path_obj.resolve()
    else:
        target_path = (BASE_DIR / clean_str).resolve()

    if not target_path.exists():
        raise HTTPException(
            status_code=404, detail=f"File not found: '{target_path.name}'"
        )

    return target_path


@app.get("/api/file/raw")
async def get_raw_file(path: str = Query(...)):
    safe_path = get_target_path(path)
    if safe_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is a directory")

    mime_type, _ = mimetypes.guess_type(safe_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=safe_path, media_type=mime_type, filename=safe_path.name
    )


@app.get("/api/file/preview")
async def preview_file_content(path: str = Query(...)):
    safe_path = get_target_path(path)
    ext = safe_path.suffix.lower()

    # 1. Image Files (.png, .jpg, .jpeg, .gif, .svg, .webp)
    if ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]:
        return {
            "type": "image",
            "extension": ext,
            "stream_url": f"http://127.0.0.1:8000/api/file/raw?path={quote(str(safe_path))}",
        }

    # 2. Text & Code files (.txt, .py, .jsx, .tsx, .js, .json, .md, .css, .html)
    elif ext in [
        ".txt",
        ".py",
        ".jsx",
        ".tsx",
        ".js",
        ".json",
        ".md",
        ".css",
        ".html",
    ]:
        try:
            with open(safe_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(50000)
            return {"type": "text", "extension": ext, "content": content}
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Read error: {str(e)}"
            )

    # 3. Excel & CSV Spreadsheets (.xlsx, .xls, .csv)
    elif ext in [".xlsx", ".xls", ".csv"]:
        try:
            df = (
                pd.read_csv(safe_path, nrows=100)
                if ext == ".csv"
                else pd.read_excel(safe_path, nrows=100)
            )
            df = df.fillna("")
            return {
                "type": "spreadsheet",
                "extension": ext,
                "columns": df.columns.tolist(),
                "rows": df.to_dict(orient="records"),
            }
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Excel parse error: {str(e)}"
            )

    # 4. Audio & Video Types (.mp3, .wav, .mkv, .mp4, etc.)
    elif ext in [".mp3", ".wav", ".ogg", ".aac", ".mkv", ".mp4", ".webm"]:
        return {
            "type": "media",
            "extension": ext,
            "stream_url": f"http://127.0.0.1:8000/api/file/raw?path={quote(str(safe_path))}",
        }

    else:
        return {
            "type": "unsupported",
            "extension": ext,
            "message": "Preview unavailable for this format.",
        }


# THIS ENSURES THE SERVER RUNS WHEN YOU DO "python main.py"
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)