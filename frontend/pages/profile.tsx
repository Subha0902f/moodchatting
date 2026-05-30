import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserAPI } from "../services/api";
import { getProfile, getFriendsForUser } from "../services/userservice";

// Icons
const IconDots = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>;
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconPhone = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconCopy = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;

// Theme variables for profile page styling
const V = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  surface2: "var(--card)",
  surface3: "var(--card2)",
  border: "var(--border)",
  border2: "var(--border2)",
  text: "var(--text)",
  muted: "var(--sub)",
  sub: "var(--sub)",
  sub2: "var(--sub2)",
  lime: "var(--lime)",
  limeGlow: "var(--lime-glow)",
  error: "var(--logout-color)",
  profileAvatarGradient: "var(--profile-avatar-gradient)",
  hoverItemBg: "var(--hover-item-bg)",
};

// Types
interface Friend {
  id: string;
  name: string;
  initials: string;
  active?: boolean;
  online?: boolean;
}

interface Mode {
  id: string;
  name: string;
  icon: string;
  description: string;
  action: string;
  active?: boolean;
}

interface ProfileData {
  initials: string;
  fullName: string;
  handle: string;
  bio: string;
  about: string;
  hashtags: string[];
  email: string;
  phone: string;
  profilePictureUrl?: string;
  stats: { label: string; value: string }[];
  friends: Friend[];
  modes: Mode[];
  profileLink: string;
}

// Constants
const MOTIVATIONAL_QUOTES = [
  "Every mood is temporary, but your strength is permanent.",
  "You are capable of amazing things today.",
  "Progress, not perfection.",
  "Your vibe attracts your people.",
  "Believe you can and you're halfway there.",
  "The only limit is the one you set.",
  "Choose your mood wisely today.",
  "You've got this!",
  "Radiate positivity.",
  "Create the mood you want to live in.",
  "Your energy is contagious.",
  "Celebrate small wins today.",
];

const MODES: Mode[] = [
  {
    id: "chat",
    name: "Chat",
    icon: "ðŸ’¬",
    description: "Reach out and connect with friends",
    action: "chat",
    active: true,
  },
  {
    id: "hype",
    name: "Hype",
    icon: "ðŸ”¥",
    description: "Get motivated with daily affirmations",
    action: "hype",
  },
  {
    id: "calm",
    name: "Calm",
    icon: "ðŸ§˜",
    description: "Take a moment to breathe and reset",
    action: "calm",
  },
  {
    id: "notes",
    name: "Notes",
    icon: "ðŸ“",
    description: "Jot down your thoughts",
    action: "notes",
  },
];

// Utility functions
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) return { valid: false, error: "File size must be under 5MB" };
  if (!allowedTypes.includes(file.type)) return { valid: false, error: "Only JPEG, PNG, and WebP supported" };
  return { valid: true };
};

// Components
const SectionDivider = () => (
  <div style={{ height: 1, background: V.border, margin: "1.5rem 0", opacity: 0.5 }} />
);

