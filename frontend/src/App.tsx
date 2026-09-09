import React, { useEffect, useState } from 'react';
import { Search, FileText, Folder, Save, AlertTriangle, RefreshCw, ChevronRight, HardDrive, X, ExternalLink } from 'lucide-react';
import './App.css';

interface SearchResult {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
}

type Suggestion = SearchResult;
const BINARY_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.zip', '.7z', '.png', '.jpg', '.jpeg', '.gif', '.pdf']);

function isBinaryFile(item: SearchResult) {
  return Boolean(item.extension && BINARY_EXTENSIONS.has(item.extension.toLowerCase()));
}

export default function App() {
  const [rootPath, setRootPath] = useState('');
  const [query, setQuery] = useState('');
  const [extension, setExtension] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isBinary, setIsBinary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  useEffect(() => {
    if (!rootPath.trim() || !query.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const params = new URLSearchParams({ root_path: rootPath, query, limit: '8' });
        const response = await fetch(`http://localhost:8000/api/suggestions?${params}`);
        if (!response.ok) throw new Error('Suggestion request failed');
        setSuggestions(await response.json());
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [rootPath, query]);

  const handleSearch = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!rootPath) return alert('Please enter a root directory path');
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        root_path: rootPath,
        query,
        extension
      });
      const res = await fetch(`http://localhost:8000/api/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      // Surface connection failures without exposing filesystem details in the UI.
      alert('Search failed. Ensure Python server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleReadFile = async (path: string) => {
    setSelectedFile(path);
    try {
      const res = await fetch(`http://localhost:8000/api/file/read?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setFileContent(data.content);
      setIsBinary(data.is_binary);
    } catch {
      // Keep the editor stable when a selected file disappears between searches.
      alert('Error reading file content');
    }
  };

  const chooseSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
  };

  const handleOverrideFile = async () => {
    if (!selectedFile) return;
    if (!confirm('Warning: This will overwrite the file content on your disk! Continue?')) return;

    try {
      const res = await fetch('http://localhost:8000/api/file/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: selectedFile, content: fileContent })
      });
      const data = await res.json();
      setStatusMsg(data.message + ` (Backup: ${data.backup_created})`);
    } catch {
      // The server returns the actionable failure detail during normal operation.
      alert('Failed to override file.');
    }
  };

  return (
    <div className="app-shell">
      {/* Left Sidebar: Controls & Search Results */}
      <div className="sidebar">
        <div className="brand-row"><div className="brand-mark"><HardDrive size={19} /></div><div><p className="eyebrow">WORKSPACE TOOL</p><h1>Local Explorer</h1></div></div>
        <p className="intro">Search, inspect, and safely edit files on your machine.</p>

        <form onSubmit={handleSearch} className="search-panel">
          <input
            type="text"
            placeholder="Directory Path (e.g., C:/Users/Name or /home/user)"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            className="path-input"
          />
          <div className="search-row">
            <div className="search-wrap"><Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search filename..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="query-input"
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
              {showSuggestions && (suggestions.length > 0 || suggestionLoading) && <div className="suggestions-menu">
                {suggestionLoading && <div className="suggestion-muted">Looking for matches...</div>}
                {suggestions.map((suggestion) => <button type="button" className="suggestion-item" key={suggestion.path} onClick={() => chooseSuggestion(suggestion)}>{suggestion.type === 'directory' ? <Folder size={15} className="folder-icon" /> : <FileText size={15} className="file-icon" />}<span><strong>{suggestion.name}</strong><small>{suggestion.path}</small></span><ChevronRight size={14} /></button>)}
              </div>}
            </div>
            <input
              type="text"
              placeholder="Ext (e.g. py, json)"
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="extension-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="search-button"
          >
            {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />} Search
          </button>
        </form>

        {/* Results List */}
        <div className="results-heading"><span>SEARCH RESULTS</span><b>{results.length || '0'}</b></div>
        <div className="results-list">
          {results.length === 0 ? (
            <div className="empty-state"><Search size={21} /><p>No results yet</p><small>Choose a folder and search for a filename.</small></div>
          ) : (
            results.map((item) => (
              <div className="result-shell" key={item.path}>
                <button
                  type="button"
                  onClick={() => item.type === 'file' && handleReadFile(item.path)}
                  onDoubleClick={() => item.type === 'file' && handleReadFile(item.path)}
                  className={`result-item ${selectedFile === item.path ? 'selected' : ''}`}
                >
                  <span className={`type-icon ${item.type}`}>{item.type === 'file' ? <FileText size={15} /> : <Folder size={15} />}</span>
                  <div className="result-copy"><div className="result-name">{item.name}<span className="file-badge">{item.type === 'directory' ? 'DIR' : (item.extension || 'FILE').replace('.', '').toUpperCase()}</span>{item.type === 'file' && isBinaryFile(item) && <span className="binary-badge">BINARY</span>}</div><div className="result-path">{item.path}</div>
                  </div>
                  <ChevronRight size={14} className="result-arrow" />
                </button>
                {item.type === 'file' && <button type="button" className="open-button" title={`Open ${item.name}`} onClick={() => handleReadFile(item.path)}><ExternalLink size={13} /> Open</button>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Area: File Editor / Reader */}
      <main className="editor-area">
        {selectedFile ? (
          <div className="editor-view">
            <div className="editor-header">
              <div>
                <p className="eyebrow">OPEN FILE</p><h2>{selectedFile}</h2>
                {statusMsg && <p className="status-message">{statusMsg}</p>}
              </div>
              <button
                onClick={handleOverrideFile}
                disabled={isBinary}
                className="save-button"
              >
                <Save className="w-3.5 h-3.5" /> Save / Override File
              </button>
            </div>

            {isBinary && (
              <div className="binary-notice">
                <AlertTriangle size={17} /><span><strong>Binary / media file</strong><small>Direct text editing is disabled to prevent file corruption.</small></span><X size={15} />
              </div>
            )}

            <textarea
              readOnly={isBinary}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="code-editor"
            />
          </div>
        ) : (
          <div className="welcome-state"><div className="welcome-icon"><Folder size={28} /></div><h2>Ready when you are</h2><p>Select a file from the results to inspect its contents.</p>
          </div>
        )}
      </main>
    </div>
  );
}