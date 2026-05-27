import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  FC,
  KeyboardEvent,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Channel {
  id: number;
  name: string;
  desc: string;
  creator: string;
  emoji: string;
  accent: string;
  members: number;
  joined: boolean;
}

interface Post {
  id: number;
  author: string;
  emoji: string;
  time: string;
  text: string;
}

type ThreadMap = Record<number, Post[]>;

interface CreateChannelData {
  name: string;
  desc: string;
  emoji: string;
  accent: string;
}

type ChannelTab = "All" | "Joined" | "Discover";

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:      "#07090a",
  card:    "#0d0f10",
  surface: "#131516",
  surface2:"#181a1c",
  border:  "#1b1d1f",
  border2: "#232628",
  text:    "#dde0e8",
  sub:     "#4a4e5a",
  muted:   "#282c32",
  lime:    "#c8f53d",
  limeDim: "#9cc52b",
  red:     "#ff5252",
};

// ─── Seed data ──────────────────────────────────────────────────────────────────

const INIT_CHANNELS: Channel[] = [
  { id: 1, name: "vibes-only",       desc: "Pure good energy. No negativity allowed 🌊",    creator: "Community",     emoji: "🌊", accent: "#60a5fa", members: 142, joined: true  },
  { id: 2, name: "dev-talk",         desc: "Code, bugs, and caffeine. All things dev.",       creator: "Community",    emoji: "💻", accent: "#4ade80", members: 89,  joined: false },
  { id: 3, name: "design-inspo",     desc: "Share what moves you aesthetically.",             creator: "Community",   emoji: "🎨", accent: "#f472b6", members: 203, joined: true  },
  { id: 4, name: "midnight-rants",   desc: "3am thoughts? Drop them here.",                  creator: "Community", emoji: "🌙", accent: "#a78bfa", members: 57,  joined: false },
  { id: 5, name: "productivity-hub", desc: "Systems, habits, tools to get things done.",     creator: "Community",    emoji: "⚡", accent: "#c8f53d", members: 311, joined: false },
  { id: 6, name: "music-heads",      desc: "Playlists, reviews, and deep cuts only.",        creator: "Community",    emoji: "🎵", accent: "#fb923c", members: 178, joined: true  },
];

const SEED_POSTS: ThreadMap = {
  1: [
    { id: 1, author: "Anonymous",    emoji: "🎵", time: "Any time", text: "Message content varies." },
    { id: 2, author: "Anonymous",    emoji: "⚡", time: "Any time", text: "Message content varies." },
    { id: 3, author: "Anonymous",  emoji: "🎮", time: "Any time", text: "Message content varies." },
  ],
  2: [
    { id: 1, author: "Anonymous",   emoji: "🚀", time: "Any time", text: "Message content varies." },
    { id: 2, author: "Anonymous", emoji: "🌿", time: "Any time", text: "Message content varies." },
  ],
  3: [
    { id: 1, author: "Anonymous",     emoji: "🦋", time: "Any time", text: "Message content varies." },
    { id: 2, author: "Anonymous",   emoji: "🌸", time: "Any time", text: "Message content varies." },
    { id: 3, author: "Anonymous",    emoji: "🌊", time: "Any time", text: "Message content varies." },
  ],
  4: [
    { id: 1, author: "Anonymous", emoji: "🌸", time: "Any time", text: "Message content varies." },
    { id: 2, author: "Anonymous",     emoji: "🎵", time: "Any time", text: "Message content varies." },
  ],
  5: [
    { id: 1, author: "Anonymous",  emoji: "🔥", time: "Any time", text: "Message content varies." },
    { id: 2, author: "Anonymous",  emoji: "🚀", time: "Any time", text: "Message content varies." },
  ],
  6: [
    { id: 1, author: "Anonymous", emoji: "✨", time: "Any time", text: "Message content varies." },
    { id: 2, author: "Anonymous",  emoji: "⚡", time: "Any time", text: "Message content varies." },
  ],
};

const AV_BGS = ["#1a2e1a", "#2a1e0a", "#0a1e2a", "#1e0a2a", "#2a2a0a", "#0a2a1e", "#2a0a0a"];
const nameToAvBg = (name: string) => AV_BGS[name.charCodeAt(0) % AV_BGS.length];

