import { useState, useEffect, useRef, FC } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

interface UserResult {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

interface Props {
  onClose: () => void;
}

const SearchUsers: FC<Props> = ({ onClose }) => {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/users/search?name=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        const data = await res.json();
        setResults(data.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, session?.access_token]);

  const sendRequest = async (targetUserId: string) => {
    try {
      const res = await fetch(`${API_BASE}/friends/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [targetUserId]: data.message ?? "Failed to send request" }));
        return;
      }

      setSentRequests((prev) => new Set(prev).add(targetUserId));
      setErrors((prev) => { const next = { ...prev }; delete next[targetUserId]; return next; });
    } catch {
      setErrors((prev) => ({ ...prev, [targetUserId]: "Network error" }));
    }
  };

  const getDisplayName = (u: UserResult) =>
    u.full_name || u.username || u.email || "Unknown";

  const getInitials = (u: UserResult) =>
    getDisplayName(u).slice(0, 2).toUpperCase();

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460, maxWidth: "90vw",
          background: "#101010",
          border: "1px solid rgba(200,245,61,0.2)",
          borderRadius: 18, padding: 24,
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: "#e6e6e6" }}>
            Find Friends
          </div>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", color: "#4a4a4a", fontSize: 20, lineHeight: 1 }}
          >✕</div>
        </div>

        {/* Search input */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          style={{
            width: "100%", background: "#161616",
            border: "1px solid #2a2a2a", borderRadius: 10,
            padding: "10px 14px", color: "#e6e6e6",
            fontFamily: "'Outfit', sans-serif", fontSize: 14,
            outline: "none", marginBottom: 16,
          }}
        />

        {/* Results */}
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {searching && (
            <div style={{ color: "#4a4a4a", fontSize: 13, padding: "8px 0" }}>Searching...</div>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <div style={{ color: "#4a4a4a", fontSize: 13, padding: "8px 0" }}>No users found.</div>
          )}
          {results.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "#1a2e1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#c8f53d",
                flexShrink: 0, overflow: "hidden",
              }}>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={getDisplayName(u)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : getInitials(u)
                }
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e6e6e6" }}>
                  {getDisplayName(u)}
                </div>
                {u.username && (
                  <div style={{ fontSize: 11.5, color: "#4a4a4a" }}>@{u.username}</div>
                )}
                {errors[u.id] && (
                  <div style={{ fontSize: 11, color: "#ff5555", marginTop: 2 }}>{errors[u.id]}</div>
                )}
              </div>

              {/* Button */}
              {sentRequests.has(u.id) ? (
                <div style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: "rgba(200,245,61,0.1)",
                  border: "1px solid rgba(200,245,61,0.3)",
                  color: "#c8f53d", fontSize: 12, fontWeight: 600,
                }}>
                  Sent ✓
                </div>
              ) : (
                <button
                  onClick={() => sendRequest(u.id)}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: "#c8f53d", border: "none",
                    color: "#0a0a0a", fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchUsers;