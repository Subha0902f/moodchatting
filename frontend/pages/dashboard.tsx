import React, { useState, useCallback, useEffect, useRef } from "react";
import "./theme.css";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Friend {
  id: number;
  name: string;
  emoji: string;
  bg: number;
  online: boolean;
  since: string;
}

interface Request {
  id: number;
  name: string;
  emoji: string;
  bg: number;
  mutual: number;
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const INIT_FRIENDS: Friend[] = [
  { id: 1, name: "Aria Nakamura", emoji: "🌸", bg: 0, online: true,  since: "Jan 2024" },
  { id: 2, name: "Dev Sharma",    emoji: "🔥", bg: 1, online: false, since: "Mar 2024" },
  { id: 3, name: "Zoe Ellis",     emoji: "⚡", bg: 2, online: true,  since: "Apr 2024" },
  { id: 4, name: "Kai Watanabe",  emoji: "🌊", bg: 3, online: false, since: "May 2024" },
  { id: 5, name: "Luna Park",     emoji: "🎵", bg: 4, online: true,  since: "Jun 2024" },
];

const INIT_REQUESTS: Request[] = [
  { id: 10, name: "Felix Bauer",  emoji: "🎮", bg: 5, mutual: 3 },
  { id: 11, name: "Mila Russo",   emoji: "✨", bg: 6, mutual: 1 },
  { id: 12, name: "Theo Laurent", emoji: "🌿", bg: 0, mutual: 5 },
];

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

// ─── Design tokens (CSS-in-JS) ─────────────────────────────────────────────────

const C = {
  lime:         "var(--lime)",
  limeDim:      "var(--lime)",
  limeSoft:     "rgba(200,245,61,0.10)",
  limeBorder:   "rgba(200,245,61,0.20)",
  limeGlow:     "rgba(200,245,61,0.06)",
  bg:           "var(--bg)",
  card:         "var(--card)",
  surface:      "var(--surface)",
  surface2:     "var(--card2)",
  border:       "var(--border)",
  border2:      "var(--border2)",
  text:         "var(--text)",
  sub:          "var(--sub)",
  muted:        "var(--sub2)",
  red:          "#ff5252",
  redSoft:      "rgba(255,82,82,0.10)",
  green:        "#4ade80",
  greenSoft:    "rgba(74,222,128,0.10)",
};

// Avatar background gradients indexed 0–6
const AV_BKGS: React.CSSProperties["background"][] = [
  "linear-gradient(135deg,#1a2e1a,#0e1a0e)",
  "linear-gradient(135deg,#2a1e0a,#1a1208)",
  "linear-gradient(135deg,#0a1e2a,#081216)",
  "linear-gradient(135deg,#1e0a2a,#120816)",
  "linear-gradient(135deg,#2a2a0a,#1a1a08)",
  "linear-gradient(135deg,#0a2a1e,#081a12)",
  "linear-gradient(135deg,#2a0a0a,#1a0808)",
];

// ─── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  emoji: string;
  bg?: number;
  online?: boolean;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ emoji, bg = 0, online = false, size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: 11, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.47, position: "relative",
    background: AV_BKGS[bg % AV_BKGS.length] as string,
    border: `1.5px solid ${C.border2}`,
  }}>
    {emoji}
    {online && (
      <div style={{
        position: "absolute", bottom: 2, right: 2,
        width: 8, height: 8, borderRadius: "50%",
        background: C.lime, border: `2px solid ${C.card}`,
      }} />
    )}
  </div>
);

// ─── Toast hook ────────────────────────────────────────────────────────────────

function useToast(): [string, boolean, (msg: string) => void] {
  const [msg, setMsg] = useState("");
  const [vis, setVis] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = useCallback((m: string) => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    setMsg(m);
    setVis(true);
    timer.current = setTimeout(() => setVis(false), 2800);
  }, []);

  return [msg, vis, fire];
}

// ─── Panel wrapper ─────────────────────────────────────────────────────────────

const Panel: React.FC<{
  title: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
  bodyScroll?: boolean;
}> = ({ title, badge, children, bodyScroll = true }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 20, overflow: "hidden",
  }}>
    {/* lime stripe */}
    <div style={{
      height: 2,
      background: `linear-gradient(90deg, transparent, ${C.lime}, transparent)`,
      opacity: 0.45,
    }} />
    {/* header */}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 20px 16px", borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{
        fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
        color: C.text, letterSpacing: "0.4px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {title}
        {badge !== undefined && (
          <span style={{
            background: C.limeSoft, border: `1px solid ${C.limeBorder}`,
            color: C.lime, fontSize: 10, fontWeight: 700,
            padding: "2px 9px", borderRadius: 20, letterSpacing: "0.6px",
          }}>{badge}</span>
        )}
      </span>
    </div>
    {/* body */}
    <div style={{
      padding: 10,
      ...(bodyScroll ? { maxHeight: 360, overflowY: "auto" } : {}),
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      {children}
    </div>
  </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────

const Empty: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div style={{ textAlign: "center", padding: "26px 12px", color: C.sub, fontSize: 13 }}>
    <div style={{ fontSize: 26, marginBottom: 7 }}>{icon}</div>
    {text}
  </div>
);

// ─── Section 1 · Friends ───────────────────────────────────────────────────────

interface FriendsSectionProps {
  friends: Friend[];
  onRemove: (id: number) => void;
}

const FriendsSection: React.FC<FriendsSectionProps> = ({ friends, onRemove }) => (
  <Panel title="👥 Friends" badge={friends.length}>
    {friends.length === 0 ? (
      <Empty icon="🌵" text="No friends yet" />
    ) : (
      friends.map((f) => (
        <div key={f.id} style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "9px 10px", borderRadius: 12,
          background: C.surface, border: `1px solid ${C.border}`,
          transition: "border-color .15s",
        }}>
          <Avatar emoji={f.emoji} bg={f.bg} online={f.online} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.name}
            </div>
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>Since {f.since}</div>
          </div>
          <button
            onClick={() => onRemove(f.id)}
            style={{
              background: "transparent", border: `1px solid ${C.border2}`,
              color: C.sub, borderRadius: 8, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              fontSize: 11, letterSpacing: "0.5px", padding: "6px 12px",
              transition: "all .18s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = C.redSoft;
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.red;
              (e.currentTarget as HTMLButtonElement).style.color = C.red;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.border2;
              (e.currentTarget as HTMLButtonElement).style.color = C.sub;
            }}
          >
            Remove
          </button>
        </div>
      ))
    )}
  </Panel>
);