const EMOJIS = ["🌊", "💻", "🎨", "🌙", "⚡", "🎵", "🔥", "🌿", "✨", "🚀", "🦋", "🎯"];
const ACCENTS = ["#60a5fa", "#4ade80", "#f472b6", "#a78bfa", "#c8f53d", "#fb923c"];

// ─── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarProps { emoji: string; bg?: string; size?: number; }

const Avatar: FC<AvatarProps> = ({ emoji, bg = "#1a2a1a", size = 34 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.3),
    flexShrink: 0, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.46, border: "1.5px solid rgba(255,255,255,.06)",
  }}>{emoji}</div>
);

// ─── Create Channel Modal ──────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (data: CreateChannelData) => void;
}

const CreateModal: FC<CreateModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const [selEmoji, setSelEmoji] = useState("🌊");
  const [selAccent, setSelAccent] = useState("#60a5fa");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = () => {
    const clean = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!clean) { setErr("Channel name is required"); return; }
    if (!desc.trim()) { setErr("Description is required"); return; }
    onCreate({ name: clean, desc: desc.trim(), emoji: selEmoji, accent: selAccent });
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,6,5,.88)", backdropFilter: "blur(10px)",
      }}
    >
      <div style={{
        width: 480, maxWidth: "94vw",
        background: C.card, border: "1px solid rgba(200,245,61,.2)",
        borderRadius: 22, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,.8)",
      }}>
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${C.lime},transparent)`, opacity: 0.5 }} />

        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>Create Channel</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Build a space for your community</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: C.surface, border: `1px solid ${C.border2}`, cursor: "pointer", color: C.sub, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Emoji picker */}
          <div>
            <label style={{ fontSize: 10.5, color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 8 }}>Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.map(em => (
                <button key={em} onClick={() => setSelEmoji(em)} style={{
                  width: 36, height: 36, borderRadius: 9, cursor: "pointer", fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${selEmoji === em ? "rgba(200,245,61,.5)" : C.border}`,
                  background: selEmoji === em ? "rgba(200,245,61,.1)" : C.surface,
                  transition: "all .15s",
                }}>{em}</button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div>
            <label style={{ fontSize: 10.5, color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 8 }}>Accent Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              {ACCENTS.map(ac => (
                <div key={ac} onClick={() => setSelAccent(ac)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: ac, cursor: "pointer",
                  border: `2.5px solid ${selAccent === ac ? "rgba(255,255,255,.7)" : "transparent"}`,
                  boxShadow: selAccent === ac ? `0 0 12px ${ac}88` : "none",
                  transition: "all .15s",
                }} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 10.5, color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 7 }}>Channel Name</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.sub, pointerEvents: "none" }}>#</span>
              <input
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-channel-name"
                style={{
                  width: "100%", background: C.surface,
                  border: `1px solid ${err ? C.red : C.border}`,
                  borderRadius: 10, padding: "10px 14px 10px 30px",
                  color: C.text, fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13.5, outline: "none",
                }}
              />
            </div>
            {err && <div style={{ fontSize: 11, color: C.red, marginTop: 5 }}>⚠ {err}</div>}
          </div>

          {/* Desc */}
          <div>
            <label style={{ fontSize: 10.5, color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 7 }}>Description</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="What's this channel about?"
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "10px 14px", color: C.text,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
                outline: "none", resize: "none", lineHeight: 1.5,
              }}
            />
          </div>

          <button onClick={submit} style={{
            padding: 11, border: "none", borderRadius: 11, cursor: "pointer",
            background: `linear-gradient(135deg,${C.lime},${C.limeDim})`,
            color: "#060a06", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: 0.8,
            textTransform: "uppercase",
            boxShadow: "0 4px 20px rgba(200,245,61,.3)",
          }}>Create Channel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Channel Card ──────────────────────────────────────────────────────────────

interface ChannelCardProps {
  ch: Channel;
  joined: boolean;
  onClick: () => void;
  onToggleJoin: (id: number) => void;
}

