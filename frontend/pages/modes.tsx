import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "../context/AuthContext";
import { FriendAPI } from "../services/api";
import {
  MODE_META,
  loadModeAssignments,
  saveModeAssignments,
  ModeKey,
  ModeMeta,
  ModeState,
} from "../services/modeStorage";
import "./theme.css";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ModalIntent = "add" | "remove" | "edit";

interface ModalState {
  modeKey?: ModeKey;
  intent: ModalIntent;
}

interface EditModalProps {
  modeKey: ModeKey;
  meta: ModeMeta;
  onClose: () => void;
  onSave: (modeKey: ModeKey, newLabel: string) => void;
}

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:      "var(--bg)",
  card:    "var(--card)",
  surface: "var(--surface)",
  border:  "var(--border)",
  border2: "var(--border2)",
  text:    "var(--text)",
  sub:     "var(--sub)",
  muted:   "var(--sub2)",
  lime:    "var(--lime)",
};

// ─── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  online?: boolean;
}

interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  online?: boolean;
}

const hashColor = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 24%)`;
};

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ name, avatarUrl, size = 32, online = false }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.32),
    flexShrink: 0, background: avatarUrl ? "transparent" : hashColor(name),
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.48, position: "relative",
    border: "1.5px solid rgba(255,255,255,.07)", overflow: "hidden",
  }}>
    {avatarUrl ? (
      <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <span style={{ color: "#c8f53d", fontWeight: 700 }}>{getInitials(name)}</span>
    )}
    {online && (
      <div style={{
        position: "absolute", bottom: 1, right: 1,
        width: 7, height: 7, borderRadius: "50%",
        background: C.lime, border: `1.5px solid ${C.card}`,
      }} />
    )}
  </div>
);

// ─── Toast hook ────────────────────────────────────────────────────────────────

function useToast(): [string, boolean, (msg: string) => void] {
  const [msg, setMsg] = useState("");
  const [vis, setVis] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fire = useCallback((m: string) => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
    }
    setMsg(m); setVis(true);
    timer.current = setTimeout(() => setVis(false), 2600);
  }, []);
  return [msg, vis, fire];
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

interface ModalProps {
  modeKey: ModeKey;
  intent: ModalIntent;
  modes: Record<ModeKey, ModeState>;
  friends: Friend[];
  onClose: () => void;
  onSave: (key: ModeKey, selectedIds: string[]) => void;
}

const EditModal: React.FC<EditModalProps> = ({ modeKey, meta, onClose, onSave }) => {
  const [label, setLabel] = useState(meta.label);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const handleSave = () => {
    const newLabel = label.trim();
    if (!newLabel) {
      setError("Mode name cannot be empty.");
      return;
    }
    // Here you could add logic to check for duplicate names
    onSave(modeKey, newLabel);
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1001,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,6,4,.85)", backdropFilter: "blur(10px)",
      }}
    >
      <div style={{
        width: 400, maxWidth: "90vw", background: C.card,
        border: `1px solid ${meta.accent}44`, borderRadius: 22,
        boxShadow: `0 20px 60px rgba(0,0,0,.7), 0 0 40px ${meta.accent}18`,
      }}>
        <div style={{ padding: "20px 22px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>
            Edit Mode: {meta.label}
          </h3>
        </div>
        <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: C.sub, marginBottom: 6, display: "block" }}>Mode Name</label>
            <input
              ref={inputRef}
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError("");
              }}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${error ? "#ff5252" : C.border}`,
                borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none",
              }}
            />
            {error && <div style={{ fontSize: 11, color: "#ff5252", marginTop: 5 }}>{error}</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px", border: `1px solid ${C.border2}`, borderRadius: 10,
                background: "transparent", color: C.sub, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "8px 20px", border: "none", borderRadius: 10, cursor: "pointer",
                background: `linear-gradient(135deg,${meta.accent},${meta.accent}bb)`,
                color: "#060a06", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                fontSize: 12, textTransform: "uppercase",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Mode Card ─────────────────────────────────────────────────────────────────

interface ModeCardProps {
  modeKey: ModeKey;
  meta: ModeMeta;
  userIds: string[];
  friends: Friend[];
  onOpenModal: (key: ModeKey, intent: ModalIntent) => void;
  onRemoveUser: (key: ModeKey, userId: string) => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ modeKey, meta, userIds, friends, onOpenModal, onRemoveUser }) => {
  const [hovered, setHovered] = useState(false);
  const users = friends.filter(f => userIds.includes(f.id));
  const shown = users.slice(0, 4);
  const extra = users.length - shown.length;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? meta.accent + "55" : C.border}`,
        borderRadius: 20, overflow: "hidden",
        boxShadow: hovered ? `0 0 32px ${meta.accent}18` : "none",
        transition: "border-color .2s, box-shadow .2s",
      }}
    >
      {/* Accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${meta.accent},transparent)`, opacity: 0.6 }} />

      {/* Card header */}
      <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: `${meta.accent}18`, border: `1px solid ${meta.accent}33`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{meta.icon}</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: ".3px" }}>
                {meta.label}
              </span>
            </div>
            <button onClick={() => onOpenModal(modeKey, "edit")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.94284 2.3135L11.6865 5.05716M2.24999 11.75L1.75 12.25L1.86612 10.6339L8.25297 4.24703L10.1339 6.12797L3.74703 12.5148L2.24999 11.75Z" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{
            background: `${meta.accent}15`, border: `1px solid ${meta.accent}33`,
            color: meta.accent, fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 20, letterSpacing: ".5px",
            whiteSpace: "nowrap", flexShrink: 0, marginTop: 4,
          }}>
            {users.length} {users.length === 1 ? "person" : "people"}
          </div>
        </div>
      </div>

      {/* User chips */}
      <div style={{ padding: "12px 18px", minHeight: 90 }}>
        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#3a3d3a", fontSize: 13 }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>👤</div>
            No people added yet
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {shown.map(u => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 20, padding: "4px 10px 4px 5px",
                  fontSize: 12, color: C.text, fontWeight: 500,
                  transition: "border-color .15s",
                }}>
                  <Avatar name={u.name} avatarUrl={u.avatarUrl} size={20} online={u.online} />
                  {u.name.split(" ")[0]}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveUser(modeKey, u.id); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#3a3d3a", fontSize: 10, padding: "0 0 0 2px",
                      lineHeight: 1, transition: "color .15s",
                    }}
                  >✕</button>
                </div>
              ))}
              {extra > 0 && (
                <div style={{
                  display: "flex", alignItems: "center",
                  padding: "4px 10px", background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: 20,
                  fontSize: 12, color: C.sub,
                }}>+{extra}</div>
              )}
            </div>
            {/* Avatar stack */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex" }}>
                {shown.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ marginLeft: i ? -8 : 0, zIndex: 5 - i, position: "relative" }}>
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size={26} online={u.online} />
                  </div>
                ))}
              </div>
              {extra > 0 && <span style={{ fontSize: 11, color: C.sub, marginLeft: 4 }}>+{extra} more</span>}
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, padding: "0 18px 16px" }}>
        <button
          onClick={() => onOpenModal(modeKey, "add")}
          style={{
            flex: 1, padding: "9px 0", border: "none", borderRadius: 10, cursor: "pointer",
            background: `linear-gradient(135deg,${meta.accent},${meta.accent}bb)`,
            color: "#060a06", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: 11.5, letterSpacing: ".6px", textTransform: "uppercase",
            boxShadow: `0 3px 14px ${meta.accent}30`, transition: "all .18s",
          }}
        >+ Add People</button>
        <button
          onClick={() => onOpenModal(modeKey, "remove")}
          style={{
            flex: 1, padding: "9px 0", border: `1px solid ${C.border2}`, borderRadius: 10,
            cursor: "pointer", background: "transparent", color: C.sub,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            fontSize: 11.5, letterSpacing: ".6px", textTransform: "uppercase",
            transition: "all .18s",
          }}
        >− Remove</button>
      </div>
    </div>
  );
};

// ─── Modal ─────────────────────────────────────────────────────────────────────


const Modal: React.FC<ModalProps> = ({ modeKey, intent, modes, friends, onClose, onSave }) => {
  const meta = MODE_META[modeKey];
  const currentIds = modes[modeKey]?.users ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? friends.filter(f => f.name.toLowerCase().includes(q)) : friends;
  }, [query, friends]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addAllFriends = () => {
    const allFriendIds = friends.map(f => f.id);
    setSelected(new Set(allFriendIds));
  };

  const allFriendsAdded = friends.length > 0 && friends.every(f => selected.has(f.id));

  const hasChanged =
    [...selected].sort().join(",") !== [...currentIds].sort().join(",");

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,6,4,.85)", backdropFilter: "blur(10px)",
      }}
    >
      <div style={{
        width: 480, maxWidth: "94vw",
        background: C.card, border: `1px solid ${meta.accent}44`,
        borderRadius: 22, overflow: "hidden",
        boxShadow: `0 32px 80px rgba(0,0,0,.8), 0 0 60px ${meta.accent}14`,
      }}>
        {/* Stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${meta.accent},transparent)`, opacity: 0.7 }} />

        {/* Header */}
        <div style={{
          padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${meta.accent}18`, border: `1px solid ${meta.accent}33`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{meta.icon}</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>
                {meta.label}
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
                {intent === "add" ? "Select friends to add" : "Select friends to remove"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: C.surface, border: `1px solid ${C.border2}`,
              cursor: "pointer", color: C.sub, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: "14px 22px 0", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.sub, pointerEvents: "none" }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search friends…"
              autoComplete="off"
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 11,
                padding: "10px 14px 10px 38px",
                color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          {intent === 'add' && (
            <button
              onClick={addAllFriends}
              disabled={allFriendsAdded || friends.length === 0}
              style={{
                padding: "10px 16px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 11,
                color: C.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: (allFriendsAdded || friends.length === 0) ? "not-allowed" : "pointer",
                opacity: (allFriendsAdded || friends.length === 0) ? 0.5 : 1,
              }}>Add All</button>
          )}
        </div>

        {/* Friend list */}
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "10px 22px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.sub, fontSize: 13 }}>
              No friends found
            </div>
          ) : (
            filtered.map(f => {
              const sel = selected.has(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 12, marginBottom: 5, cursor: "pointer",
                    background: sel ? `${meta.accent}0e` : C.surface,
                    border: `1px solid ${sel ? meta.accent + "44" : C.border}`,
                    transition: "all .15s",
                  }}
                >
                  <Avatar name={f.name} avatarUrl={f.avatarUrl} size={36} online={f.online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
                      {f.online ? "● Online" : "○ Offline"}
                    </div>
                  </div>
                  {/* Custom checkbox */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: sel ? meta.accent : "transparent",
                    border: `1.5px solid ${sel ? meta.accent : C.border2}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#060a06", fontWeight: 800, transition: "all .15s",
                  }}>
                    {sel ? "✓" : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 22px 20px", borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div style={{ fontSize: 12, color: C.sub }}>{selected.size} selected</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 18px", border: `1px solid ${C.border2}`, borderRadius: 10,
                background: "transparent", color: C.sub, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
              }}
            >Cancel</button>
            <button
              onClick={() => onSave(modeKey, [...selected])}
              disabled={!hasChanged}
              style={{
                padding: "9px 22px", border: "none", borderRadius: 10,
                cursor: hasChanged ? "pointer" : "not-allowed",
                background: hasChanged
                  ? `linear-gradient(135deg,${meta.accent},${meta.accent}bb)`
                  : C.border,
                color: hasChanged ? "#060a06" : "#3a3d3a",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                fontSize: 12, letterSpacing: ".6px", textTransform: "uppercase",
                boxShadow: hasChanged ? `0 4px 16px ${meta.accent}35` : "none",
                transition: "all .2s", opacity: hasChanged ? 1 : 0.5,
              }}
            >Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Root App ──────────────────────────────────────────────────────────────────

