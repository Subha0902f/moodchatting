import  {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FC,
} from "react";
import "./theme.css";
import { BlogAPI } from "../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BlogType = "free" | "paid";
type TabKey   = "create" | "read";

interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmoji: string;
  authorBg: string;
  preview: string;
  tags: string[];
  type: BlogType;
  date: string;
  readTime: string;
}

interface ToastState {
  msg: string;
  type: "success" | "error";
}

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:         "var(--bg)",
  card:       "var(--card)",
  surface:    "var(--surface)",
  border:     "var(--border)",
  border2:    "var(--border2)",
  text:       "var(--text)",
  textSub:    "var(--text)",
  sub:        "var(--sub)",
  muted:      "var(--sub2)",
  lime:       "var(--lime)",
  limeDim:    "var(--lime)",
  limeSoft:   "rgba(200,245,61,0.08)", // This can be themed as well if needed
  limeBorder: "rgba(200,245,61,0.22)", // This can be themed as well if needed
  red:        "#ff4f4f", // This can be themed as well if needed
};

const mapApiBlog = (blog: any): Blog => ({
  id: String(blog.id),
  title: blog.title,
  content: blog.content,
  author: blog.author?.username || "MoodChat User",
  authorEmoji: "🧑",
  authorBg: "#1a2a1a",
  preview: blog.preview || blog.content?.slice(0, 160) || "",
  tags: Array.isArray(blog.tags) ? blog.tags.map((tag: string) => tag.startsWith("#") ? tag : `#${tag}`) : [],
  type: blog.type || "free",
  date: blog.created_at
    ? new Date(blog.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    : "",
  readTime: `${blog.read_time || 1} min`,
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

function useToast(): [ToastState | null, (msg: string, type?: "success" | "error") => void] {
  const [toast, setToast] = useState<ToastState | null>(null);
   const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fire = useCallback((msg: string, type: "success" | "error" = "success") => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  return [toast, fire];
}

// ─── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: FC<{ emoji: string; bg?: string; size?: number }> = ({ emoji, bg = "#1a2e1a", size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.46, border: "1.5px solid rgba(255,255,255,.06)" }}>
    {emoji}
  </div>
);

// ─── Tag Chip ───────────────────────────────────────────────────────────────────

const Tag: FC<{ label: string }> = ({ label }) => (
  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, background: C.limeSoft, border: `1px solid ${C.limeBorder}`, color: C.lime, borderRadius: 20, padding: "2px 8px" }}>
    {label}
  </span>
);

// ─── Blog Reader Modal ──────────────────────────────────────────────────────────

const BlogModal: FC<{ blog: Blog; onClose: () => void }> = ({ blog, onClose }) => {
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(3,5,7,.92)", backdropFilter: "blur(12px)" }}
    >
      <div style={{ width: 660, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", background: C.card, border: `1px solid ${C.limeBorder}`, borderRadius: 22, boxShadow: "0 40px 100px rgba(0,0,0,.8)" }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${C.lime},transparent)`, opacity: 0.6 }} />
        <div style={{ padding: "28px 32px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {blog.tags.map(t => <Tag key={t} label={t} />)}
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: C.text, lineHeight: 1.3, marginBottom: 8 }}>{blog.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar emoji={blog.authorEmoji} bg={blog.authorBg} size={28} />
                <span style={{ fontSize: 12.5, color: C.sub }}>{blog.author}</span>
                <span style={{ fontSize: 11, color: C.muted }}>·</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{blog.date}</span>
                <span style={{ fontSize: 11, color: C.muted }}>·</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{blog.readTime} read</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: C.surface, border: `1px solid ${C.border2}`, cursor: "pointer", color: C.sub, fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.border},transparent)`, marginBottom: 24 }} />
          {/* Content */}
          <div style={{ fontSize: 15, lineHeight: 1.85, color: C.textSub, fontFamily: "'DM Sans', sans-serif" }}>
            {blog.content.split("\n\n").map((p, i) => <p key={i} style={{ marginBottom: 16 }}>{p}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 1: Create Blog ─────────────────────────────────────────────────────────

const CreateBlog: FC<{ onPublish: (blog: Blog) => Promise<boolean> | boolean }> = ({ onPublish }) => {
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [type, setType]       = useState<BlogType>("free");
  const [publishing, setPublishing] = useState(false);

  const wordCount  = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canPublish = title.trim().length > 0 && content.trim().length > 10;

  const publish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    const published = await onPublish({
      id: "", title: title.trim(), content: content.trim(),
      author: "You", authorEmoji: "🧑", authorBg: "#1a2a1a",
      preview: content.trim().slice(0, 160) + "...",
      tags: ["#personal"], type,
      date: new Date().toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }),
      readTime: Math.max(1, Math.ceil(wordCount / 200)) + " min",
    });
    setPublishing(false);
    if (published) {
      setTitle("");
      setContent("");
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%", background: C.surface,
    border: `1px solid ${focused ? "rgba(200,245,61,.45)" : C.border}`,
    borderRadius: 12, color: C.text, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .2s",
    boxShadow: focused ? "0 0 0 3px rgba(200,245,61,.07)" : "none",
  });

  const [titleFocus, setTitleFocus]     = useState(false);
  const [contentFocus, setContentFocus] = useState(false);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: C.lime, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>New Entry</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1.2 }}>
          Write your <em style={{ color: C.lime, fontStyle: "italic" }}>story</em>
        </h2>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Put your thoughts into words. Share what moves you.</p>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10.5, color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 7 }}>Title</label>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          onFocus={() => setTitleFocus(true)} onBlur={() => setTitleFocus(false)}
          placeholder="Give your post a compelling title…"
          style={{ ...inputStyle(titleFocus), padding: "13px 16px", fontFamily: "'DM Serif Display', serif", fontSize: 18 }}
        />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 4, padding: "6px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px 10px 0 0", borderBottom: "none" }}>
        {["B", "I", "U", '"', "—", "# H1", "## H2"].map(t => (
          <button key={t} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.sub, cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>{t}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{wordCount} words</span><span>{content.length} chars</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginBottom: 18 }}>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          onFocus={() => setContentFocus(true)} onBlur={() => setContentFocus(false)}
          placeholder="Start writing… your thoughts, your story, your truth."
          rows={12}
          style={{ ...inputStyle(contentFocus), padding: "14px 16px", fontSize: 14.5, lineHeight: 1.8, resize: "vertical", borderRadius: "0 0 12px 12px" }}
        />
      </div>

      {/* Type + Publish */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Type selector */}
        <div style={{ display: "flex", background: "#0a0c0e", borderRadius: 10, padding: 3, border: `1px solid ${C.border}`, gap: 2 }}>
          {([
            { v: "free" as BlogType, label: "🆓 Free",  disabled: false },
            { v: "paid" as BlogType, label: "💎 Paid",  disabled: true  },
          ]).map(o => (
            <button
              key={o.v}
              onClick={() => !o.disabled && setType(o.v)}
              disabled={o.disabled}
              style={{
                padding: "7px 16px", border: "none", borderRadius: 8,
                cursor: o.disabled ? "not-allowed" : "pointer",
                background: type === o.v ? `linear-gradient(135deg,${C.lime},${C.limeDim})` : "transparent",
                color: type === o.v ? "#060a06" : o.disabled ? C.muted : C.sub,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12,
                letterSpacing: 0.5, opacity: o.disabled ? 0.4 : 1, position: "relative",
              }}
            >
              {o.label}
              {o.disabled && (
                <span style={{ position: "absolute", top: -6, right: -2, fontSize: 8, background: C.border2, color: C.sub, padding: "1px 5px", borderRadius: 20, fontWeight: 700, letterSpacing: 0.5 }}>
                  SOON
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Publish button */}
        <button
          onClick={publish}
          disabled={!canPublish || publishing}
          style={{
            flex: 1, padding: "12px 24px", border: "none", borderRadius: 11,
            cursor: canPublish && !publishing ? "pointer" : "not-allowed",
            background: canPublish && !publishing ? `linear-gradient(135deg,${C.lime},${C.limeDim})` : C.border,
            color: canPublish && !publishing ? "#060a06" : C.muted,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
            letterSpacing: 0.8, textTransform: "uppercase",
            boxShadow: canPublish && !publishing ? "0 4px 22px rgba(200,245,61,.3)" : "none",
            transition: "all .2s",
          }}
        >
          {canPublish ? "Publish Post ➤" : "Fill in title & content to publish"}
        </button>
      </div>
    </div>
  );
};

// ─── Blog Card ──────────────────────────────────────────────────────────────────

const BlogCard: FC<{ blog: Blog; saved: boolean; onSave: (id: string) => void; onRead: (blog: Blog) => void }> = ({ blog, saved, onSave, onRead }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.card, border: `1px solid ${hov ? "rgba(200,245,61,.25)" : C.border}`, borderRadius: 18, overflow: "hidden", transition: "all .2s", boxShadow: hov ? "0 0 32px rgba(200,245,61,.07)" : "none" }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${hov ? C.lime : C.border},transparent)`, transition: "all .3s", opacity: 0.6 }} />
      <div style={{ padding: "18px 20px 16px" }}>
        {/* Tags + read time */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {blog.tags.map(t => <Tag key={t} label={t} />)}
          <span style={{ marginLeft: "auto", fontSize: 10.5, color: C.sub }}>{blog.readTime} read</span>
        </div>
        {/* Title */}
        <h3
          onClick={() => onRead(blog)}
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, fontWeight: 400, color: C.text, lineHeight: 1.35, marginBottom: 8, cursor: "pointer", transition: "color .15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = C.lime)}
          onMouseLeave={e => (e.currentTarget.style.color = C.text)}
        >{blog.title}</h3>
        {/* Preview */}
        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, marginBottom: 14, display: "-webkit-box" as any, WebkitLineClamp: 3 as any, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
          {blog.preview}
        </p>
        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar emoji={blog.authorEmoji} bg={blog.authorBg} size={28} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textSub }}>{blog.author}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{blog.date}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={() => onRead(blog)} style={{ padding: "7px 14px", border: `1px solid ${C.border2}`, borderRadius: 9, background: "transparent", color: C.sub, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11.5, transition: "all .15s" }}>Read →</button>
            <button
              onClick={() => onSave(blog.id)}
              style={{ padding: "7px 14px", border: `1px solid ${saved ? "rgba(200,245,61,.35)" : C.border2}`, borderRadius: 9, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5, background: saved ? C.limeSoft : "transparent", color: saved ? C.lime : C.sub, transition: "all .15s" }}
            >
              {saved ? "✓ Saved" : "⊕ Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 2: Read Blogs ──────────────────────────────────────────────────────────

const ReadBlogs: FC<{ blogs: Blog[]; savedIds: Set<string>; onSave: (id: string) => void; onRead: (blog: Blog) => void }> = ({ blogs, savedIds, onSave, onRead }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? blogs.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q))) : blogs;
  }, [blogs, search]);

  const savedBlogs = blogs.filter(b => savedIds.has(b.id));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: C.lime, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Discover</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1.2 }}>
          Read & <em style={{ color: C.lime, fontStyle: "italic" }}>explore</em>
        </h2>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>{blogs.length} posts from the community</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.sub, pointerEvents: "none" }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, author, or hashtag…"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px 12px 42px", color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, outline: "none" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.sub, fontSize: 16 }}>✕</button>
        )}
      </div>

      {/* Result count */}
      {search && <div style={{ fontSize: 12, color: C.sub, marginBottom: 14 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"</div>}

      {/* Blog cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "40px 0", color: C.sub, fontSize: 14 }}><div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>No posts found</div>
          : filtered.map(b => <BlogCard key={b.id} blog={b} saved={savedIds.has(b.id)} onSave={onSave} onRead={onRead} />)
        }
      </div>

      {/* Saved section */}
      {savedBlogs.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.limeSoft, border: `1px solid ${C.limeBorder}`, borderRadius: 20, padding: "5px 14px", fontSize: 11.5, fontWeight: 700, color: C.lime, letterSpacing: 0.5 }}>
              🔖 Saved ({savedBlogs.length})
            </div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {savedBlogs.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.card, border: `1px solid ${C.limeBorder}`, borderRadius: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => onRead(b)}
                    style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: C.text, cursor: "pointer", transition: "color .15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.lime)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                  >{b.title}</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{b.author} · {b.readTime} read</div>
                </div>
                <button onClick={() => onSave(b.id)} style={{ padding: "5px 12px", border: "1px solid rgba(255,79,79,.2)", borderRadius: 8, background: "transparent", color: C.red, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11 }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Root App ───────────────────────────────────────────────────────────────────

const BlogSystem: FC = () => {
  const [tab, setTab]               = useState<TabKey>("create");
  const [blogs, setBlogs]           = useState<Blog[]>([]);
  const [savedIds, setSavedIds]     = useState<Set<string>>(new Set());
  const [readingBlog, setReading]   = useState<Blog | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toast, fireToast]          = useToast();

  useEffect(() => {
    let mounted = true;

    Promise.all([BlogAPI.list(), BlogAPI.saved()])
      .then(([blogResponse, savedResponse]) => {
        if (!mounted) return;

        const loadedBlogs = (blogResponse.data?.data ?? []).map(mapApiBlog);
        const loadedSaved = (savedResponse.data?.data ?? []).map(mapApiBlog);

        setBlogs(loadedBlogs);
        setSavedIds(new Set(loadedSaved.map((blog: Blog) => blog.id)));
        console.log(`[blog-ui] loaded ${loadedBlogs.length} blog(s), ${loadedSaved.length} saved`);
      })
      .catch((error) => {
        console.error("[blog-ui] failed to load blogs:", error);
        setBlogs([]);
        fireToast("Could not load blogs from the server", "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fireToast]);

  const publish = useCallback(async (blog: Blog) => {
    try {
      const response = await BlogAPI.create({
        title: blog.title,
        content: blog.content,
        preview: blog.preview,
        type: blog.type,
        status: "published",
        tags: blog.tags.map((tag) => tag.replace(/^#/, "")),
        read_time: parseInt(blog.readTime, 10) || 1,
      });
      const savedBlog = mapApiBlog(response.data?.data);
      setBlogs(prev => [savedBlog, ...prev.filter((entry) => entry.id !== savedBlog.id)]);
      setTab("read");
      console.log(`[blog-ui] published blog ${savedBlog.id}`);
    fireToast("Post published! 🎉");
      return true;
    } catch (error) {
      console.error("[blog-ui] publish failed:", error);
      fireToast("Could not publish post", "error");
      return false;
    }
  }, [fireToast]);

  const toggleSave = useCallback(async (id: string) => {
    const wasSaved = savedIds.has(id);
    try {
      if (wasSaved) await BlogAPI.unsave(id);
      else await BlogAPI.save(id);

      setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); fireToast("Removed from saved"); }
      else              { next.add(id);    fireToast("Saved to your list ✓"); }
      return next;
      });
      console.log(`[blog-ui] ${wasSaved ? "unsaved" : "saved"} blog ${id}`);
    } catch (error) {
      console.error("[blog-ui] save toggle failed:", error);
      fireToast("Could not update saved blogs", "error");
    }
  }, [fireToast, savedIds]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sticky top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(6,8,10,.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,.5)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand */}
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-.2px" }}>
            Mood<span style={{ color: C.lime, textShadow: "0 0 18px rgba(200,245,61,.4)" }}>Chat</span>
            <span style={{ fontSize: 11, color: C.sub, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginLeft: 10, letterSpacing: 0.5 }}>Blog</span>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 3, gap: 2 }}>
            {([{ v: "create" as TabKey, l: "✍️ Write" }, { v: "read" as TabKey, l: "📖 Read" }]).map(t => (
              <button key={t.v} onClick={() => setTab(t.v)} style={{ padding: "7px 18px", border: "none", borderRadius: 8, cursor: "pointer", background: tab === t.v ? `linear-gradient(135deg,${C.lime},${C.limeDim})` : "transparent", color: tab === t.v ? "#060a06" : C.sub, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, transition: "all .2s", boxShadow: tab === t.v ? "0 2px 12px rgba(200,245,61,.3)" : "none" }}>
                {t.l}
              </button>
            ))}
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: C.sub }}>
            <span><span style={{ color: C.lime, fontWeight: 700 }}>{loading ? "..." : blogs.length}</span> posts</span>
            <span><span style={{ color: C.lime, fontWeight: 700 }}>{savedIds.size}</span> saved</span>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 80px", position: "relative", zIndex: 1 }}>
        {tab === "create"
          ? <CreateBlog onPublish={publish} />
          : <ReadBlogs blogs={blogs} savedIds={savedIds} onSave={toggleSave} onRead={setReading} />
        }
      </div>

      {/* Reading modal */}
      {readingBlog && <BlogModal blog={readingBlog} onClose={() => setReading(null)} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? C.lime : C.red, color: "#060a06", padding: "10px 24px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 28px rgba(200,245,61,.4)", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default BlogSystem;
