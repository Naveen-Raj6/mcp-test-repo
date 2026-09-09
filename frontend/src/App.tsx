import React, { useState } from "react";
import { FileViewer } from "./components/FileViewer";

export const App: React.FC = () => {
  const [filePath, setFilePath] = useState<string>("sample.py");
  const [activePath, setActivePath] = useState<string>("sample.py");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePath(filePath);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Local File Inspector</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Enter file path (e.g. test.xlsx, song.mp3, video.mkv, script.py)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
        >
          Load File
        </button>
      </form>

      <FileViewer filePath={activePath} />
    </div>
  );
};

export default App;