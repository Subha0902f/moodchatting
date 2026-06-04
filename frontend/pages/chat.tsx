import {
  useState,
  useEffect,
  FC,
  useMemo,
} from "react";
import { useAuth } from "../context/AuthContext";
import ChatWithSocket from "../components/ChatWithSocket";
import {

  MODE_META,
  loadModeAssignments,
} from "../services/modeStorage";
import "./theme.css";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ModeKey = "professional" | "fun" | "private" | "relaxment" | "allinone";

interface Contact {
  id: number;
  name: string;
  emoji: string;
  bg: string;
  online: boolean;
  mode: ModeKey;
  lastMsg: string;
  lastTime: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODE_OPTIONS: Array<{ key: ModeKey | "all"; label: string; icon: string }> = [
  { key: "all", label: "All Contacts", icon: "📇" },
  { key: "professional", label: "Professional", icon: "💼" },
  { key: "fun", label: "Fun", icon: "🎉" },
  { key: "private", label: "Private", icon: "🔒" },
  { key: "relaxment", label: "Relaxment", icon: "🌿" },
  { key: "allinone", label: "All-in-One", icon: "⚡" },
];

const CONTACTS: Omit<Contact, "mode">[] = [
  {
    id: 1,
    name: "Aria Nakamura",
    emoji: "🌸",
    bg: "#2a1e0a",
    online: true,
    lastMsg: "Loved your post! Tell me more about that plan.",
    lastTime: "Now",
  },
  {
    id: 2,
    name: "Dev Sharma",
    emoji: "🔥",
    bg: "#0a1e2a",
    online: false,
    lastMsg: "Let's sync tomorrow, I'm free after lunch.",
    lastTime: "11:24",
  },
  {
    id: 3,
    name: "Zoe Ellis",
    emoji: "⚡",
    bg: "#1e0a2a",
    online: true,
    lastMsg: "That concert was wild! Have you seen the highlights?",
    lastTime: "10:07",
  },
  {
    id: 4,
    name: "Kai Watanabe",
    emoji: "🌊",
    bg: "#2a2a0a",
    online: false,
    lastMsg: "I'll send the files this evening.",
    lastTime: "Yesterday",
  },
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

interface AvatarProps { emoji: string; bg?: string; size?: number; online?: boolean; }

const Avatar: FC<AvatarProps> = ({ emoji, bg = "#1a2e1a", size = 36, online = false }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.3),
    flexShrink: 0, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.46, position: "relative",
    border: "1.5px solid rgba(255,255,255,.06)",
  }}>
    {emoji}
    {online && (
      <div style={{
        position: "absolute", bottom: 1, right: 1,
        width: size * 0.22, height: size * 0.22, borderRadius: "50%",
        background: "#c8f53d", border: `1.5px solid ${C.card}`,
      }} />
    )}
  </div>
);

// ─── Mode Badge ────────────────────────────────────────────────────────────────

interface ModeBadgeProps { modeKey: ModeKey; size?: "sm" | "lg"; }

const ModeBadge: FC<ModeBadgeProps> = ({ modeKey, size = "sm" }) => {
  const m = MODE_META[modeKey];
  const big = size === "lg";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: `${m.accent}15`, border: `1px solid ${m.accent}35`,
      color: m.accent, borderRadius: 20,
      padding: big ? "4px 12px" : "3px 8px",
      fontSize: big ? 12 : 10.5, fontWeight: 700, letterSpacing: ".4px", flexShrink: 0,
    }}>
      <span style={{ fontSize: big ? 13 : 11 }}>{m.icon}</span>
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
      <Avatar emoji={contact.emoji} bg={contact.bg} size={42} online={contact.online} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{
            fontSize: 13.5, fontWeight: 600,
            color: active ? "#c8f53d" : C.text,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130,
          }}>{contact.name}</span>
          <span style={{ fontSize: 10, color: C.sub, flexShrink: 0 }}>{contact.lastTime}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {contact.lastMsg}
          </span>
          <ModeBadge modeKey={contact.mode} />
        </div>
      </div>
    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────────

