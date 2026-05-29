import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  FC,
} from "react";
import "./theme.css";
import { useTheme } from "./useTheme";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ModeKey = "professional" | "fun" | "private" | "relaxment" | "allinone";
type MessageSide = "me" | "them";

interface ModeMeta {
  label: string;
  icon: string;
  accent: string;
}

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

interface Message {
  id: number;
  from: MessageSide;
  text: string;
  time: string;
}

type ThreadMap = Record<number, Message[]>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODES: Record<ModeKey, ModeMeta> = {
  professional: { label: "Professional", icon: "💼", accent: "#60a5fa" },
  fun:          { label: "Fun",          icon: "🎉", accent: "#f472b6" },
  private:      { label: "Private",      icon: "🔒", accent: "#a78bfa" },
  relaxment:    { label: "Relaxment",    icon: "🌿", accent: "#4ade80" },
  allinone:     { label: "All-in-One",   icon: "⚡", accent: "#c8f53d" },
};

const MODE_HINTS: Record<ModeKey, string> = {
  professional: "Keep it formal and focused",
  fun:          "Memes, jokes, all good here 🎉",
  private:      "This conversation is private 🔒",
  relaxment:    "Low-key, no pressure vibes 🌿",
  allinone:     "Everyone in this mode can see this chat",
};

const CONTACTS: Contact[] = [];

const SEED_THREADS: ThreadMap = {};

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
  const m = MODES[modeKey];
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

// ─── Message Bubble ────────────────────────────────────────────────────────────

interface BubbleProps { msg: Message; accent: string; }

const Bubble: FC<BubbleProps> = ({ msg, accent }) => {
  const sent = msg.from === "me";
  return (
    <div style={{ display: "flex", justifyContent: sent ? "flex-end" : "flex-start", marginBottom: 6 }}>
      <div style={{ maxWidth: "70%" }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: sent ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: sent ? `linear-gradient(135deg,${accent}ee,${accent}99)` : "#141614",
          border: sent ? "none" : `1px solid ${C.border}`,
          color: sent ? "#060a06" : C.text,
          fontSize: 13.5, lineHeight: 1.5, fontWeight: sent ? 500 : 400,
          boxShadow: sent ? `0 4px 16px ${accent}30` : "none",
        }}>{msg.text}</div>
        <div style={{ fontSize: 10, color: C.sub, marginTop: 3, textAlign: sent ? "right" : "left" }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────────

const ChatUI: FC = () => {
  const [activeId, setActiveId] = useState<number>(1);
  const [threads, setThreads] = useState<ThreadMap>(SEED_THREADS);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useTheme();

  const active = CONTACTS.find(c => c.id === activeId) ?? null;
  const mode   = active ? MODES[active.mode] : MODES.allinone;
  const thread = threads[activeId] ?? [];

  // Scroll to bottom on new messages or contact change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, activeId]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const newMsg: Message = {
      id: Date.now(),
      from: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setThreads(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, activeId]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const selectContact = (id: number) => {
    setActiveId(id);
    setTimeout(() => inputRef.current?.focus(), 100);
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
              disabled
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "8px 12px", color: C.sub,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, outline: "none",
              }}
            />
          </div>
          <div style={{ padding: 18, color: C.sub, fontSize: 13, lineHeight: 1.6 }}>
            No conversations yet.
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
          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.sub, pointerEvents: "none" }}>🔍</span>
            <input
              placeholder="Search conversations…"
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "8px 12px 8px 32px",
                color: C.text, fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5, outline: "none",
              }}
            />
          </div>
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {CONTACTS.map(c => (
            <ChatItem
              key={c.id}
              contact={c}
              active={c.id === activeId}
              onClick={() => selectContact(c.id)}
            />
          ))}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Chat area ═══ */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", background: "#07090f", position: "relative", minWidth: 0 }}>

        {/* Subtle bg grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(rgba(200,245,61,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,61,.015) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* Chat header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 22px", borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          background: "rgba(13,15,13,.95)", backdropFilter: "blur(10px)",
          zIndex: 10, position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,.4)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar emoji={active.emoji} bg={active.bg} size={42} online={active.online} />
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: ".2px" }}>
                {active.name}
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
                {active.online ? "● Active now" : "● Last seen recently"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ModeBadge modeKey={active.mode} size="lg" />
            {["📞", "📹", "⋯"].map(ic => (
              <div key={ic} style={{
                width: 34, height: 34, borderRadius: 9,
                background: C.surface, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, cursor: "pointer", color: C.sub, transition: "all .15s",
              }}>
                {ic}
              </div>
            ))}
          </div>
        </div>

        {/* Mode context banner */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 22px",
          background: `${mode.accent}08`,
          borderBottom: `1px solid ${mode.accent}25`,
          flexShrink: 0, zIndex: 9, position: "relative",
        }}>
          <span style={{ fontSize: 13 }}>{mode.icon}</span>
          <span style={{ fontSize: 11.5, color: mode.accent, fontWeight: 600, letterSpacing: ".3px" }}>
            {mode.label} Mode
          </span>
          <span style={{ fontSize: 11, color: C.sub, marginLeft: 4 }}>
            — {MODE_HINTS[active.mode]}
          </span>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", zIndex: 1, position: "relative" }}>
          {/* Date divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 10.5, color: C.sub, letterSpacing: ".8px", textTransform: "uppercase" }}>Today</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          {thread.map(msg => (
            <Bubble key={msg.id} msg={msg} accent={mode.accent} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: "12px 18px 16px", borderTop: `1px solid ${C.border}`,
          flexShrink: 0, background: "rgba(13,15,13,.97)",
          backdropFilter: "blur(10px)", zIndex: 10, position: "relative",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 16, padding: "8px 8px 8px 16px",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${active.name}…`}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", color: C.text,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
                resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                paddingTop: 4,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, paddingBottom: 2 }}>
              <button style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 18, color: C.sub, padding: 4,
              }}>😊</button>
              <button
                onClick={send}
                disabled={!input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: 11, border: "none",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  background: input.trim()
                    ? `linear-gradient(135deg,${mode.accent},${mode.accent}bb)`
                    : "#1b1d1b",
                  color: input.trim() ? "#060a06" : "#3a3d3a",
                  fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .2s",
                  boxShadow: input.trim() ? `0 4px 14px ${mode.accent}40` : "none",
                }}
              >➤</button>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "#3a3d3a", marginTop: 6, letterSpacing: ".3px" }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
