import { useEffect, useMemo, useState } from "react";
import { NoteAPI } from "../services/api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #0a0a0a;
    --dark: #111111;
    --card: #161616;
    --border: #1f1f1f;
    --lime: #c6f135;
    --lime-dim: #a8d420;
    --lime-glow: rgba(198, 241, 53, 0.12);
    --lime-glow-strong: rgba(198, 241, 53, 0.22);
    --text: #e8e8e8;
    --muted: #555;
    --muted2: #333;
  }

  body {
    background: var(--black);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    min-height: 100vh;
  }

  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* SIDEBAR */
  .sidebar {
    width: 300px;
    min-width: 300px;
    background: var(--dark);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 28px 20px 20px;
    border-bottom: 1px solid var(--border);
  }

  .app-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--lime);
    text-transform: uppercase;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .app-label::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    background: var(--lime);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--lime);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--lime); }
    50% { opacity: 0.5; box-shadow: 0 0 3px var(--lime); }
  }

  .create-btn {
    width: 100%;
    background: var(--lime);
    color: var(--black);
    border: none;
    padding: 12px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.15s ease;
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
  }

  .create-btn:hover {
    background: #d4ff3d;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(198, 241, 53, 0.35);
  }

  .create-btn:active { transform: translateY(0); }

  .create-btn svg { width: 14px; height: 14px; }

  .search-wrap {
    position: relative;
    margin-top: 14px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
    line-height: 1;
  }

  .search-input {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--text);
    outline: none;
    padding: 10px 34px 10px 34px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-input:focus {
    border-color: rgba(198, 241, 53, 0.45);
    box-shadow: 0 0 0 3px var(--lime-glow);
  }

  .search-input::placeholder { color: var(--muted); }

  .search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
  }

  .search-clear:hover { color: var(--lime); }

  .notes-count {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    padding: 14px 20px 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .notes-list::-webkit-scrollbar { width: 3px; }
  .notes-list::-webkit-scrollbar-thumb { background: var(--muted2); }
  .notes-list::-webkit-scrollbar-track { background: transparent; }

  .note-item {
    padding: 14px 20px;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: all 0.15s ease;
    position: relative;
  }

  .note-item:hover {
    background: var(--lime-glow);
    border-left-color: rgba(198, 241, 53, 0.4);
  }

  .note-item.active {
    background: var(--lime-glow-strong);
    border-left-color: var(--lime);
  }

  .note-item + .note-item {
    border-top: 1px solid var(--border);
  }

  .note-item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .note-item.active .note-item-title {
    color: var(--lime);
  }

  .note-item-preview {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
  }

  .note-item-date {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    margin-top: 6px;
    letter-spacing: 0.05em;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    text-align: center;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    border: 1px dashed var(--muted2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
  }

  .empty-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .empty-sub {
    font-size: 12px;
    color: var(--muted2);
    line-height: 1.6;
  }

  /* EDITOR */
  .editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--black);
    overflow: hidden;
  }

  .editor-topbar {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 69px;
  }

  .editor-meta {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .editor-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .save-btn {
    background: var(--lime);
    color: var(--black);
    border: none;
    padding: 9px 20px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.15s ease;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
  }

  .save-btn:hover {
    background: #d4ff3d;
    box-shadow: 0 0 20px rgba(198, 241, 53, 0.4);
  }

  .save-btn.saved {
    background: transparent;
    border: 1px solid var(--lime);
    color: var(--lime);
    clip-path: none;
  }

  .delete-btn {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--muted2);
    padding: 9px 14px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
  }

  .delete-btn:hover {
    border-color: #ff4444;
    color: #ff4444;
    background: rgba(255, 68, 68, 0.08);
  }

  .editor-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 32px;
    overflow: hidden;
    gap: 0;
  }

  .title-input {
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Space Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    color: var(--lime);
    width: 100%;
    padding: 0 0 16px 0;
    border-bottom: 1px solid var(--border);
    caret-color: var(--lime);
    transition: border-color 0.2s;
    letter-spacing: -0.01em;
  }

  .title-input::placeholder { color: var(--muted2); }
  .title-input:focus { border-bottom-color: var(--lime); }

  .text-area {
    background: transparent;
    border: none;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 300;
    color: var(--text);
    width: 100%;
    flex: 1;
    resize: none;
    padding: 20px 0;
    line-height: 1.8;
    caret-color: var(--lime);
  }

  .text-area::placeholder { color: var(--muted2); }

  /* Welcome/no-selection state */
  .welcome-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px;
    text-align: center;
  }

  .welcome-glyph {
    font-family: 'Space Mono', monospace;
    font-size: 48px;
    color: var(--lime);
    opacity: 0.15;
    line-height: 1;
  }

  .welcome-title {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: var(--muted);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .welcome-sub {
    font-size: 13px;
    color: var(--muted2);
    max-width: 280px;
    line-height: 1.7;
  }

  .saved-flash {
    animation: flashIn 0.3s ease;
  }

  @keyframes flashIn {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }

  .char-count {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    letter-spacing: 0.1em;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
`;

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
};

const mapApiNote = (note: any): Note => ({
  id: String(note.id),
  title: note.title || "Untitled",
  content: note.content || "",
  updatedAt: new Date(note.updatedAt || note.updated_at || Date.now()),
});

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NoteSystem() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const selectedNote = notes.find((n) => n.id === selectedId);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter((note) =>
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  useEffect(() => {
    let mounted = true;

    NoteAPI.list()
      .then((response) => {
        if (!mounted) return;
        const loadedNotes = (response.data?.data ?? []).map(mapApiNote);
        setNotes(loadedNotes);
        console.log(`[notes-ui] loaded ${loadedNotes.length} note(s)`);

        if (loadedNotes.length > 0) {
          openNote(loadedNotes[0]);
        }
      })
      .catch((error) => {
        console.error("[notes-ui] failed to load notes:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function openNote(note: Note) {
    setSelectedId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsDirty(false);
  }

  async function createNote() {
    try {
      const response = await NoteAPI.create({ title: "Untitled", content: "" });
      const newNote = mapApiNote(response.data?.data);
      setNotes((prev) => [newNote, ...prev]);
      openNote(newNote);
      console.log(`[notes-ui] created note ${newNote.id}`);
    } catch (error) {
      console.error("[notes-ui] create failed:", error);
    }
  }

  async function saveNote() {
    if (!selectedId) return;
    try {
      const response = await NoteAPI.update(selectedId, {
        title: editTitle || "Untitled",
        content: editContent,
      });
      const savedNote = mapApiNote(response.data?.data);
      setNotes((prev) =>
        prev.map((n) => n.id === selectedId ? savedNote : n)
      );
      openNote(savedNote);
      setSavedFlash(true);
      console.log(`[notes-ui] saved note ${savedNote.id}`);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (error) {
      console.error("[notes-ui] save failed:", error);
    }
  }

  async function deleteNote() {
    if (!selectedId) return;
    try {
      await NoteAPI.delete(selectedId);
      const remaining = notes.filter((n) => n.id !== selectedId);
      setNotes(remaining);
      console.log(`[notes-ui] deleted note ${selectedId}`);
      if (remaining.length > 0) {
        openNote(remaining[0]);
      } else {
        setSelectedId(null);
        setEditTitle("");
        setEditContent("");
      }
    } catch (error) {
      console.error("[notes-ui] delete failed:", error);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="app-label">Notes System</div>
            <button className="create-btn" onClick={createNote}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="7" y1="1" x2="7" y2="13" />
                <line x1="1" y1="7" x2="13" y2="7" />
              </svg>
              Create Note
            </button>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
              />
              {searchQuery && (
                <button className="search-clear" type="button" onClick={() => setSearchQuery("")}>
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="notes-count">
            {searchQuery
              ? `${filteredNotes.length} result${filteredNotes.length !== 1 ? "s" : ""}`
              : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </div>

          <div className="notes-list">
            {notes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="2" width="14" height="16" rx="1" />
                    <line x1="6" y1="7" x2="14" y2="7" />
                    <line x1="6" y1="10" x2="14" y2="10" />
                    <line x1="6" y1="13" x2="10" y2="13" />
                  </svg>
                </div>
                <div className="empty-title">No notes yet</div>
                <div className="empty-sub">Hit the button above to create your first note.</div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <div className="empty-title">No matches</div>
                <div className="empty-sub">Try a different title or phrase.</div>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`note-item ${selectedId === note.id ? "active" : ""}`}
                  onClick={() => openNote(note)}
                >
                  <div className="note-item-title">{note.title || "Untitled"}</div>
                  <div className="note-item-preview">
                    {note.content?.trim() ? note.content.trim().slice(0, 72) + (note.content.length > 72 ? "…" : "") : "No content"}
                  </div>
                  <div className="note-item-date">{formatDate(note.updatedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EDITOR */}
        <div className="editor-panel">
          {selectedId && selectedNote !== undefined ? (
            <>
              <div className="editor-topbar">
                <div className="editor-meta">
                  {isDirty ? "● Unsaved changes" : `Last saved · ${formatDate(selectedNote?.updatedAt ?? new Date())}`}
                </div>
                <div className="editor-actions">
                  {selectedId && (
                    <button className="delete-btn" onClick={deleteNote} title="Delete note">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <polyline points="2,3 11,3" />
                        <path d="M4.5 3V2h4v1" />
                        <path d="M3 3l.8 8h5.4L10 3" />
                      </svg>
                    </button>
                  )}
                  <button
                    className={`save-btn ${savedFlash ? "saved" : ""}`}
                    onClick={saveNote}
                  >
                    {savedFlash ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1.5,6 4.5,9 10.5,3" />
                        </svg>
                        Saved
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 10.5V8a1 1 0 011-1h6a1 1 0 011 1v2.5" />
                          <path d="M2 10.5h8" />
                          <path d="M4 1.5h4M6 1.5v4.5" />
                        </svg>
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="editor-body">
                <input
                  className="title-input"
                  placeholder="Note title…"
                  value={editTitle}
                  onChange={(e) => { setEditTitle(e.target.value); setIsDirty(true); }}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                />
                <textarea
                  className="text-area"
                  placeholder="Start writing…"
                  value={editContent}
                  onChange={(e) => { setEditContent(e.target.value); setIsDirty(true); }}
                />
                <div className="char-count">
                  {editContent.length} chars · {editContent.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </>
          ) : (
            <div className="welcome-panel">
              <div className="welcome-glyph">✦</div>
              <div className="welcome-title">Nothing selected</div>
              <div className="welcome-sub">
                Pick a note from the list, or create a new one to start writing.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