const ChatUI: FC = () => {
  const [activeId, setActiveId] = useState<number>(CONTACTS[0]?.id ?? 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<ModeKey | "all">("all");

  const { user } = useAuth();
  const userId = user?.id ?? 'guest';
  const userName = user?.email ?? 'Guest';

  const modeAssignments = useMemo(() => loadModeAssignments(), []);
  const contactModeMap = useMemo(() => {
    return (Object.keys(modeAssignments) as ModeKey[]).reduce<Record<number, ModeKey[]>>((map, modeKey) => {
      modeAssignments[modeKey].users.forEach((userId) => {
        map[userId] = map[userId] ? [...map[userId], modeKey] : [modeKey];
      });
      return map;
    }, {});
  }, [modeAssignments]);

  const contacts: Contact[] = useMemo(() => CONTACTS.map((contact) => {
    const assignedModes = contactModeMap[contact.id] ?? [];
    return {
      ...contact,
      mode: assignedModes[0] ?? "allinone",
    };
  }), [contactModeMap]);

  const active = contacts.find(c => c.id === activeId) ?? null;

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = selectedMode === "all"
      ? true
      : (contactModeMap[contact.id] ?? []).includes(selectedMode);
    return matchesSearch && matchesMode;
  });

  const selectedModeLabel = selectedMode === "all"
    ? "All Contacts"
    : MODE_META[selectedMode].label;

  const noContactsText = searchTerm
    ? "No contacts match your search"
    : selectedMode !== "all"
      ? `No contacts in ${selectedModeLabel} mode.`
      : "No contacts yet.";

  useEffect(() => {
    if (filteredContacts.length > 0 && !filteredContacts.some(c => c.id === activeId)) {
      setActiveId(filteredContacts[0].id);
    }
  }, [filteredContacts, activeId]);

  const selectContact = (id: number) => {
    setActiveId(id);
  };

  if (!active) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)",
        width: "100%", maxWidth: "100%", minWidth: 0,
        height: "100%", minHeight: 0, background: C.bg,
        fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      }}>
        <div style={{
          background: C.card, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-.2px", marginBottom: 12 }}>
              Mood<span style={{ color: "#c8f53d", textShadow: "0 0 20px rgba(200,245,61,.4)" }}>Chat</span>
            </div>
            <input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "8px 12px", color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, outline: "none",
              }}
            />
          </div>
          {/* Contact list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredContacts.length > 0 ? (
              filteredContacts.map(c => (
                <ChatItem
                  key={c.id}
                  contact={c}
                  active={c.id === activeId}
                  onClick={() => selectContact(c.id)}
                />
              ))
            ) : (
              <div style={{ padding: 18, color: C.sub, fontSize: 13, lineHeight: 1.6 }}>
                {noContactsText}
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", minHeight: 0, background: "#07090f", color: C.sub,
          textAlign: "center", padding: 32,
        }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              No chats to show
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
              Add friends or start a conversation to see chats here.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)",
      width: "100%", maxWidth: "100%", minWidth: 0,
      height: "100%", minHeight: 0, background: C.bg,
      fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
    }}>

      {/* ═══ LEFT PANEL — Contact list ═══ */}
      <div style={{
        background: C.card, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800,
              color: C.text, letterSpacing: "-.2px",
            }}>
              Mood<span style={{ color: "#c8f53d", textShadow: "0 0 20px rgba(200,245,61,.4)" }}>Chat</span>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: C.surface, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, cursor: "pointer", color: C.sub,
            }}>✏️</div>
          </div>

          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.sub, pointerEvents: "none" }}>🔍</span>
            <input
              placeholder="Search conversations…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "8px 12px 8px 32px",
                color: C.text, fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5, outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {MODE_OPTIONS.map((option) => {
              const active = selectedMode === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => setSelectedMode(option.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 12px", borderRadius: 12,
                    border: `1px solid ${active ? "#c8f53d" : C.border}`,
                    background: active ? "rgba(200,245,61,.12)" : C.surface,
                    color: active ? "#c8f53d" : C.text,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all .18s",
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
                  padding: "10px 12px", borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.sub,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredContacts.length > 0 ? (
            filteredContacts.map(c => (
              <ChatItem
                key={c.id}
                contact={c}
                active={c.id === activeId}
                onClick={() => selectContact(c.id)}
              />
            ))
          ) : (
            <div style={{ padding: "18px 16px", color: C.sub, fontSize: 13, textAlign: "center" }}>
              {noContactsText}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Chat area ═══ */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", background: "#07090f", minWidth: 0 }}>
        <ChatWithSocket chatId={active.id.toString()} userId={userId} userName={userName} />
      </div>
    </div>
  );
};

export default ChatUI;