const ChannelCard: FC<ChannelCardProps> = ({ ch, joined, onClick, onToggleJoin }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, cursor: "pointer",
        border: `1px solid ${hov ? ch.accent + "44" : C.border}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: hov ? `0 0 28px ${ch.accent}14` : "none",
        transition: "all .2s",
      }}
    >
      <div style={{ height: 2.5, background: `linear-gradient(90deg,transparent,${ch.accent},transparent)`, opacity: 0.55 }} />
      <div style={{ padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${ch.accent}14`, border: `1px solid ${ch.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ch.emoji}</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>#{ch.name}</div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{ch.members.toLocaleString()} members</div>
            </div>
          </div>
          {joined && (
            <div style={{ background: "rgba(200,245,61,.1)", border: "1px solid rgba(200,245,61,.25)", color: C.lime, fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: 0.6, flexShrink: 0 }}>
              JOINED
            </div>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55, marginBottom: 14, minHeight: 38 }}>{ch.desc}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar emoji="👤" bg={nameToAvBg(ch.creator)} size={20} />
            <span style={{ fontSize: 11, color: C.sub }}>by {ch.creator}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleJoin(ch.id); }}
            style={{
              padding: "6px 14px", borderRadius: 9, cursor: "pointer",
              fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5,
              textTransform: "uppercase", transition: "all .18s",
              border: joined ? `1px solid ${C.border2}` : "none",
              background: joined ? "transparent" : ch.accent,
              color: joined ? C.sub : "#060a06",
              boxShadow: joined ? "none" : `0 3px 12px ${ch.accent}35`,
            }}
          >{joined ? "Leave" : "Join"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Channel View ──────────────────────────────────────────────────────────────

interface ChannelViewProps {
  ch: Channel;
  posts: Post[];
  onPost: (chId: number, text: string) => void;
  onBack: () => void;
}

const ChannelView: FC<ChannelViewProps> = ({ ch, posts, onPost, onBack }) => {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [posts]);

  const send = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    onPost(ch.id, t);
    setText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [text, ch.id, onPost]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, position: "relative" }}>
      {/* bg grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(200,245,61,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,61,.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, zIndex: 10, position: "relative", background: "rgba(13,15,16,.96)", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(0,0,0,.4)" }}>
        <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontSize: 16, flexShrink: 0 }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ch.accent}14`, border: `1px solid ${ch.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{ch.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>#{ch.name}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{ch.desc}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${ch.accent}12`, border: `1px solid ${ch.accent}30`, color: ch.accent, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
          <span style={{ fontSize: 12 }}>{ch.emoji}</span>{ch.members} members
        </div>
      </div>

      {/* Posts */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", zIndex: 1, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.sub, letterSpacing: 0.8, textTransform: "uppercase" }}>Channel Feed</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.sub, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{ch.emoji}</div>
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <Avatar emoji={p.emoji || "👤"} bg={nameToAvBg(p.author)} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.author}</span>
                  <span style={{ fontSize: 10.5, color: C.sub }}>{p.time}</span>
                </div>
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "4px 16px 16px 16px",
                  padding: "10px 14px", fontSize: 13.5, color: C.text, lineHeight: 1.6,
                }}>{p.text}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 7 }}>
                  {["👍", "❤️", "😂"].map(r => (
                    <button key={r} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.sub, padding: "2px 4px" }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: "rgba(13,15,16,.97)", backdropFilter: "blur(10px)", zIndex: 10, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 16, padding: "8px 8px 8px 16px" }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder={`Post in #${ch.name}…`}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", paddingTop: 3 }}
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            style={{
              width: 38, height: 38, borderRadius: 11, border: "none",
              cursor: text.trim() ? "pointer" : "not-allowed",
              background: text.trim() ? `linear-gradient(135deg,${ch.accent},${ch.accent}bb)` : C.border,
              color: text.trim() ? "#060a06" : "#3a3d3a",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
              boxShadow: text.trim() ? `0 4px 14px ${ch.accent}40` : "none",
            }}
          >➤</button>
        </div>
        <div style={{ textAlign: "center", fontSize: 10.5, color: C.muted, marginTop: 6 }}>Enter to post · Shift+Enter for new line</div>
      </div>
    </div>
  );
};

