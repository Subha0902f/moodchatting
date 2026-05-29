import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../pages/useTheme";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavKey = "dashboard" | "chat" | "modes" | "channels" | "blog" | "notepad" | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  icon: React.ReactNode;
}

interface StatCard {
  icon: string;
  value: string;
  label: string;
  delta: string;
  up: boolean;
}

interface ActivityItem {
  avatar: string;
  name: string;
  desc: string;
  time: string;
}

interface ModeItem {
  name: string;
  count: number;
  uses: number;
  pct: number;
  color: string;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icon = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Modes: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  Channels: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.8 19.8 0 0 1 1.62 3.38 2 2 0 0 1 3.59 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.75a16 16 0 0 0 6 6l1.06-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
    </svg>
  ),
  Blog: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  Notepad: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 15, height: 15 }}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ width: 17, height: 17 }}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Caret: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 12, height: 12 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 14, height: 14 }}>
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <Icon.Dashboard /> },
  { key: "chat",      label: "Chat",      icon: <Icon.Chat />      },
  { key: "modes",     label: "Modes",     icon: <Icon.Modes />     },
  { key: "channels",  label: "Channels",  icon: <Icon.Channels />  },
  { key: "blog",      label: "Blog",      icon: <Icon.Blog />      },
  { key: "notepad",   label: "Notepad",   icon: <Icon.Notepad />   },
];

const STATS: StatCard[] = [
  { icon: "💬", value: "1,284", label: "Total Chats",     delta: "↑ 12% this week", up: true  },
  { icon: "⚡", value: "38",    label: "Active Modes",    delta: "↑ 5 new today",   up: true  },
  { icon: "📡", value: "7",     label: "Channels",        delta: "↓ 1 paused",      up: false },
  { icon: "📝", value: "56",    label: "Notepad Entries", delta: "↑ 4 today",       up: true  },
];

const ACTIVITIES: ActivityItem[] = [
  { avatar: "🔥", name: "Rant Mode activated",    desc: "You started a new chat in Rant mode",   time: "2m ago"  },
  { avatar: "💌", name: "Channel #vibes updated", desc: "3 new replies from your followers",     time: "18m ago" },
  { avatar: "📝", name: "Notepad synced",          desc: "Your daily reflection was saved",       time: "1h ago"  },
  { avatar: "✍️", name: "Blog post published",    desc: '"On quiet Sundays" — 142 views',        time: "3h ago"  },
];

const MODES: ModeItem[] = [
  { name: "Vibe",  count: 438, uses: 438, pct: 88, color: "#c8f53d" },
  { name: "Calm",  count: 312, uses: 312, pct: 65, color: "#60a5fa" },
  { name: "Rant",  count: 201, uses: 201, pct: 42, color: "#f472b6" },
  { name: "Hype",  count: 97,  uses: 97,  pct: 22, color: "#fb923c" },
];

// ─── CSS-in-JS tokens ─────────────────────────────────────────────────────────

const T = {
  lime:        "#c8f53d",
  limeDim:     "#9dc42e",
  limeGlow:    "rgba(200,245,61,0.15)",
  limeBorder:  "rgba(200,245,61,0.18)",
  black:       "#07080a",
  sidebarBg:   "#0c0d0f",
  topbarBg:    "#0e0f12",
  contentBg:   "#0a0b0d",
  card:        "#131417",
  surface:     "#181a1e",
  border:      "#1e2024",
  border2:     "#252830",
  text:        "#dde0e8",
  muted:       "#52566a",
  muted2:      "#3a3d4a",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Sidebar nav link with tooltip */
const SideNavItem: React.FC<{
  item: NavItem;
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", height: 44, borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", position: "relative",
        transition: "all 0.18s ease",
        color: active ? T.lime : hovered ? "#8a9080" : T.muted,
        background: active ? "rgba(200,245,61,0.1)" : hovered ? "rgba(200,245,61,0.06)" : "transparent",
        border: `1px solid ${active ? T.limeBorder : hovered ? T.border : "transparent"}`,
        boxShadow: active ? "0 0 16px rgba(200,245,61,0.1)" : "none",
      }}
    >
      {/* Active indicator */}
      {active && (
        <div style={{
          position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 20, background: T.lime, borderRadius: 2,
          boxShadow: `0 0 8px ${T.lime}`,
        }} />
      )}
      {item.icon}
      {/* Tooltip */}
      <div style={{
        position: "absolute", left: "calc(100% + 12px)",
        background: "#1a1c22", border: `1px solid ${T.border2}`,
        color: T.text, fontSize: 12, fontWeight: 500,
        padding: "5px 10px", borderRadius: 7,
        whiteSpace: "nowrap", pointerEvents: "none",
        opacity: hovered ? 1 : 0,
        transform: hovered ? "translateX(0)" : "translateX(-6px)",
        transition: "all 0.15s ease", zIndex: 100, letterSpacing: "0.5px",
        fontFamily: "'Outfit', sans-serif",
      }}>
        {item.label}
      </div>
    </div>
  );
};