// ─── Section 2 · Friend Requests ──────────────────────────────────────────────

interface RequestsSectionProps {
  requests: Request[];
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

const RequestsSection: React.FC<RequestsSectionProps> = ({ requests, onAccept, onReject }) => (
  <Panel title="📨 Requests" badge={requests.length > 0 ? requests.length : undefined}>
    {requests.length === 0 ? (
      <Empty icon="✅" text="All caught up!" />
    ) : (
      requests.map((r) => (
        <div key={r.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px", borderRadius: 12,
          background: C.surface, border: `1px solid ${C.border}`,
        }}>
          <Avatar emoji={r.emoji} bg={r.bg} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.name}
            </div>
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{r.mutual} mutual friends</div>
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button
              onClick={() => onAccept(r.id)}
              style={{
                background: C.greenSoft, border: `1px solid rgba(74,222,128,.25)`,
                color: C.green, borderRadius: 8, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                fontSize: 11, letterSpacing: "0.5px", padding: "6px 12px",
              }}
            >Accept</button>
            <button
              onClick={() => onReject(r.id)}
              style={{
                background: "transparent", border: `1px solid ${C.border2}`,
                color: C.sub, borderRadius: 8, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                fontSize: 12, padding: "6px 10px",
              }}
            >✕</button>
          </div>
        </div>
      ))
    )}
  </Panel>
);

// ─── Root App ──────────────────────────────────────────────────────────────────

const FriendsDashboard: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>(() => readStored("moodchat.friends", INIT_FRIENDS));
  const [requests, setRequests] = useState<Request[]>(() => readStored("moodchat.requests", INIT_REQUESTS));
  const [toastMsg, toastVis, fire] = useToast();

  useEffect(() => {
    localStorage.setItem("moodchat.friends", JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem("moodchat.requests", JSON.stringify(requests));
  }, [requests]);

  const removeFriend = (id: number) => {
    const f = friends.find(x => x.id === id);
    setFriends(p => p.filter(x => x.id !== id));
    fire(`Removed ${f?.name}`);
  };

  const acceptRequest = (id: number) => {
    const r = requests.find(x => x.id === id);
    if (!r) return;
    setRequests(p => p.filter(x => x.id !== id));
    setFriends(p => [...p, {
      id: r.id, name: r.name, emoji: r.emoji, bg: r.bg,
      online: Math.random() > 0.5,
      since: new Date().toLocaleDateString("en", { month: "short", year: "numeric" }),
    }]);
    fire(`${r.name} is now your friend 🎉`);
  };

  const rejectRequest = (id: number) => {
    const r = requests.find(x => x.id === id);
    setRequests(p => p.filter(x => x.id !== id));
    fire(`Declined ${r?.name}'s request`);
  };

  return (
    <div style={{ width: "100%", maxWidth: 1240, minWidth: 0, margin: "0 auto", padding: "36px 28px", background: C.bg, minHeight: "100%", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.lime, fontWeight: 600, marginBottom: 6 }}>
          MoodChat · Social
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: "-0.4px", lineHeight: 1 }}>
          People &amp; <span style={{ color: C.lime, textShadow: `0 0 30px rgba(200,245,61,.4)` }}>Connections</span>
        </h1>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>
          Manage friends, respond to requests, and discover new people.
        </p>
      </div>

      {/* 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, alignItems: "start", minWidth: 0 }}>
        <FriendsSection  friends={friends}    onRemove={removeFriend}  />
        <RequestsSection requests={requests}  onAccept={acceptRequest} onReject={rejectRequest} />
      </div>

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: 28, left: "50%",
        transform: `translateX(-50%) translateY(${toastVis ? 0 : 60}px)`,
        background: C.lime, color: "#060a06",
        padding: "10px 24px", borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12.5,
        letterSpacing: "0.3px", zIndex: 999,
        boxShadow: "0 8px 28px rgba(200,245,61,.4)",
        opacity: toastVis ? 1 : 0,
        transition: "transform .4s cubic-bezier(.34,1.56,.64,1), opacity .28s",
        pointerEvents: "none", whiteSpace: "nowrap",
      }}>
        {toastMsg}
      </div>
    </div>
  );
};

export default FriendsDashboard;
