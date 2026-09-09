# 📂 Modern Interactive File Explorer & Document Suite

A full-stack, real-time file explorer, media player, code editor, and document viewer application built with **React**, **FastAPI**, **Monaco Editor**, and **Tailwind CSS**.

It allows users to safely search, preview, stream, and edit local machine files across various formats including source code, videos, audios, spreadsheets, images, and documents—all wrapped in a smooth, dark-themed, animated interface powered by **Framer Motion**.

---

## 📸 Key Features

- **⚡ Ultra-Fast Search & Navigation:** Search local workspace files dynamically via relative or absolute filesystem paths without server crashing or traversal locks.
- **💻 VS Code-Grade Editor:** Integrated **Monaco Editor** (`@monaco-editor/react`) for live editing Python, JavaScript, TypeScript, JSON, Markdown, and plain text files with built-in export/save workflows.
- **🎥 Custom Animated Media Player:** Interactive video and audio streaming player supporting `.mp4`, `.webm`, `.mkv`, `.mp3`, `.wav`, and `.ogg` with custom controls and drop-to-play support.
- **📊 Dynamic Spreadsheet Engine:** Parsed preview of `.xlsx`, `.xls`, and `.csv` files using `pandas` and clean sticky-header tabular layouts.
- **🖼️ Rich Image Viewer:** Support for `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, and `.webp` rendering with animated transitions.
- **🔒 CORS-Enabled Backend Routing:** Clean FastAPI routing with `uvicorn` reloader and mime-type detection for raw stream handling.

---

## 🛠️ Tech Stack

### **Frontend**

- **Framework:** React (Vite / TypeScript)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Code Editor:** `@monaco-editor/react` (VS Code engine)
- **Icons:** `lucide-react`

### **Backend**

- **Framework:** FastAPI (Python 3.10+)
- **Server:** Uvicorn
- **Data Processing:** `pandas`, `openpyxl`
- **Path Utilities:** `pathlib`, `mimetypes`

---

## 📁 Project Structure

```text
file-explorer-app/
├── backend/
│   ├── main.py              # FastAPI server with path security & stream endpoints
│   └── requirements.txt     # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── FileViewer.tsx # Modern animated multi-format viewer & Monaco editor
    │   ├── App.tsx          # Main layout and path search bar
    │   └── main.tsx         # React app entry point
    ├── package.json         # Frontend dependencies
    └── tailwind.config.js   # Tailwind CSS configuration
```