// ─── Root App ──────────────────────────────────────────────────────────────────

const ChannelsPage: FC = () => {
  const [channels, setChannels] = useState<Channel[]>(INIT_CHANNELS);
  const [joined, setJoined] = useState<Set<number>>(
    new Set(INIT_CHANNELS.filter(c => c.joined).map(c => c.id))
  );
  const [posts, setPosts] = useState<ThreadMap>(SEED_POSTS);
  const [active, setActive] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ChannelTab>("All");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channels.filter(c => {
      const matchesSearch = q ? c.name.includes(q) || c.desc.toLowerCase().includes(q) : true;
      const isJoined = joined.has(c.id);
      const matchesTab = tab === "All" || (tab === "Joined" ? isJoined : !isJoined);
      return matchesSearch && matchesTab;
    });
  }, [channels, joined, search, tab]);

  const toggleJoin = (id: number) => {
    setJoined(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setChannels(prev => prev.map(c => c.id === id ? { ...c, members: joined.has(id) ? c.members - 1 : c.members + 1 } : c));
  };

  const addPost = useCallback((chId: number, text: string) => {
    const newPost: Post = {
      id: Date.now(), author: "You", emoji: "🧑",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
    };
    setPosts(prev => ({ ...prev, [chId]: [...(prev[chId] ?? []), newPost] }));
  }, []);

  const createChannel = (data: CreateChannelData) => {
    const id = Date.now();
    setChannels(prev => [...prev, { ...data, id, creator: "You", members: 1, joined: true }]);
    setJoined(prev => { const next = new Set(prev); next.add(id); return next; });
    setPosts(prev => ({ ...prev, [id]: [] }));
  };

  const activeCh = channels.find(c => c.id === active);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) minmax(0, 1fr)", width: "100%", maxWidth: "100%", minWidth: 0, height: "100%", minHeight: 0, background: C.bg, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>

      {/* LEFT PANEL */}
      <div style={{ background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-.2px" }}>
                Mood<span style={{ color: C.lime, textShadow: "0 0 20px rgba(200,245,61,.4)" }}>Chat</span>
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>Channels</div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: `linear-gradient(135deg,${C.lime},${C.limeDim})`, border: "none", borderRadius: 10, cursor: "pointer", color: "#060a06", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", padding: "8px 14px", boxShadow: "0 3px 14px rgba(200,245,61,.3)" }}
            >+ Create</button>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.sub, pointerEvents: "none" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search channels…"
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px 8px 33px", color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, outline: "none" }}
            />
          </div>
          {search && <div style={{ fontSize: 11, color: C.sub, marginTop: 6, letterSpacing: 0.3 }}>{filtered.length} channel{filtered.length !== 1 ? "s" : ""} found</div>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {(["All", "Joined", "Discover"] as ChannelTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px 0",
                textAlign: "center",
                fontSize: 11.5,
                fontWeight: 600,
                color: tab === t ? C.lime : C.sub,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                border: "none",
                borderBottom: tab === t ? `2px solid ${C.lime}` : "2px solid transparent",
                cursor: "pointer",
                background: tab === t ? "rgba(200,245,61,.06)" : "transparent",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Channel list */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.sub, fontSize: 13 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>No channels found
            </div>
          ) : (
            filtered.map(ch => (
              <div key={ch.id} style={{ marginBottom: 10 }}>
                <ChannelCard ch={ch} joined={joined.has(ch.id)} onClick={() => setActive(ch.id)} onToggleJoin={toggleJoin} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ height: "100%", minHeight: 0, overflow: "hidden", minWidth: 0 }}>
        {activeCh ? (
          <ChannelView ch={activeCh} posts={posts[activeCh.id] ?? []} onPost={addPost} onBack={() => setActive(null)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: C.sub, gap: 12, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(200,245,61,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,61,.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
            <div style={{ fontSize: 40, position: "relative", zIndex: 1 }}>📡</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: C.text, position: "relative", zIndex: 1 }}>Select a Channel</div>
            <div style={{ fontSize: 13, color: C.sub, position: "relative", zIndex: 1 }}>Choose from the list or create a new one</div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createChannel} />}
    </div>
  );
};

export default ChannelsPage;    
