import {
  useState,
  useEffect,
  FC,
  useMemo,
} from "react";
import { useAuth } from "../context/AuthContext";
import ChatWithSocket from "../components/ChatWithSocket";
import { MODE_META, loadModeAssignments } from "../services/modeStorage";
import { FriendAPI } from "../services/api";
import "./theme.css";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ModeKey = "professional" | "fun" | "private" | "relaxment" | "allinone";

interface FriendRecord {
  id: string;
  requesterId: string;  // maps to user_id
  addresseeId: string;  // maps to friend_id
  status: string;
  profile: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

interface Contact {
  friendRecordId: string;
  userId: string;
  name: string;
  avatar: string;
  mode: ModeKey;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODE_OPTIONS: Array<{ key: ModeKey | "all"; label: string; icon: string }> = [
  { key: "all",          label: "All Contacts",  icon: "📇" },
  { key: "professional", label: "Professional",  icon: "💼" },
  { key: "fun",          label: "Fun",           icon: "🎉" },
  { key: "private",      label: "Private",       icon: "🔒" },
  { key: "relaxment",    label: "Relaxment",     icon: "🌿" },
  { key: "allinone",     label: "All-in-One",    icon: "⚡" },
];

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:      "var(--bg)",
  card:    "var(--card)",
  surface: "var(--surface)",
  border:  "var(--border)",
  border2: "var(--border2)",
  text:    "var(--text)",
  sub:     "var(--sub)",
  muted:   "var(--sub2)",
};

// ─── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarProps { name: string; avatarUrl?: string; size?: number; }

const Avatar: FC<AvatarProps> = ({ name, avatarUrl, size = 36 }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.3),
      flexShrink: 0,
      background: avatarUrl ? "transparent" : "#1a2e1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700,
      color: "#c8f53d",
      border: "1.5px solid rgba(255,255,255,.06)",
      overflow: "hidden",
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials
      }
    </div>
  );
};

// ─── Mode Badge ────────────────────────────────────────────────────────────────

const ModeBadge: FC<{ modeKey: ModeKey }> = ({ modeKey }) => {
  const m = MODE_META[modeKey];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: `${m.accent}15`, border: `1px solid ${m.accent}35`,
      color: m.accent, borderRadius: 20,
      padding: "3px 8px",
      fontSize: 10.5, fontWeight: 700, letterSpacing: ".4px", flexShrink: 0,
    }}>
      <span style={{ fontSize: 11 }}>{m.icon}</span>
      {m.label}
    </div>
  );
};

// ─── Contact List Item ─────────────────────────────────────────────────────────

interface ChatItemProps { contact: Contact; active: boolean; onClick: () => void; }

const ChatItem: FC<ChatItemProps> = ({ contact, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "11px 14px", cursor: "pointer",
        background: active ? "#141614" : hov ? "#101210" : "transparent",
        borderLeft: `2px solid ${active ? "#c8f53d" : "transparent"}`,
        borderBottom: `1px solid ${C.border}`,
        transition: "all .15s",
      }}
    >
      <Avatar name={contact.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{
            fontSize: 13.5, fontWeight: 600,
            color: active ? "#c8f53d" : C.text,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130,
          }}>{contact.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <ModeBadge modeKey={contact.mode} />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const ChatUI: FC = () => {
  const { user, session } = useAuth();
  const userId = user?.id ?? "guest";
  const userName = user?.email ?? "Guest";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<ModeKey | "all">("all");

  const modeAssignments = useMemo(() => loadModeAssignments(), []);

  // ── Fetch real friends from backend ──────────────────────────────────────
  useEffect(() => {
    if (!session?.access_token) return;

    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        const friendsRes = await FriendAPI.list();
        const friendRecords: FriendRecord[] = friendsRes.data?.data ?? [];
const transformed = friendRecords
  .map((record) => {
    const otherUserId = record.requesterId === userId
      ? record.addresseeId
      : record.requesterId;
    if (!otherUserId) return null;

    const profile = record.profile;
    const name =
      profile?.full_name ||
      profile?.username ||
      profile?.email ||
      "Unknown";
 return {
      friendRecordId: record.id,
      userId: otherUserId,
      name,
      avatar: profile?.avatar_url ?? "",
      mode: "allinone",
    };
  })
  .filter(Boolean) as Contact[];

        setContacts(transformed);
        
      } catch (err: any) {
        setError(err.message ?? "Failed to load friends");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [session?.access_token, userId, modeAssignments]);

  const activeContact = contacts.find((c) => c.userId === activeId) ?? null;

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = selectedMode === "all" || c.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  // ── Layout wrapper ────────────────────────────────────────────────────────
  const gridLayout: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)",
    width: "100%", maxWidth: "100%", minWidth: 0,
    height: "100%", minHeight: 0, background: C.bg,
    fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
  };

  const leftPanel: React.CSSProperties = {
    background: C.card, borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column",
    height: "100%", minHeight: 0, overflow: "hidden",
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={gridLayout}>
        <div style={leftPanel}>
          <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text }}>
              Mood<span style={{ color: "#c8f53d" }}>Chat</span>
            </div>
          </div>
          <div style={{ padding: 18, color: C.sub, fontSize: 13 }}>Loading friends...</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#07090f", color: C.sub }}>
          Loading...
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={gridLayout}>
        <div style={leftPanel}>
          <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text }}>
              Mood<span style={{ color: "#c8f53d" }}>Chat</span>
            </div>
          </div>
          <div style={{ padding: 18, color: "#ff5555", fontSize: 13 }}>{error}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#07090f", color: C.sub }}>
          Could not load chats.
        </div>
      </div>
    );
  }

  return (
    <div style={gridLayout}>

      {/* ═══ LEFT PANEL ═══ */}
      <div style={leftPanel}>
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-.2px" }}>
              Mood<span style={{ color: "#c8f53d", textShadow: "0 0 20px rgba(200,245,61,.4)" }}>Chat</span>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.sub, pointerEvents: "none" }}>🔍</span>
            <input
              placeholder="Search conversations…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "8px 12px 8px 32px",
                color: C.text, fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5, outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {MODE_OPTIONS.map((option) => {
              const isActive = selectedMode === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => setSelectedMode(option.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 10px", borderRadius: 10,
                    border: `1px solid ${isActive ? "#c8f53d" : C.border}`,
                    background: isActive ? "rgba(200,245,61,.12)" : C.surface,
                    color: isActive ? "#c8f53d" : C.text,
                    fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all .18s",
                  }}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              );
            })}
            {selectedMode !== "all" && (
              <button
                onClick={() => setSelectedMode("all")}
                style={{
                  padding: "6px 10px", borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface, color: C.sub,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredContacts.length > 0 ? (
            filteredContacts.map((c) => (
              <ChatItem
                key={c.userId}
                contact={c}
                active={c.userId === activeId}
                onClick={() => setActiveId(c.userId)}
              />
            ))
          ) : (
            <div style={{ padding: "18px 16px", color: C.sub, fontSize: 13, textAlign: "center" }}>
              {contacts.length === 0
                ? "No friends yet. Add friends to start chatting."
                : "No contacts match your search."}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", background: "#07090f", minWidth: 0 }}>
        {activeContact ? (
         <ChatWithSocket
  chatId={[userId, activeContact.userId].sort().join('_')}
  userId={userId}
  userName={userName}
  contactName={activeContact.name}
/>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.sub, textAlign: "center", padding: 32 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>
                No chats yet
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
                Add friends to start chatting.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatUI;