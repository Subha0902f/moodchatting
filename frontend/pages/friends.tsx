import { useAuth } from "../context/AuthContext";
// inside FriendsPage component:
import { useState, useEffect, useCallback, useRef, FC } from "react";
import { FriendAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FriendUser {
  id: string;
  friendshipId?: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

interface FriendRequest {
  id: string;
  sender: FriendUser;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

type TabKey = "friends" | "requests" | "search";

interface ToastState {
  msg: string;
  type: "success" | "error";
}

// ─── Design Tokens ───────────────────────────────────────────────────────────────

const C = {
  bg:         "var(--bg)",
  card:       "var(--card)",
  surface:    "var(--surface)",
  border:     "var(--border)",
  border2:    "var(--border2)",
  text:       "var(--text)",
  sub:        "var(--sub)",
  sub2:       "var(--sub2)",
  lime:       "var(--lime)",
  limeSoft:   "rgba(200,245,61,0.08)",
  limeBorder: "rgba(200,245,61,0.22)",
  red:        "#ff4f4f",
  redSoft:    "rgba(255,79,79,0.08)",
  redBorder:  "rgba(255,79,79,0.22)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function useToast(): [ToastState | null, (msg: string, type?: "success" | "error") => void] {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fire = useCallback((msg: string, type: "success" | "error" = "success") => {
    if (timer.current !== null) clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  return [toast, fire];
}

const getInitials = (username: string) =>
  username?.slice(0, 2).toUpperCase() || "??";
const hashColor = (str?: string) => {
  str = str || "Unknown";
  const colors = ["#1a2e1a", "#1a1a2e", "#2e1a1a", "#1a2a2e", "#2a1a2e"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── Avatar ───────────────────────────────────────────────────────────────────────

const Avatar: FC<{ user: FriendUser; size?: number }> = ({ user, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.3),
    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
    background: user.avatarUrl
  ? "transparent"
  : hashColor(user.username || "Unknown"),
    border: "1.5px solid rgba(255,255,255,.06)", overflow: "hidden",
  }}>
    {user.avatarUrl
      ? <img src={user.avatarUrl} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : <span style={{ fontSize: size * 0.34, fontWeight: 700, color: C.lime, fontFamily: "'Syne', sans-serif" }}>{getInitials(user.username)}</span>
    }
  </div>
);

// ─── Friend Card ──────────────────────────────────────────────────────────────────

const FriendCard: FC<{ user: FriendUser; onRemove: (id: string) => void }> = ({ user, onRemove }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setConfirming(false); }}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        background: C.card, border: `1px solid ${hov ? "rgba(200,245,61,.2)" : C.border}`,
        borderRadius: 16, transition: "all .2s",
        boxShadow: hov ? "0 0 24px rgba(200,245,61,.05)" : "none",
      }}
    >
  <Avatar user={user} size={44} />

<div
  onClick={() => navigate(`/profile/${user.id}`)}
  style={{
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  }}
>
  <div style={{
    fontWeight: 700,
    fontSize: 14,
    color: C.text,
    fontFamily: "'Syne', sans-serif"
  }}>
    {user.username}
  </div>

  <div style={{
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }}>
    {user.bio || user.email}
  </div>
</div>
      {confirming ? (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => {
  if (user.friendshipId) {
    onRemove(user.friendshipId);
  }
}}
            style={{ padding: "6px 12px", border: `1px solid ${C.redBorder}`, borderRadius: 8, background: C.redSoft, color: C.red, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11 }}
          >Confirm</button>
          <button
            onClick={() => setConfirming(false)}
            style={{ padding: "6px 12px", border: `1px solid ${C.border2}`, borderRadius: 8, background: "transparent", color: C.sub, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11 }}
          >Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          style={{ padding: "6px 14px", border: `1px solid ${C.border2}`, borderRadius: 9, background: "transparent", color: C.sub, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11.5, transition: "all .15s" }}
        >Remove</button>
      )}
    </div>
  );
};

// ─── Request Card ─────────────────────────────────────────────────────────────────

const RequestCard: FC<{ request: FriendRequest; onAccept: (id: string) => void; onReject: (id: string) => void }> = ({ request, onAccept, onReject }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        background: C.card, border: `1px solid ${hov ? C.limeBorder : C.border}`,
        borderRadius: 16, transition: "all .2s",
      }}
    >
      <Avatar user={request.sender} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: "'Syne', sans-serif" }}>
          {request.sender.username}
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>
          {request.sender.email}
        </div>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <button
          onClick={() => onAccept(request.id)}
          style={{ padding: "7px 14px", border: `1px solid ${C.limeBorder}`, borderRadius: 9, background: C.limeSoft, color: C.lime, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5, transition: "all .15s" }}
        >Accept ✓</button>
        <button
          onClick={() => onReject(request.id)}
          style={{ padding: "7px 14px", border: `1px solid ${C.redBorder}`, borderRadius: 9, background: C.redSoft, color: C.red, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5, transition: "all .15s" }}
        >Reject ✕</button>
      </div>
    </div>
  );
};

// ─── Search Card ──────────────────────────────────────────────────────────────────

const SearchCard: FC<{ user: FriendUser; isFriend: boolean; onAdd: (id: string) => void }> = ({ user, isFriend, onAdd }) => {
  const [hov, setHov] = useState(false);
  const [sent, setSent] = useState(false);

  const handleAdd = () => { onAdd(user.id); setSent(true); };

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        background: C.card, border: `1px solid ${hov ? "rgba(200,245,61,.2)" : C.border}`,
        borderRadius: 16, transition: "all .2s",
      }}
    >
      <Avatar user={user} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: "'Syne', sans-serif" }}>
          {user.username}
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {user.bio || user.email}
        </div>
      </div>
      {isFriend ? (
        <span style={{ fontSize: 11.5, color: C.lime, fontWeight: 700, background: C.limeSoft, border: `1px solid ${C.limeBorder}`, borderRadius: 20, padding: "5px 12px" }}>Friends ✓</span>
      ) : sent ? (
        <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px" }}>Sent ✓</span>
      ) : (
        <button
          onClick={handleAdd}
          style={{ padding: "7px 16px", border: `1px solid ${C.limeBorder}`, borderRadius: 9, background: C.limeSoft, color: C.lime, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5, transition: "all .15s" }}
        >+ Add</button>
      )}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────────

const EmptyState: FC<{ icon: string; msg: string }> = ({ icon, msg }) => (
  <div style={{ textAlign: "center", padding: "48px 0", color: C.sub, fontSize: 14 }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
    {msg}
  </div>
);

// ─── Root Page ────────────────────────────────────────────────────────────────────

const FriendsPage: FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  console.log("USER:", user);
console.log("USER ID:", userId);
  const [tab, setTab]                     = useState<TabKey>("friends");
  const [friends, setFriends]             = useState<FriendUser[]>([]);
  const [requests, setRequests]           = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery]     = useState("");
  const [loading, setLoading]             = useState(true);
  const [searching, setSearching]         = useState(false);
  const [toast, fireToast]                = useToast();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId) {
        console.log('[FriendsPage] waiting for userId before loading friends');
        return;
      }
      setLoading(true);
      try {
        console.log('[FriendsPage] loading friends for userId:', userId);
        console.log("Calling FriendAPI.list()");

const [frRes, rqRes] = await Promise.allSettled([
  FriendAPI.list(),
  FriendAPI.requests(),
]);
        console.log('[FriendsPage] FriendAPI.list response', frRes);
        if (!mounted) return;
        if (frRes.status === "fulfilled") {
  const data = frRes.value.data?.data ?? frRes.value.data ?? [];
  const records = Array.isArray(data) ? data : [];
  console.log('[FriendsPage] raw friend records', records);

  const enriched = await Promise.all(
    records.map(async (r: any) => {
      const otherUserId =
  r.requesterId === userId
    ? r.addresseeId
    : r.requesterId;
    console.log("MY ID:", userId);
console.log("REQUESTER:", r.requesterId);
console.log("ADDRESSEE:", r.addresseeId);
console.log("OTHER USER:", otherUserId);
      try {
        const profileRes = await FriendAPI.getUserProfile(otherUserId ?? r.addresseeId ?? r.friendId);
        const profile = profileRes.data?.data ?? profileRes.data;
        return {
  id: otherUserId,
  friendshipId: r.id,
  username:
    profile?.username ||
    profile?.full_name ||
    profile?.email ||
    profile?.["Email id"] ||
    "Unknown",
  email: profile?.email || profile?.["Email id"] || "",
  avatarUrl: profile?.profile_picture_url,
  bio: profile?.bio,
};
  } catch {
  return {
    id: otherUserId,
    friendshipId: r.id,
    username: "Unknown",
    email: "",
  };
}
    })
  );
  setFriends(enriched);
}
       if (rqRes.status === "fulfilled") {
  const data = rqRes.value.data?.data ?? rqRes.value.data ?? [];
  const requests = Array.isArray(data) ? data : [];
  
  // Fetch sender profiles for each request
  const enriched: FriendRequest[] = await Promise.all(
    requests.map(async (r: any) => {
      try {
        const profileRes = await FriendAPI.getUserProfile(r.requesterId);
        const profile = profileRes.data?.data ?? profileRes.data;
        return {
          id: r.id,
          sender: {
            id: r.requesterId,
            username:
              profile?.username ||
              profile?.full_name ||
              profile?.email ||
              profile?.["Email id"] ||
              r.requesterId,
            email: profile?.email || profile?.["Email id"] || "",
            avatarUrl: profile?.profile_picture_url,
            bio: profile?.bio,
          },
          status: r.status,
          createdAt: r.createdAt,
        };
      } catch {
        return {
          id: r.id,
          sender: {
            id: r.requesterId,
            username: r.requesterId,
            email: "",
          },
          status: r.status,
          createdAt: r.createdAt,
        };
      }
    })
  );
  setRequests(enriched);
}
      } catch {
        fireToast("Could not load friends", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fireToast, userId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await FriendAPI.search(searchQuery.trim());
        const data = res.data?.data ?? res.data ?? [];
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        fireToast("Search failed", "error");
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [searchQuery, fireToast]);

  const handleAccept = useCallback(async (id: string) => {
    try {
      await FriendAPI.accept(id);
      const req = requests.find(r => r.id === id);
      if (req) setFriends(prev => [...prev, req.sender]);
      setRequests(prev => prev.filter(r => r.id !== id));
      fireToast("Friend request accepted! 🎉");
    } catch {
      fireToast("Could not accept request", "error");
    }
  }, [requests, fireToast]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await FriendAPI.reject(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      fireToast("Request rejected");
    } catch {
      fireToast("Could not reject request", "error");
    }
  }, [fireToast]);

  const handleRemove = useCallback(async (id: string) => {
    try {
      await FriendAPI.remove(id);
      setFriends(prev => prev.filter(f => f.friendshipId !== id));
      fireToast("Friend removed");
    } catch {
      fireToast("Could not remove friend", "error");
    }
  }, [fireToast]);

  const handleAdd = useCallback(async (id: string) => {
    try {
      await FriendAPI.add(id);
      fireToast("Friend request sent ✓");
    } catch {
      fireToast("Could not send request", "error");
    }
  }, [fireToast]);

  const friendIds = new Set(friends.map(f => f.id));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(6,8,10,.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,.5)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-.2px" }}>
            Mood<span style={{ color: C.lime, textShadow: "0 0 18px rgba(200,245,61,.4)" }}>Chat</span>
            <span style={{ fontSize: 11, color: C.sub, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginLeft: 10, letterSpacing: 0.5 }}>Friends</span>
          </div>
          <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 3, gap: 2 }}>
            {([
              { v: "friends"  as TabKey, l: "👥 Friends" },
              { v: "requests" as TabKey, l: `📬 Requests${requests.length ? ` (${requests.length})` : ""}` },
              { v: "search"   as TabKey, l: "🔍 Search" },
            ]).map(t => (
              <button key={t.v} onClick={() => setTab(t.v)} style={{
                padding: "7px 16px", border: "none", borderRadius: 8, cursor: "pointer",
                background: tab === t.v ? `linear-gradient(135deg,${C.lime},${C.lime})` : "transparent",
                color: tab === t.v ? "#060a06" : C.sub,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5,
                letterSpacing: 0.4, transition: "all .2s",
                boxShadow: tab === t.v ? "0 2px 12px rgba(200,245,61,.3)" : "none",
              }}>{t.l}</button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.sub }}>
           <button
  onClick={() => setTab("friends")}
  style={{
    background: "transparent",
    border: "none",
    color: "#c8f53d",
    cursor: "pointer",
  }}
>
  {friends.length} friends
</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 80px" }}>

        {tab === "friends" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: C.lime, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Your Circle</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1.2 }}>Your <em style={{ color: C.lime, fontStyle: "italic" }}>friends</em></h2>
              <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>{friends.length} connection{friends.length !== 1 ? "s" : ""}</p>
            </div>
            {loading ? <EmptyState icon="⏳" msg="Loading friends..." />
              : friends.length === 0 ? <EmptyState icon="👤" msg="No friends yet. Use Search to find people." />
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{friends.map(f => <FriendCard key={f.id} user={f} onRemove={handleRemove} />)}</div>}
          </div>
        )}

        {tab === "requests" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: C.lime, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Inbox</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1.2 }}>Friend <em style={{ color: C.lime, fontStyle: "italic" }}>requests</em></h2>
              <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>{requests.length} pending</p>
            </div>
            {loading ? <EmptyState icon="⏳" msg="Loading requests..." />
              : requests.length === 0 ? <EmptyState icon="📭" msg="No pending friend requests." />
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{requests.map(r => <RequestCard key={r.id} request={r} onAccept={handleAccept} onReject={handleReject} />)}</div>}
          </div>
        )}

        {tab === "search" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: C.lime, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Discover</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1.2 }}>Find <em style={{ color: C.lime, fontStyle: "italic" }}>people</em></h2>
            </div>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.sub, pointerEvents: "none" }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username or email…"
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px 12px 42px", color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, outline: "none", boxSizing: "border-box" }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.sub, fontSize: 16 }}>✕</button>
              )}
            </div>
            {searching ? <EmptyState icon="⏳" msg="Searching…" />
              : searchQuery && searchResults.length === 0 ? <EmptyState icon="🔎" msg={`No users found for "${searchQuery}"`} />
              : !searchQuery ? <EmptyState icon="👥" msg="Type a name or email to search." />
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{searchResults.map(u => <SearchCard key={u.id} user={u} isFriend={friendIds.has(u.id)} onAdd={handleAdd} />)}</div>}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? C.lime : C.red, color: "#060a06", padding: "10px 24px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 28px rgba(200,245,61,.4)", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;