const SectionHeader = ({ title, link }: { title: string; link?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
    <span style={{ color: V.text }}>{title}</span>
    {link && <span style={{ color: V.lime, cursor: "pointer" }}>{link}</span>}
  </div>
);

const QRCode = () => (
  <div style={{ width: 60, height: 60, background: V.surface3, border: `1px solid ${V.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontSize: 8, color: V.muted }}>
    QR
  </div>
);

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => void;
  onRemove: () => void;
  currentUrl?: string;
  userId?: string;
}

const ProfilePictureModal = ({ isOpen, onClose, onUpload, onRemove, currentUrl, userId }: ProfilePictureModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFile(null);
    setPreview(currentUrl ?? null);
    setError("");
    setSuccess("");
  }, [isOpen, currentUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error: validationError } = validateImageFile(file);
    if (!valid) {
      setError(validationError || "Invalid file");
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError("Select a file before saving.");
      return;
    }
    if (!userId) {
      setError("Unable to determine current user.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const url = await UserAPI.uploadProfilePicture(selectedFile, userId);
      onUpload(url);
      setSuccess("Profile picture updated successfully.");
      setSelectedFile(null);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!userId) {
      setError("Unable to determine current user.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await UserAPI.deleteProfilePicture(userId);
      await onRemove();
      setSuccess("Profile picture removed.");
      setPreview(null);
      setSelectedFile(null);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
      <div style={{ width: "100%", background: V.surface, borderTop: `1px solid ${V.border}`, borderRadius: "12px 12px 0 0", padding: "1.5rem 1.25rem", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: "1rem", color: V.text }}>Update Profile Picture</div>

        {error && <div style={{ padding: 10, borderRadius: 6, background: V.error, color: V.surface, fontSize: 12, marginBottom: "1rem" }}>{error}</div>}
        {success && <div style={{ padding: 10, borderRadius: 6, background: V.lime, color: V.bg, fontSize: 12, marginBottom: "1rem" }}>{success}</div>}

        {preview && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: V.surface2, border: `2px solid ${V.lime}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: `1px solid ${V.lime}`, background: "transparent", color: V.lime, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Processing..." : "Select Photo"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: "none" }} />

        {selectedFile && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", marginTop: "0.75rem", padding: "12px 0", borderRadius: 8, border: "none", background: V.lime, color: V.bg, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving..." : "Save Photo"}
          </button>
        )}

        {currentUrl && !selectedFile && (
          <button
            onClick={handleRemove}
            disabled={saving}
            style={{ width: "100%", marginTop: "0.75rem", padding: "10px 0", borderRadius: 8, border: `1px solid ${V.error}`, background: "transparent", color: V.error, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Removing..." : "Remove Picture"}
          </button>
        )}

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: "0.75rem", padding: "10px 0", borderRadius: 8, border: "none", background: V.surface2, color: V.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

interface AboutEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (about: string) => void;
  initialValue: string;
}

const AboutEditor = ({ isOpen, onClose, onSave, initialValue }: AboutEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
      <div style={{ width: "100%", background: V.surface, borderTop: `1px solid ${V.border}`, borderRadius: "12px 12px 0 0", padding: "1.5rem 1.25rem", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: "1rem", color: V.text }}>About You</div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={300}
          style={{ width: "100%", minHeight: 120, padding: 12, borderRadius: 8, border: `1px solid ${V.border}`, background: V.surface2, color: V.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: "1rem", resize: "vertical" }}
          placeholder="Tell us about yourself..."
        />
        <div style={{ fontSize: 11, color: V.muted, marginBottom: "1rem" }}>{value.length}/300</div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: V.lime, color: V.bg, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1, marginBottom: "0.75rem" }}
        >
          {saving ? "Saving..." : "Save About"}
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: V.surface2, color: V.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

interface HypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HypeModal = ({ isOpen, onClose }: HypeModalProps) => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const cachedQuote = localStorage.getItem("hype_quote");
    const cacheTime = localStorage.getItem("hype_quote_time");
    const now = Date.now();

    if (cachedQuote && cacheTime && now - parseInt(cacheTime) < 24 * 60 * 60 * 1000) {
      setQuote(cachedQuote);
    } else {
      const newQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setQuote(newQuote);
      localStorage.setItem("hype_quote", newQuote);
      localStorage.setItem("hype_quote_time", String(now));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
      <div style={{ width: "100%", background: V.surface, borderTop: `2px solid ${V.lime}`, borderRadius: "12px 12px 0 0", padding: "2rem 1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: "1rem" }}>ðŸ”¥</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: V.lime, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Hype</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: V.text, marginBottom: "1.5rem", lineHeight: 1.6 }}>"{quote}"</div>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: V.lime, color: V.bg, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

interface CalmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalmModal = ({ isOpen, onClose }: CalmModalProps) => {
  const [duration, setDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft === null) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          setIsRunning(false);
          if (Notification.permission === "granted") {
            new Notification("Calm Mode", { body: "Your calm moment is complete! ðŸ§˜" });
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
      <div style={{ width: "100%", background: V.surface, borderTop: `2px solid ${V.lime}`, borderRadius: "12px 12px 0 0", padding: "2rem 1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: "1rem" }}>ðŸ§˜</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: V.lime, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Calm Mode</div>

        {!isRunning || timeLeft === null ? (
          <>
            <div style={{ fontSize: 13, color: V.muted, marginBottom: "1.5rem" }}>How long would you like to breathe?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: "1.5rem" }}>
              {[5, 10, 15, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    setDuration(min);
                    setTimeLeft(min * 60);
                    setIsRunning(true);
                  }}
                  style={{ padding: "8px 0", borderRadius: 8, border: `1px solid ${duration === min ? V.lime : V.border}`, background: duration === min ? V.limeGlow : "transparent", color: duration === min ? V.lime : V.text, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {min}m
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setTimeLeft(duration * 60);
                setIsRunning(true);
              }}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: V.lime, color: V.bg, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Start Breathing
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: V.lime, marginBottom: "1.5rem" }}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
            <div style={{ height: 4, background: V.surface2, borderRadius: 2, marginBottom: "1.5rem", overflow: "hidden" }}>
              <div style={{ height: "100%", background: V.lime, width: `${((duration * 60 - timeLeft) / (duration * 60)) * 100}%`, transition: "width 1s linear" }} />
            </div>
            <button
              onClick={() => {
                setIsRunning(false);
                onClose();
              }}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: `1px solid ${V.lime}`, background: "transparent", color: V.lime, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Stop & Exit
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function ProfilePage() {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams<{ userId?: string }>();
  const { user, loading } = useAuth();

  const [remoteProfile, setRemoteProfile] = useState<Record<string, any> | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [hypeModalOpen, setHypeModalOpen] = useState(false);
  const [calmModalOpen, setCalmModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const profileUserId = paramUserId || user?.id;

    if (!profileUserId) {
      setRemoteProfile(null);
      setFriends([]);
      return;
    }

    const loadProfileData = async () => {
      try {
        setProfileLoading(true);
        const { data } = await getProfile(profileUserId);
        if (mounted) setRemoteProfile(data ?? null);

        if (!paramUserId || paramUserId === user?.id) {
          const friendsList = await getFriendsForUser(profileUserId);
          if (mounted) setFriends(friendsList);
        }
      } catch {
        if (mounted) {
          setRemoteProfile(null);
          setFriends([]);
        }
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, [user?.id, paramUserId]);

  const p = useMemo<ProfileData>(() => {
    const metadata = user?.user_metadata ?? {};
    const email = user?.email ?? "";
    const fullName = remoteProfile?.full_name || remoteProfile?.name || metadata.full_name || metadata.name || metadata.username || (user ? email.split("@")[0] : "User");
    const username = remoteProfile?.username || metadata.username || String(fullName).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "moodchat";
    const origin = typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;

    return {
      initials: getInitials(String(fullName || email)),
      fullName: String(fullName || "User"),
      handle: `@${String(username).replace(/^@/, "")}`,
      bio: remoteProfile?.bio || metadata.bio || "Living in the moment.",
      about: remoteProfile?.about || "",
      hashtags: remoteProfile?.hashtags || [],
      email,
      phone: remoteProfile?.phone || "Add phone",
      profilePictureUrl: remoteProfile?.profile_picture_url,
      stats: [
        { label: "Friends", value: String(friends.length) },
        { label: "Chats", value: "0" },
        { label: "Modes", value: String(MODES.length) },
      ],
      friends,
      modes: MODES,
      profileLink: `${origin}/profile/${paramUserId || user?.id || "me"}`,
    };
  }, [remoteProfile, user, friends, paramUserId]);

  const handleProfilePictureUpload = async (url: string) => {
    try {
      await UserAPI.update({ profilePictureUrl: url });
      setRemoteProfile((prev) => ({ ...prev, profile_picture_url: url }));
    } catch (error) {
      console.error("Failed to save profile picture:", error);
    }
  };

  const handleProfilePictureRemove = async () => {
    try {
      await UserAPI.update({ profilePictureUrl: null });
      setRemoteProfile((prev) => ({ ...prev, profile_picture_url: null }));
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
    }
  };

  const handleAboutSave = async (about: string) => {
    try {
      await UserAPI.update({ about });
      setRemoteProfile((prev) => ({ ...prev, about }));
    } catch (error) {
      console.error("Failed to save about:", error);
    }
  };

  const handleCopy = () => {
    if (!p.profileLink) return;
    navigator.clipboard
      ?.writeText(p.profileLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const handleModeAction = (action: string) => {
    switch (action) {
      case "chat":
        navigate("/chat");
        break;
      case "hype":
        setHypeModalOpen(true);
        break;
      case "calm":
        setCalmModalOpen(true);
        break;
      case "notes":
        navigate("/notepad");
        break;
    }
  };

  const handleFriendClick = (friendId: string) => {
    navigate(`/profile/${friendId}`);
  };

  if (loading || profileLoading) {
    return (
      <div style={{ background: V.bg, color: V.lime, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace" }}>
        Loading profile...
      </div>
    );
  }

  const isOwnProfile = !paramUserId || paramUserId === user?.id;

  return (
    <div style={{ background: V.bg, fontFamily: "'DM Sans', sans-serif", color: V.text, minHeight: "100vh", paddingBottom: "3rem", maxWidth: 480, margin: "0 auto" }}>
      {/* Top bar */}
      <div style={{ height: 52, background: V.surface, borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: V.lime, letterSpacing: "0.08em" }}>// PROFILE</span>
        <div style={{ width: 28, height: 28, border: `1px solid ${V.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: V.surface2, cursor: "pointer" }}>
          <IconDots />
        </div>
      </div>

      {/* Hero section */}
      <div style={{ background: `linear-gradient(180deg, ${V.surface} 0%, ${V.bg} 100%)`, padding: "2rem 1.25rem 0", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: V.lime }} />

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                border: `2.5px solid ${V.lime}`,
                padding: 3,
                background: V.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {p.profilePictureUrl ? (
                <img src={p.profilePictureUrl} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: V.lime }}>
                  {p.initials}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 18, height: 18, background: V.lime, borderRadius: "50%", border: `2px solid ${V.bg}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconCheck />
              </div>
            )}
          </div>

          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 19, fontWeight: 700, color: V.text, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              {p.fullName}
            </div>
            <div style={{ fontSize: 12, color: V.lime, marginTop: 3, fontFamily: "'Space Mono', monospace", letterSpacing: "0.04em" }}>
              {p.handle}
            </div>
            <div style={{ display: "flex", gap: "1.25rem", marginTop: 8 }}>
              {p.stats.map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: V.lime }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: V.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setUploadModalOpen(true)}
                style={{
                  marginTop: 14,
                  borderRadius: 999,
                  border: `1px solid ${V.border}`,
                  background: V.surface2,
                  color: V.text,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "10px 14px",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                }}
              >
                Change photo
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: V.muted, marginBottom: "1rem" }}>
          <span style={{ color: V.text }}>{p.bio}</span>
        </p>

        {/* Hashtags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.25rem" }}>
          {p.hashtags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", padding: "4px 10px", borderRadius: 100, border: `1px solid ${V.border}`, color: V.lime, background: V.limeGlow, letterSpacing: "0.03em", cursor: "pointer" }}>
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
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, background: V.surface2, border: `1px solid ${V.surface3}`, borderRadius: 8, padding: "6px 10px", color: V.muted, flex: 1, overflow: "hidden" }}>
              {icon}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          <button onClick={() => navigate(user ? "/settings" : "/login")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", background: V.lime, color: V.bg }}>
            {isOwnProfile ? "Edit Profile" : "Add Friend"}
          </button>
          <button onClick={handleCopy} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "transparent", color: V.lime, border: `1px solid ${V.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "Copied!" : "Share"}
          </button>
        </div>

        {/* Share panel */}
        {isOwnProfile && (
          <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 12, padding: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: V.muted, marginBottom: 12, fontFamily: "'Space Mono', monospace" }}>
              Share options
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 7, background: V.surface2, border: `1px solid ${copied ? V.lime : V.surface3}`, borderRadius: 8, padding: "8px 12px", color: copied ? V.lime : V.text, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s" }}>
                  <IconCopy />
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <div style={{ fontSize: 10, color: V.muted, padding: "0 2px" }}>
                  {p.profileLink}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <QRCode />
                <span style={{ fontSize: 9, color: V.muted, fontFamily: "'Space Mono', monospace" }}>QR</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <SectionDivider />

      {/* About section */}
      {(p.about || isOwnProfile) && (
        <>
          <div style={{ padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: V.text, marginBottom: 6 }}>
                  About
                </div>
                <div style={{ fontSize: 13, color: V.muted, lineHeight: 1.6, maxWidth: "85%" }}>
                  {p.about || "No about info yet"}
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setAboutModalOpen(true)}
                  style={{ fontSize: 12, color: V.lime, background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          <SectionDivider />
        </>
      )}

      {/* Friends section */}
      {friends.length > 0 && (
        <>
          <SectionHeader title="Friends" link={`See all ${friends.length} ->`} />
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 1.25rem 0.75rem", scrollbarWidth: "none" }}>
            {friends.map((f) => (
              <div
                key={f.id}
                style={{ flexShrink: 0, width: 68, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
                onClick={() => handleFriendClick(f.id)}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: f.active ? V.limeGlow : V.surface3,
                      border: `1.5px solid ${f.active ? V.lime : V.surface3}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: f.active ? V.lime : V.muted,
                    }}
                  >
                    {f.initials}
                  </div>
                  {f.online && (
                    <div style={{ width: 8, height: 8, background: V.lime, borderRadius: "50%", border: `1.5px solid ${V.bg}`, position: "absolute", bottom: 1, right: 1 }} />
                  )}
                </div>
                <div style={{ fontSize: 10, color: V.muted, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {f.name}
                </div>
              </div>
            ))}
          </div>
          <SectionDivider />
        </>
      )}

      {/* Modes section */}
      <SectionHeader title="Modes" link="Manage ->" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 1.25rem" }}>
        {p.modes.map((m) => (
          <div
            key={m.id}
            onClick={() => handleModeAction(m.action)}
            style={{
              background: m.active ? V.limeGlow : V.surface,
              border: `1px solid ${m.active ? V.lime : V.surface3}`,
              borderRadius: 10,
              padding: 12,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20, display: "block", marginBottom: 6 }}>
              {m.icon}
            </span>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: m.active ? V.lime : V.text, marginBottom: 3 }}>
              {m.name}
            </div>
            <div style={{ fontSize: 10, color: V.muted, lineHeight: 1.4 }}>
              {m.description}
            </div>
            {m.active && (
              <span style={{ display: "inline-block", fontSize: 9, fontFamily: "'Space Mono', monospace", padding: "2px 6px", borderRadius: 4, marginTop: 5, background: V.limeGlow, color: V.lime, letterSpacing: "0.04em" }}>
                ACTIVE
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      <ProfilePictureModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleProfilePictureUpload}
        onRemove={handleProfilePictureRemove}
        currentUrl={p.profilePictureUrl}
        userId={user?.id}
      />
      <AboutEditor isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} onSave={handleAboutSave} initialValue={p.about} />
      <HypeModal isOpen={hypeModalOpen} onClose={() => setHypeModalOpen(false)} />
      <CalmModal isOpen={calmModalOpen} onClose={() => setCalmModalOpen(false)} />
    </div>
  );
}