/** Theme toggle button */
const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: T.surface, border: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: T.muted, transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = T.limeBorder;
        e.currentTarget.style.color = T.lime;
        e.currentTarget.style.boxShadow = `0 0 12px ${T.lime}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.color = T.muted;
        e.currentTarget.style.boxShadow = "none";
      }}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      {mode === "dark" ? <Icon.Sun /> : "🌙"}
    </div>
  );
};

/** Profile dropdown */
const ProfileDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const ddItems = [
    { icon: <Icon.User />,    label: "Profile",   to: "/profile" },
    { icon: <Icon.Settings />, label: "Settings", to: "/settings" },
    { icon: <Icon.Chart />,   label: "Analytics", to: "/dashboard" },
  ];

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    const { error } = await signOut();
    setSigningOut(false);

    if (!error) {
      setOpen(false);
      navigate("/login", { replace: true });
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "MoodChat User";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: "5px 12px 5px 6px",
          cursor: "pointer", transition: "all 0.18s ease",
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: "linear-gradient(135deg,#2a3a10,#1c2a08)",
          border: `1px solid ${T.limeBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>🧑</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, letterSpacing: "0.2px" }}>{displayName}</div>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.3px" }}>Pro Member</div>
        </div>
        <Icon.Caret />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "#141618", border: `1px solid ${T.border2}`,
          borderRadius: 14, padding: 6, minWidth: 180, zIndex: 200,
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
          animation: "dropIn 0.2s cubic-bezier(0.34,1.4,0.64,1) both",
        }}>
          {ddItems.map((item) => (
            <div
              key={item.label}
              onClick={() => {
                navigate(item.to);
                setOpen(false);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 9,
                fontSize: 13, color: T.text, cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: T.muted }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
          <div
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 9,
              fontSize: 13, color: "#ff6b6b", cursor: signingOut ? "wait" : "pointer",
              opacity: signingOut ? 0.7 : 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: "#ff6b6b" }}><Icon.Logout /></span>
            {signingOut ? "Signing out..." : "Sign out"}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────

const MoodChatLayout: React.FC = () => {
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split("/")[1] as NavKey | undefined;
  const navKeys: NavKey[] = ["dashboard", "chat", "modes", "channels", "blog", "notepad", "settings"];
  const activeNav: NavKey = currentPath && navKeys.includes(currentPath) ? currentPath : "dashboard";

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "72px minmax(0, 1fr)",
      gridTemplateRows: "56px 1fr",
      height: "100vh", width: "100%", maxWidth: "100vw",
      fontFamily: "'Outfit', 'DM Sans', sans-serif",
      background: T.black,
      overflow: "hidden",
      boxSizing: "border-box",
    }}>

      {/* ════ SIDEBAR ════ */}
      <aside style={{
        gridColumn: 1, gridRow: "1 / 3",
        background: T.sidebarBg,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", padding: "0 0 16px",
        position: "relative", zIndex: 30,
        boxShadow: "4px 0 24px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 56,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: `1px solid ${T.border}`, marginBottom: 16, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            background: `linear-gradient(135deg, ${T.lime}, ${T.limeDim})`,
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 20px rgba(200,245,61,0.35)",
          }}>💬</div>
        </div>

        {/* Profile avatar - clickable to navigate to profile */}
        <div 
          onClick={() => navigate("/profile")}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg,#2a2d36,#1a1c22)",
            border: `2px solid ${T.border2}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, cursor: "pointer", marginBottom: 20, position: "relative",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.lime;
            e.currentTarget.style.boxShadow = `0 0 12px ${T.lime}40`;
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border2;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Go to Profile"
        >
          🧑
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            width: 9, height: 9, background: T.lime,
            borderRadius: "50%", border: `2px solid ${T.sidebarBg}`,
          }} />
        </div>

        {/* Main nav */}
        <nav style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4,
          flex: 1, width: "100%", padding: "0 10px",
        }}>
          {NAV_ITEMS.map((item) => (
            <SideNavItem
              key={item.key}
              item={item}
              active={activeNav === item.key}
              onClick={() => navigate(`/${item.key}`)}
            />
          ))}
        </nav>

        {/* Settings at bottom */}
        <div style={{ width: "100%", padding: "0 10px" }}>
          <SideNavItem
            item={{ key: "settings", label: "Settings", icon: <Icon.Settings /> }}
            active={activeNav === "settings"}
            onClick={() => navigate("/settings")}
          />
        </div>
      </aside>

      {/* ════ TOPBAR ════ */}
      <header style={{
        gridColumn: 2, gridRow: 1,
        background: T.topbarBg,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: 16,
        position: "relative", zIndex: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        minWidth: 0,
      }}>
        {/* Page title */}
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
          color: T.text, letterSpacing: "0.3px", whiteSpace: "nowrap",
        }}>
          Mood<span style={{ color: T.muted }}>Chat</span>
        </div>

        {/* Global search */}
        <div style={{ flex: "1 1 220px", minWidth: 0, maxWidth: 420, margin: "0 auto", position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted }}>
            <Icon.Search />
          </div>
          <input
            id="global-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anything…"
            style={{
              width: "100%",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "8px 50px 8px 38px",
              color: T.text,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              outline: "none",
              letterSpacing: "0.2px",
            }}
          />
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: T.border, borderRadius: 5, padding: "2px 7px",
            fontSize: 10, color: T.muted, fontFamily: "monospace", letterSpacing: 1,
            pointerEvents: "none",
          }}>⌘K</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          {/* Notifications */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.surface, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: T.muted, position: "relative",
          }}>
            <Icon.Bell />
            <div style={{
              position: "absolute", top: 6, right: 6,
              width: 7, height: 7, background: T.lime,
              borderRadius: "50%", border: `2px solid ${T.topbarBg}`,
            }} />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile */}
          <ProfileDropdown />
        </div>
      </header>

      {/* ════ MAIN CONTENT ════ */}
      <main style={{
        gridColumn: 2, gridRow: 2,
        background: T.contentBg,
        overflowY: "auto",
        overflowX: "hidden",
        padding: 28,
        position: "relative",
        minWidth: 0,
        minHeight: 0,
      }}>
        <div style={{ width: "100%", maxWidth: "100%", minWidth: 0, height: "100%", minHeight: 0, overflowX: "hidden" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MoodChatLayout;
