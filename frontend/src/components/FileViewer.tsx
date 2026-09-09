import React, { useState, useEffect } from "react";

interface SpreadsheetData {
  type: "spreadsheet";
  extension: string;
  columns: string[];
  rows: Record<string, any>[];
}

interface TextData {
  type: "text";
  extension: string;
  content: string;
}

interface MediaData {
  type: "media" | "image";
  extension: string;
  stream_url: string;
}

interface UnsupportedData {
  type: "unsupported";
  extension: string;
  message: string;
}

type FilePreviewResponse = SpreadsheetData | TextData | MediaData | UnsupportedData;

interface FileViewerProps {
  filePath: string;
}

export const FileViewer: React.FC<FileViewerProps> = ({ filePath }) => {
  const [data, setData] = useState<FilePreviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath.trim()) return;

    setLoading(true);
    setError(null);
    setLocalMediaUrl(null);

    fetch(`http://127.0.0.1:8000/api/file/preview?path=${encodeURIComponent(filePath.trim())}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || `Server returned error status ${res.status}`);
        }
        return res.json();
      })
      .then((resData: FilePreviewResponse) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message === "Failed to fetch" 
          ? "Cannot connect to server. Run 'python main.py' in backend terminal." 
          : err.message);
        setLoading(false);
      });
  }, [filePath]);

  // Drag-and-drop media handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const blobUrl = URL.createObjectURL(file);
      const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

      if ([".mp3", ".wav", ".ogg", ".mp4", ".mkv", ".webm", ".png", ".jpg", ".jpeg"].includes(ext)) {
        setLocalMediaUrl(blobUrl);
        setData({
          type: [".png", ".jpg", ".jpeg"].includes(ext) ? "image" : "media",
          extension: ext,
          stream_url: blobUrl,
        });
      }
    }
  };

  if (loading) return <div className="p-4 text-gray-500 font-mono">Loading file contents...</div>;
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-300 text-red-600 rounded-md">
        <p className="font-semibold">Error:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  if (!data) return <div className="p-4 text-gray-400">Enter a relative or absolute path above to search and preview.</div>;

  const currentMediaSrc = localMediaUrl || (data.type === "media" || data.type === "image" ? data.stream_url : "");

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-4 border-2 rounded-lg transition-colors ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* 1. Image Component */}
      {data.type === "image" && (
        <div className="flex flex-col items-center gap-2">
          <img src={currentMediaSrc} alt="Preview" className="max-h-[500px] object-contain rounded border" />
          <span className="text-xs text-gray-400">Drag & drop an image here to replace preview</span>
        </div>
      )}

      {/* 2. Audio Component */}
      {data.type === "media" && [".mp3", ".wav", ".ogg", ".aac"].includes(data.extension) && (
        <div className="flex flex-col items-center gap-4 py-6">
          <span className="text-sm font-semibold text-gray-700">Audio Player ({data.extension})</span>
          <audio controls className="w-full max-w-md">
            <source src={currentMediaSrc} />
            Your browser does not support audio playback.
          </audio>
          <span className="text-xs text-gray-400">Drag & drop an audio file here to play</span>
        </div>
      )}

      {/* 3. Video Component */}
      {data.type === "media" && [".mkv", ".mp4", ".webm"].includes(data.extension) && (
        <div className="flex flex-col items-center gap-2">
          <video controls className="w-full max-h-[500px] rounded bg-black">
            <source src={currentMediaSrc} />
            Your browser does not support video playback for this format.
          </video>
          <span className="text-xs text-gray-400">Drag & drop a video file here to play</span>
        </div>
      )}

      {/* 4. Spreadsheet Component */}
      {data.type === "spreadsheet" && (
        <div className="overflow-x-auto max-h-[500px]">
          <table className="min-w-full text-left text-sm border-collapse border border-gray-300">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {data.columns.map((col, idx) => (
                  <th key={idx} className="border border-gray-300 px-3 py-2 font-semibold text-gray-800">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50">
                  {data.columns.map((col, cIdx) => (
                    <td key={cIdx} className="border border-gray-300 px-3 py-1 text-gray-600">
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Text & Code Viewer */}
      {data.type === "text" && (
        <pre className="p-4 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-x-auto max-h-[500px] whitespace-pre-wrap">
          <code>{data.content}</code>
        </pre>
      )}

      {/* Fallback */}
      {data.type === "unsupported" && (
        <div className="p-6 text-center text-gray-500">
          Cannot preview <b>{data.extension}</b> files directly.
        </div>
      )}
    </div>
  );
};