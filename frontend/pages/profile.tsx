import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/userservice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Friend {
  id: number;
  initials: string;
  name: string;
  online: boolean;
  active?: boolean;
}

interface Mode {
  id: number;
  icon: string;
  name: string;
  description: string;
  active?: boolean;
}

interface ProfileData {
  initials: string;
  fullName: string;
  handle: string;
  bio: string;
  hashtags: string[];
  email: string;
  phone: string;
  stats: { label: string; value: string }[];
  friends: Friend[];
  modes: Mode[];
  profileLink: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const FALLBACK_FRIENDS: Friend[] = [
  { id: 1, initials: "AS", name: "Aarav", online: true, active: true },
  { id: 2, initials: "MR", name: "Mira", online: false },
  { id: 3, initials: "DV", name: "Dev", online: true },
  { id: 4, initials: "IK", name: "Isha", online: false },
];

const FALLBACK_MODES: Mode[] = [
  { id: 1, icon: "💬", name: "Chat", description: "Open conversations", active: true },
  { id: 2, icon: "⚡", name: "Hype", description: "High-energy replies" },
  { id: 3, icon: "🌙", name: "Calm", description: "Soft and reflective" },
  { id: 4, icon: "📝", name: "Notes", description: "Saved thoughts" },
];

const PROFILE: ProfileData = {
  initials: "MC",
  fullName: "MoodChat User",
  handle: "@moodchat",
  bio: "Building things that matter.",
  hashtags: ["moodchat", "chat", "vibes"],
  email: "Not signed in",
  phone: "Add phone",
  stats: [
    { label: "Friends", value: "0" },
    { label: "Chats", value: "0" },
    { label: "Modes", value: "4" },
  ],
  profileLink: "http://localhost:5173/profile",
  friends: FALLBACK_FRIENDS,
  modes: FALLBACK_MODES,
};

// ─── Inline styles (CSS-in-JS) ────────────────────────────────────────────────

const C = {
  lime: "#BFFF00",
  limeDim: "#99CC00",
  limeGlow: "rgba(191,255,0,0.15)",
  black: "#0A0A0A",
  surface: "#141414",
  surface2: "#1E1E1E",
  surface3: "#272727",
  text: "#F2F2F2",
  muted: "#888",
  border: "rgba(191,255,0,0.18)",
} as const;

// ─── Small SVG icons ──────────────────────────────────────────────────────────

const IconCheck = () => (
  <svg viewBox="0 0 24 24" width={8} height={8} fill={C.black} stroke="none">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke={C.lime} strokeWidth={2} strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke={C.lime} strokeWidth={2} strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const IconCopy = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const IconDots = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={C.lime} strokeWidth={2} strokeLinecap="round">
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);

// ─── QR Code (static decorative SVG) ─────────────────────────────────────────

const QRCode = () => (
  <div style={{ width: 72, height: 72, background: C.text, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg viewBox="0 0 40 40" width={52} height={52}>
      <rect x="2" y="2" width="16" height="16" fill={C.black} rx="1" />
      <rect x="4" y="4" width="12" height="12" fill="white" rx="0.5" />
      <rect x="6" y="6" width="8" height="8" fill={C.black} rx="0.5" />
      <rect x="22" y="2" width="16" height="16" fill={C.black} rx="1" />
      <rect x="24" y="4" width="12" height="12" fill="white" rx="0.5" />
      <rect x="26" y="6" width="8" height="8" fill={C.black} rx="0.5" />
      <rect x="2" y="22" width="16" height="16" fill={C.black} rx="1" />
      <rect x="4" y="24" width="12" height="12" fill="white" rx="0.5" />
      <rect x="6" y="26" width="8" height="8" fill={C.black} rx="0.5" />
      <rect x="22" y="22" width="4" height="4" fill={C.black} />
      <rect x="28" y="22" width="4" height="4" fill={C.black} />
      <rect x="22" y="28" width="4" height="4" fill={C.black} />
      <rect x="28" y="28" width="10" height="4" fill={C.black} />
      <rect x="34" y="22" width="4" height="10" fill={C.black} />
    </svg>
  </div>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionDivider = () => (
  <div style={{ height: 6, background: C.surface, borderTop: `1px solid ${C.surface2}`, borderBottom: `1px solid ${C.surface2}`, margin: "0 0 1.25rem" }} />
);

const SectionHeader = ({ title, link }: { title: string; link: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", marginBottom: "0.75rem" }}>
    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: C.lime }}>
      {title}
    </span>
    <a href="#" style={{ fontSize: 11, color: C.muted, textDecoration: "none" }}>{link}</a>
  </div>
);

// ─── Main ProfilePage component ───────────────────────────────────────────────

const getInitials = (nameOrEmail: string) => {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return "MC";
  const base = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MC";
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [remoteProfile, setRemoteProfile] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!user?.id) {
      setRemoteProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const { data } = await getProfile(user.id);
        if (mounted) setRemoteProfile(data ?? null);
      } catch {
        if (mounted) setRemoteProfile(null);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const p = useMemo<ProfileData>(() => {
    const metadata = user?.user_metadata ?? {};
    const email = user?.email ?? PROFILE.email;
    const fullName =
      remoteProfile?.full_name ||
      remoteProfile?.name ||
      metadata.full_name ||
      metadata.name ||
      metadata.username ||
      (user ? email.split("@")[0] : PROFILE.fullName);
    const username =
      remoteProfile?.username ||
      metadata.username ||
      String(fullName).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") ||
      "moodchat";
    const origin = typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;

    return {
      ...PROFILE,
      initials: getInitials(String(fullName || email)),
      fullName: String(fullName || PROFILE.fullName),
      handle: `@${String(username).replace(/^@/, "")}`,
      bio: remoteProfile?.bio || metadata.bio || PROFILE.bio,
      hashtags: remoteProfile?.hashtags || metadata.hashtags || PROFILE.hashtags,
      email,
      phone: remoteProfile?.phone || metadata.phone || PROFILE.phone,
      profileLink: `${origin}/profile/${user?.id ?? "me"}`,
      stats: [
        { label: "Friends", value: String(remoteProfile?.friends_count ?? PROFILE.friends.length) },
        { label: "Chats", value: String(remoteProfile?.chats_count ?? 0) },
        { label: "Modes", value: String(PROFILE.modes.length) },
      ],
    };
  }, [remoteProfile, user]);

  const handleCopy = () => {
    if (!p.profileLink) return;
    Promise.resolve(navigator.clipboard?.writeText(p.profileLink)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ background: C.black, color: C.lime, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace" }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{ background: C.black, fontFamily: "'DM Sans', sans-serif", color: C.text, minHeight: "100vh", paddingBottom: "3rem", maxWidth: 480, margin: "0 auto" }}>

      {/* Top bar */}
      <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: C.lime, letterSpacing: "0.08em" }}>// PROFILE</span>
        <div style={{ width: 28, height: 28, border: `1px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface2, cursor: "pointer" }}>
          <IconDots />
        </div>
      </div>

      {/* Hero strip */}
      <div style={{ background: `linear-gradient(180deg, ${C.surface} 0%, ${C.black} 100%)`, padding: "2rem 1.25rem 0", position: "relative" }}>
        {/* Lime top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: C.lime }} />

        {/* Avatar row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", border: `2.5px solid ${C.lime}`, padding: 3, background: C.black }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: C.surface3, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: C.lime }}>
                {p.initials}
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 18, height: 18, background: C.lime, borderRadius: "50%", border: `2px solid ${C.black}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconCheck />
            </div>
          </div>

          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 19, fontWeight: 700, color: C.text, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{p.fullName}</div>
            <div style={{ fontSize: 12, color: C.lime, marginTop: 3, fontFamily: "'Space Mono', monospace", letterSpacing: "0.04em" }}>{p.handle}</div>
            <div style={{ display: "flex", gap: "1.25rem", marginTop: 8 }}>
              {p.stats.map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.lime }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted, marginBottom: "1rem" }}>
          <span style={{ color: C.text }}>{p.bio}</span>
        </p>

        {/* Hashtag chips */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: "1.25rem" }}>
          {p.hashtags.map((tag) => (
            <span
              key={tag}
              style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", padding: "4px 10px", borderRadius: 100, border: `1px solid ${C.border}`, color: C.lime, background: C.limeGlow, letterSpacing: "0.03em", cursor: "pointer" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Contact info */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {[
            { icon: <IconMail />, text: p.email },
            { icon: <IconPhone />, text: p.phone },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, background: C.surface2, border: `1px solid ${C.surface3}`, borderRadius: 8, padding: "6px 10px", color: C.muted, flex: 1, overflow: "hidden" }}>
              {icon}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: 11 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          <button
            onClick={() => navigate(user ? "/settings" : "/login")}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", background: C.lime, color: C.black }}
          >
            {user ? "Edit Profile" : "Login"}
          </button>
          <button
            onClick={handleCopy}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "transparent", color: C.lime, border: `1px solid ${C.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Share Profile
          </button>
        </div>

        {/* Share options panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: C.muted, marginBottom: 12, fontFamily: "'Space Mono', monospace" }}>
            Share options
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <button
                onClick={handleCopy}
                style={{ display: "flex", alignItems: "center", gap: 7, background: C.surface2, border: `1px solid ${copied ? C.lime : C.surface3}`, borderRadius: 8, padding: "8px 12px", color: copied ? C.lime : C.text, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s" }}
              >
                <IconCopy />
                {copied ? "Copied!" : "Copy profile link"}
              </button>
              <div style={{ fontSize: 10, color: C.muted, padding: "0 2px" }}>{p.profileLink}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4 }}>
              <QRCode />
              <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace" }}>QR code</span>
            </div>
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* Friends section */}
      <SectionHeader title="Friends" link={`See all ${p.friends.length} ->`} />
      <div style={{ display: "flex", gap: 10, overflowX: "auto" as const, padding: "0 1.25rem 0.75rem", scrollbarWidth: "none" as const }}>
        {p.friends.map((f) => (
          <div key={f.id} style={{ flexShrink: 0, width: 68, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 5 }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: f.active ? C.limeGlow : C.surface3,
                  border: `1.5px solid ${f.active ? C.lime : C.surface3}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700,
                  color: f.active ? C.lime : C.muted, cursor: "pointer",
                }}
              >
                {f.initials}
              </div>
              {f.online && (
                <div style={{ width: 8, height: 8, background: C.lime, borderRadius: "50%", border: `1.5px solid ${C.black}`, position: "absolute", bottom: 1, right: 1 }} />
              )}
            </div>
            <div style={{ fontSize: 10, color: C.muted, textAlign: "center", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
              {f.name}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* Modes section */}
      <SectionHeader title="Modes" link="Manage ->" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 1.25rem" }}>
        {p.modes.map((m) => (
          <div
            key={m.id}
            style={{
              background: m.active ? C.limeGlow : C.surface,
              border: `1px solid ${m.active ? C.lime : C.surface3}`,
              borderRadius: 10, padding: 12, cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20, display: "block", marginBottom: 6 }}>{m.icon}</span>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: m.active ? C.lime : C.text, marginBottom: 3 }}>{m.name}</div>
            <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{m.description}</div>
            {m.active && (
              <span style={{ display: "inline-block", fontSize: 9, fontFamily: "'Space Mono', monospace", padding: "2px 6px", borderRadius: 4, marginTop: 5, background: "rgba(191,255,0,0.12)", color: C.lime, letterSpacing: "0.04em" }}>
                ACTIVE
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