const ModesContainer: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [modes, setModes] = useState<Record<ModeKey, ModeState>>(() => loadModeAssignments());
  const [modeMeta, setModeMeta] = useState(MODE_META);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [toastMsg, toastVis, fire] = useToast();

  const { user } = useAuth();

  useEffect(() => {
    saveModeAssignments(modes);
  }, [modes]);

  useEffect(() => {
    const loadFriends = async () => {
      setLoadingFriends(true);
      setFriendError(null);
      try {
        const res = await FriendAPI.list();
        const records = res.data?.data ?? [];
        setFriends(records.map((record: any) => {
          const otherUserId = record.requesterId === user?.id ? record.addresseeId : record.requesterId;
          const profile = record.profile ?? {};
          console.log(records);
          return {
            id: otherUserId,
            name: profile.full_name || profile.username || profile.email || otherUserId,
            avatarUrl: profile.avatar_url ?? undefined,
            email: profile.email ?? undefined,
            online: false,
          };
        }));
      } catch (error: any) {
        setFriendError(error.message ?? "Failed to load friends");
      } finally {
        setLoadingFriends(false);
      }
    };
    if (user?.id) {
      loadFriends();
    }
  }, [user?.id]);

  const openModal = (key: ModeKey, intent: ModalIntent) => setModal({ modeKey: key, intent });
  const closeModal = () => setModal(null);

  const saveModal = (modeKey: ModeKey, selectedIds: string[]) => {
    setModes(prev => ({ ...prev, [modeKey]: { users: selectedIds } }));
    fire(`${modeMeta[modeKey].label} mode updated ✓`);
    closeModal();
  };

  const saveEditModal = (modeKey: ModeKey, newLabel: string) => {
    setModeMeta(prev => ({
      ...prev,
      [modeKey]: {
        ...prev[modeKey],
        label: newLabel,
      }
    }));
    fire(`Mode renamed to "${newLabel}"`);
    closeModal();
  };

  const removeUser = (modeKey: ModeKey, userId: string) => {
    setModes(prev => ({
      ...prev,
      [modeKey]: { users: prev[modeKey].users.filter(id => id !== userId) },
    }));
    const user = friends.find(f => f.id === userId);
    fire(`${user?.name || "Friend"} removed from ${MODE_META[modeKey].label}`);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, padding: "36px 28px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(200,245,61,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,61,.02) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.lime, fontWeight: 600, marginBottom: 6 }}>
            MoodChat · Modes
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800,
            color: C.text, letterSpacing: "-.3px", lineHeight: 1,
          }}>
            Your{" "}
            <span style={{ color: C.lime, textShadow: "0 0 28px rgba(200,245,61,.35)" }}>
              Mood Modes
            </span>
          </h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>
            Control who sees what — configure each mode with your chosen people.
          </p>
          {(loadingFriends || friendError) && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              {loadingFriends ? (
                <span style={{ color: C.sub }}>Loading friends...</span>
              ) : (
                friendError && <span style={{ color: "#ff6b6b" }}>{friendError}</span>
              )}
            </div>
          )}
        </div>

        {/* Modes grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 18,
        }}>
          {(Object.keys(MODE_META) as ModeKey[]).map(key => (
            <ModeCard
  key={key}
  modeKey={key}
  meta={modeMeta[key]}
  userIds={modes[key].users}
  friends={friends}
  onOpenModal={openModal}
  onRemoveUser={removeUser}
/>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && modal.intent !== 'edit' && modal.modeKey && (
        <Modal
          modeKey={modal.modeKey}
          intent={modal.intent}
          modes={modes}
          friends={friends}
          onClose={closeModal}
          onSave={saveModal}
        />
      )}

      {modal && modal.intent === 'edit' && modal.modeKey && (
        <EditModal
          modeKey={modal.modeKey}
          meta={modeMeta[modal.modeKey]}
          onClose={closeModal}
          onSave={saveEditModal}
        />
      )}

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: 28, left: "50%",
        transform: `translateX(-50%) translateY(${toastVis ? 0 : 60}px)`,
        background: C.lime, color: "#060a06",
        padding: "10px 24px", borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12.5,
        zIndex: 9999, boxShadow: "0 8px 28px rgba(200,245,61,.4)",
        opacity: toastVis ? 1 : 0,
        transition: "transform .4s cubic-bezier(.34,1.56,.64,1), opacity .28s",
        pointerEvents: "none", whiteSpace: "nowrap",
      }}>
        {toastMsg}
      </div>
    </div>
  );
};

export default ModesContainer;