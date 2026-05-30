import { useEffect, useState } from "react";
import "./theme.css";
import { useTheme } from "../context/ThemeContext";

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #080808;
  --surface:   #0f0f0f;
  --card:      #141414;
  --card2:     #191919;
  --border:    #222;
  --border2:   #2a2a2a;
  --lime:      #c8f135;
  --lime-dim:  rgba(200,241,53,.13);
  --lime-glow: rgba(200,241,53,.28);
  --text:      #ececec;
  --sub:       #666;
  --sub2:      #3a3a3a;
  --danger:    #ff4d4d;
  --warn:      #ffa940;
  --pro:       #4d9fff;
  --fun:       #ff6bcb;
  --priv:      #9b59ff;
}

body { background: var(--bg); font-family: 'Syne', sans-serif; color: var(--text); min-height:100vh; }

/* scrollbar */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background: var(--sub2); border-radius:2px; }
::-webkit-scrollbar-track { background: transparent; }

.wrap {
  max-width: 780px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

/* PAGE HEADER */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 48px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 24px;
}
.page-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing:.22em;
  color: var(--lime);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.page-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1;
}
.page-badge {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing:.12em;
  color: var(--sub);
  border: 1px solid var(--border2);
  padding: 4px 10px;
  text-transform: uppercase;
}

/* SECTION */
.section {
  margin-bottom: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  overflow: hidden;
  animation: fadeUp .35s ease both;
}
.section:nth-child(1){ animation-delay:.05s; }
.section:nth-child(2){ animation-delay:.12s; }
.section:nth-child(3){ animation-delay:.19s; }
.section:nth-child(4){ animation-delay:.26s; }

@keyframes fadeUp {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}

.section-head {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid transparent;
  transition: background .15s;
}
.section-head:hover { background: var(--lime-dim); }
.section-head.open  { border-bottom-color: var(--border); }

.section-num {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing:.12em;
  color: var(--lime);
  border: 1px solid var(--lime);
  padding: 2px 6px;
  flex-shrink: 0;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing:.04em;
  text-transform: uppercase;
  flex: 1;
}
.section-chevron {
  color: var(--sub);
  transition: transform .25s ease;
  flex-shrink: 0;
}
.section-chevron.open { transform: rotate(180deg); color: var(--lime); }

.section-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* FIELD ROW */
.field { display:flex; flex-direction:column; gap:8px; }
.field-label {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing:.14em;
  color: var(--sub);
  text-transform: uppercase;
}

/* SEGMENTED TOGGLE */
.seg {
  display: flex;
  background: var(--card);
  border: 1px solid var(--border2);
  padding: 3px;
  gap: 3px;
}
.seg-btn {
  flex: 1;
  padding: 9px 12px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing:.06em;
  text-transform: uppercase;
  border: none;
  background: transparent;
  color: var(--sub);
  cursor: pointer;
  transition: all .15s ease;
  white-space: nowrap;
}
.seg-btn:hover:not(.active) { color: var(--text); background: var(--card2); }
.seg-btn.active {
  background: var(--lime);
  color: var(--bg);
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%);
}

/* PILL SELECT */
.pills { display:flex; flex-wrap:wrap; gap:8px; }
.pill {
  padding: 7px 16px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing:.1em;
  text-transform: uppercase;
  border: 1px solid var(--border2);
  background: var(--card);
  color: var(--sub);
  cursor: pointer;
  transition: all .15s;
}
.pill:hover:not(.active) { border-color: var(--sub); color: var(--text); }
.pill.active {
  border-color: var(--lime);
  color: var(--lime);
  background: var(--lime-dim);
  box-shadow: inset 0 0 0 1px var(--lime-dim);
}

/* THEME SWITCH */
.theme-cards { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.theme-card {
  padding: 18px 16px;
  border: 2px solid var(--border2);
  cursor: pointer;
  transition: all .18s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  overflow: hidden;
}
.theme-card.light-card { background: #f5f5f5; }
.theme-card.dark-card  { background: var(--card); }
.theme-card.active.light-card { border-color: var(--lime); }
.theme-card.active.dark-card  { border-color: var(--lime); }
.theme-card-preview {
  height: 56px;
  border-radius: 2px;
  display:flex;
  gap:6px;
  align-items: flex-start;
  padding: 8px;
}
.theme-card.light-card .theme-card-preview { background:#e0e0e0; }
.theme-card.dark-card  .theme-card-preview { background:#0a0a0a; }
.theme-bar { height:6px; border-radius:1px; }
.light-bars .theme-bar:nth-child(1){ width:60px; background:#333; }
.light-bars .theme-bar:nth-child(2){ width:40px; background:#999; margin-top:4px; }
.dark-bars  .theme-bar:nth-child(1){ width:60px; background:#eee; }
.dark-bars  .theme-bar:nth-child(2){ width:40px; background:#555; margin-top:4px; }
.theme-bar-wrap { display:flex; flex-direction:column; flex:1; }
.theme-dot { width:18px; height:18px; border-radius:50%; flex-shrink:0; }
.light-card .theme-dot { background: #c8f135; }
.dark-card  .theme-dot { background: #c8f135; }
.theme-name {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing:.1em;
  text-transform: uppercase;
}
.light-card .theme-name { color:#111; }
.dark-card  .theme-name { color:var(--text); }
.theme-check {
  position:absolute;
  top: 10px; right: 10px;
  width:18px; height:18px;
  background: var(--lime);
  display: flex; align-items:center; justify-content:center;
  opacity:0;
  transition:opacity .15s;
}
.theme-card.active .theme-check { opacity:1; }

/* MODE CONFIG */
.mode-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:10px; }
.mode-card {
  border: 1px solid var(--border2);
  background: var(--card);
  overflow: hidden;
}
.mode-card-head {
  padding: 10px 14px 8px;
  display:flex; align-items:center; gap:8px;
  border-bottom: 1px solid var(--border);
}
.mode-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.mode-dot.pro  { background: var(--pro); box-shadow:0 0 8px var(--pro); }
.mode-dot.fun  { background: var(--fun); box-shadow:0 0 8px var(--fun); }
.mode-dot.priv { background: var(--priv); box-shadow:0 0 8px var(--priv); }
.mode-name {
  font-family:'Space Mono', monospace;
  font-size:10px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
}
.mode-name.pro  { color:var(--pro); }
.mode-name.fun  { color:var(--fun); }
.mode-name.priv { color:var(--priv); }
.mode-body { padding:10px 14px 14px; }
.mode-input {
  width:100%;
  background: var(--card2);
  border: 1px solid var(--border2);
  color: var(--text);
  font-family:'Space Mono', monospace;
  font-size:10px;
  padding: 8px 10px;
  outline:none;
  margin-bottom:8px;
  transition: border-color .15s;
}
.mode-input:focus { border-color: var(--lime); }
.mode-input::placeholder { color:var(--sub2); }
.mode-tags { display:flex; flex-wrap:wrap; gap:5px; min-height:24px; }
.mode-tag {
  font-family:'Space Mono', monospace;
  font-size:9px;
  letter-spacing:.06em;
  padding:3px 7px 3px 9px;
  display:flex; align-items:center; gap:5px;
  cursor:pointer;
  transition:opacity .15s;
  border: 1px solid;
}
.mode-tag:hover { opacity:.7; }
.mode-tag.pro  { color:var(--pro);  border-color:var(--pro);  background:rgba(77,159,255,.09); }
.mode-tag.fun  { color:var(--fun);  border-color:var(--fun);  background:rgba(255,107,203,.09); }
.mode-tag.priv { color:var(--priv); border-color:var(--priv); background:rgba(155,89,255,.09); }
.mode-tag-x { font-size:11px; line-height:1; }
.mode-add-btn {
  width:100%;
  background:transparent;
  border: 1px dashed var(--border2);
  color:var(--sub);
  font-family:'Space Mono',monospace;
  font-size:9px;
  letter-spacing:.1em;
  text-transform:uppercase;
  padding:6px;
  cursor:pointer;
  margin-top:8px;
  transition: all .15s;
}
.mode-add-btn:hover { border-color: var(--lime); color:var(--lime); }

/* REMINDER SYSTEM */
.reminder-form {
  background: var(--card);
  border: 1px solid var(--border2);
  padding: 20px;
  display: flex;
  flex-direction:column;
  gap: 14px;
}
.reminder-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.r-input-wrap { display:flex; flex-direction:column; gap:6px; }
.r-label {
  font-family:'Space Mono',monospace;
  font-size:9px;
  letter-spacing:.14em;
  color:var(--sub);
  text-transform:uppercase;
}
.r-input {
  background: var(--card2);
  border: 1px solid var(--border2);
  border-top: 2px solid var(--border2);
  color: var(--text);
  font-family:'Space Mono',monospace;
  font-size:11px;
  padding: 10px 12px;
  outline:none;
  width:100%;
  transition:border-color .15s;
  color-scheme:dark;
}
.r-input:focus { border-top-color:var(--lime); border-color:var(--lime); }
.r-msg-input {
  background:var(--card2);
  border:1px solid var(--border2);
  border-left:2px solid var(--border2);
  color:var(--text);
  font-family:'Syne', sans-serif;
  font-size:13px;
  padding:10px 12px;
  outline:none;
  width:100%;
  resize:none;
  height:68px;
  transition:border-color .15s;
}
.r-msg-input:focus { border-left-color:var(--lime); border-color:var(--lime); }
.r-msg-input::placeholder { color:var(--sub2); }

.add-reminder-btn {
  background:var(--lime);
  color:var(--bg);
  border:none;
  padding:13px 24px;
  font-family:'Space Mono',monospace;
  font-size:11px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:10px;
  transition:all .15s;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
}
.add-reminder-btn:hover { background:#d6ff3d; box-shadow:0 0 24px rgba(200,241,53,.35); transform:translateY(-1px); }
.add-reminder-btn:active { transform:translateY(0); }

/* REMINDERS LIST */
.reminders-list { display:flex; flex-direction:column; gap:8px; }
.reminder-item {
  display:flex; align-items:center; gap:14px;
  background:var(--card);
  border:1px solid var(--border2);
  border-left:2px solid var(--lime);
  padding:12px 16px;
  animation:slideIn .25s ease;
}
@keyframes slideIn {
  from { opacity:0; transform:translateX(-8px); }
  to   { opacity:1; transform:translateX(0); }
}
.reminder-bot-icon {
  width:30px; height:30px;
  background:var(--lime-dim);
  border:1px solid var(--lime);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
  font-size:14px;
}
.reminder-info { flex:1; }
.reminder-when {
  font-family:'Space Mono',monospace;
  font-size:9px;
  letter-spacing:.1em;
  color:var(--lime);
  text-transform:uppercase;
  margin-bottom:3px;
}
.reminder-msg {
  font-size:12px;
  color:var(--text);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.reminder-trigger {
  font-family:'Space Mono',monospace;
  font-size:8px;
  letter-spacing:.1em;
  color:var(--sub);
  text-transform:uppercase;
  flex-shrink:0;
}
.reminder-del {
  background:transparent; border:none; color:var(--sub2);
  cursor:pointer; padding:4px; transition:color .15s;
  display:flex; align-items:center;
}
.reminder-del:hover { color:var(--danger); }

/* CHATBOT TOAST */
.bot-toast {
  position: fixed;
  bottom: 32px; right: 32px;
  background: var(--surface);
  border: 1px solid var(--lime);
  box-shadow: 0 0 40px rgba(200,241,53,.2);
  padding: 18px 20px;
  max-width: 320px;
  width:100%;
  z-index:999;
  animation: toastIn .35s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes toastIn {
  from { opacity:0; transform:translateY(20px) scale(.95); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.toast-head {
  display:flex; align-items:center; gap:10px; margin-bottom:10px;
}
.toast-avatar {
  width:28px; height:28px;
  background:var(--lime);
  color:var(--bg);
  font-size:14px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.toast-name {
  font-family:'Space Mono',monospace;
  font-size:10px;
  font-weight:700;
  letter-spacing:.1em;
  color:var(--lime);
  text-transform:uppercase;
}
.toast-time {
  font-family:'Space Mono',monospace;
  font-size:8px;
  color:var(--sub);
  margin-left:auto;
}
.toast-msg { font-size:13px; line-height:1.6; color:var(--text); }
.toast-close {
  position:absolute; top:10px; right:12px;
  background:transparent; border:none;
  color:var(--sub); cursor:pointer; font-size:16px;
  transition:color .15s;
}
.toast-close:hover { color:var(--text); }
.toast-blink { display:inline-block; animation:blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }

/* SAVE BAR */
.save-bar {
  position:sticky; bottom:0;
  background:var(--surface);
  border-top:1px solid var(--border);
  padding:14px 24px;
  display:flex; align-items:center; justify-content:space-between;
  margin-top:32px;
}
.save-hint {
  font-family:'Space Mono',monospace;
  font-size:9px;
  letter-spacing:.1em;
  color:var(--sub);
  text-transform:uppercase;
}
.save-btn {
  background:var(--lime);
  color:var(--bg);
  border:none;
  padding:10px 28px;
  font-family:'Space Mono',monospace;
  font-size:11px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
  cursor:pointer;
  transition:all .15s;
  clip-path: polygon(0 0, calc(100%-8px) 0, 100% 8px, 100% 100%, 0 100%);
}
.save-btn:hover { background:#d6ff3d; }
.divider { height:1px; background:var(--border); margin:4px 0; }
`;

/* ─── DATA ───────────────────────────────────────────────────────────────── */
const MODES = [
  { key: "pro",  label: "Professional", cssVar: "pro",  placeholder: "Add user handle…" },
  { key: "fun",  label: "Fun",          cssVar: "fun",  placeholder: "Add user handle…" },
  { key: "priv", label: "Private",      cssVar: "priv", placeholder: "Add user handle…" },
] as const;
type ModeKey = "pro" | "fun" | "priv";

type Reminder = { id: string; date: string; time: string; msg: string };
type SettingsState = {
  visibility: "Public"|"Private"|"Custom";
  picVisibility: "Everyone"|"None"|"Selected users";
  theme: "light"|"dark";
  modeUsers: Record<ModeKey, string[]>;
  reminders: Reminder[];
};

const DEFAULT_SETTINGS: SettingsState = {
  visibility: "Public",
  picVisibility: "Everyone",
  theme: "dark",
  modeUsers: { pro: [], fun: [], priv: [] },
  reminders: [],
};

const loadSettings = (): SettingsState => {
  try {
    const raw = localStorage.getItem("moodchat.settings");
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,5 3.8,7.5 8.5,2.5" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`section-chevron${open ? " open" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3,5 7,9 11,5" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="2,3 11,3" />
      <path d="M4.5 3V2h4v1" /><path d="M3 3l.8 8h5.4L10 3" />
    </svg>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function SettingsPanel() {
  const stored = loadSettings();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  
  // Open/close sections
  const [open, setOpen] = useState([true, false, false, false]);
  const toggle = (i: number) => setOpen(p => p.map((v, j) => j === i ? !v : v));

  // §1 Privacy
  const [visibility, setVisibility] = useState<"Public"|"Private"|"Custom">(stored.visibility);
  const [picVisibility, setPicVisibility] = useState<"Everyone"|"None"|"Selected users">(stored.picVisibility);

  // §2 Theme - sync with global theme context
  const [theme, setThemeLocal] = useState<"light"|"dark">(themeMode);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setThemeLocal(newTheme);
    setThemeMode(newTheme);
  };

  // §3 Mode users
  const [modeUsers, setModeUsers] = useState<Record<ModeKey, string[]>>(stored.modeUsers);
  const [modeInputs, setModeInputs] = useState<Record<ModeKey, string>>({ pro: "", fun: "", priv: "" });
  const addUser = (mode: ModeKey) => {
    const val = modeInputs[mode].trim();
    if (!val) return;
    setModeUsers(p => ({ ...p, [mode]: [...p[mode], val] }));
    setModeInputs(p => ({ ...p, [mode]: "" }));
  };
  const removeUser = (mode: ModeKey, u: string) =>
    setModeUsers(p => ({ ...p, [mode]: p[mode].filter(x => x !== u) }));

  // §4 Reminders
  const [remDate, setRemDate] = useState("");
  const [remTime, setRemTime] = useState("");
  const [remMsg, setRemMsg]   = useState("");
  const [reminders, setReminders] = useState<Reminder[]>(stored.reminders);
  const [toast, setToast] = useState<Reminder | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync local theme with global theme when global changes
  useEffect(() => {
    setThemeLocal(themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("moodchat.settings", JSON.stringify({
      visibility,
      picVisibility,
      theme,
      modeUsers,
      reminders,
    }));
  }, [visibility, picVisibility, theme, modeUsers, reminders]);

  const addReminder = () => {
    if (!remDate || !remTime) return;
    const r: Reminder = { id: Date.now().toString(), date: remDate, time: remTime, msg: remMsg || "Hey! You set a reminder for this moment." };
    setReminders(p => [r, ...p]);
    setToast(r);
    setRemDate(""); setRemTime(""); setRemMsg("");
    setTimeout(() => setToast(null), 6000);
  };

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <style>{css}</style>

      {/* CHATBOT TOAST */}
      {toast && (
        <div className="bot-toast">
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
          <div className="toast-head">
            <div className="toast-avatar">🤖</div>
            <span className="toast-name">Bot</span>
            <span className="toast-time">{toast.time}</span>
          </div>
          <div className="toast-msg">{toast.msg}<span className="toast-blink">▌</span></div>
        </div>
      )}

      <div className="wrap">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Configuration</div>
            <div className="page-title">Settings</div>
          </div>
          <div className="page-badge">v2.0</div>
        </div>

        {/* ── SECTION 1: PRIVACY ─────────────────────────────────── */}
        <div className="section">
          <div className={`section-head${open[0] ? " open" : ""}`} onClick={() => toggle(0)}>
            <span className="section-num">01</span>
            <span className="section-title">Privacy</span>
            <ChevronIcon open={open[0]} />
          </div>
          {open[0] && (
            <div className="section-body">
              <div className="field">
                <div className="field-label">Profile Visibility</div>
                <div className="seg">
                  {(["Public","Private","Custom"] as const).map(v => (
                    <button key={v} className={`seg-btn${visibility===v?" active":""}`} onClick={()=>setVisibility(v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="divider"/>
              <div className="field">
                <div className="field-label">Profile Picture Visibility</div>
                <div className="pills">
                  {(["Everyone","None","Selected users"] as const).map(v => (
                    <button key={v} className={`pill${picVisibility===v?" active":""}`} onClick={()=>setPicVisibility(v)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: THEME ───────────────────────────────────── */}
        <div className="section">
          <div className={`section-head${open[1] ? " open" : ""}`} onClick={() => toggle(1)}>
            <span className="section-num">02</span>
            <span className="section-title">Theme</span>
            <ChevronIcon open={open[1]} />
          </div>
          {open[1] && (
            <div className="section-body">
              <div className="theme-cards">
                <div className={`theme-card light-card${theme==="light"?" active":""}`} onClick={()=>handleThemeChange("light")}>
                  <div className="theme-card-preview">
                    <div className="theme-dot" />
                    <div className="theme-bar-wrap light-bars">
                      <div className="theme-bar" />
                      <div className="theme-bar" />
                    </div>
                  </div>
                  <div className="theme-name">Light Mode</div>
                  <div className="theme-check"><CheckIcon /></div>
                </div>
                <div className={`theme-card dark-card${theme==="dark"?" active":""}`} onClick={()=>handleThemeChange("dark")}>
                  <div className="theme-card-preview">
                    <div className="theme-dot" />
                    <div className="theme-bar-wrap dark-bars">
                      <div className="theme-bar" />
                      <div className="theme-bar" />
                    </div>
                  </div>
                  <div className="theme-name">Dark Mode</div>
                  <div className="theme-check"><CheckIcon /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 3: MODES ───────────────────────────────────── */}
        <div className="section">
          <div className={`section-head${open[2] ? " open" : ""}`} onClick={() => toggle(2)}>
            <span className="section-num">03</span>
            <span className="section-title">Modes Configuration</span>
            <ChevronIcon open={open[2]} />
          </div>
          {open[2] && (
            <div className="section-body">
              <div className="mode-grid">
                {MODES.map(m => (
                  <div key={m.key} className="mode-card">
                    <div className="mode-card-head">
                      <div className={`mode-dot ${m.cssVar}`} />
                      <span className={`mode-name ${m.cssVar}`}>{m.label}</span>
                    </div>
                    <div className="mode-body">
                      <input
                        className="mode-input"
                        placeholder={m.placeholder}
                        value={modeInputs[m.key]}
                        onChange={e => setModeInputs(p => ({...p, [m.key]: e.target.value}))}
                        onKeyDown={e => e.key==="Enter" && addUser(m.key)}
                      />
                      <div className="mode-tags">
                        {modeUsers[m.key].map(u => (
                          <span key={u} className={`mode-tag ${m.cssVar}`} onClick={()=>removeUser(m.key,u)}>
                            {u}<span className="mode-tag-x">×</span>
                          </span>
                        ))}
                      </div>
                      <button className="mode-add-btn" onClick={()=>addUser(m.key)}>+ Assign</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 4: REMINDERS ───────────────────────────────── */}
        <div className="section">
          <div className={`section-head${open[3] ? " open" : ""}`} onClick={() => toggle(3)}>
            <span className="section-num">04</span>
            <span className="section-title">Reminder System</span>
            <ChevronIcon open={open[3]} />
          </div>
          {open[3] && (
            <div className="section-body">
              <div className="reminder-form">
                <div className="reminder-row">
                  <div className="r-input-wrap">
                    <div className="r-label">Date</div>
                    <input type="date" className="r-input" value={remDate} onChange={e=>setRemDate(e.target.value)} />
                  </div>
                  <div className="r-input-wrap">
                    <div className="r-label">Time</div>
                    <input type="time" className="r-input" value={remTime} onChange={e=>setRemTime(e.target.value)} />
                  </div>
                </div>
                <div className="r-input-wrap">
                  <div className="r-label">Chatbot Message</div>
                  <textarea
                    className="r-msg-input"
                    placeholder="Message the bot will send at trigger time…"
                    value={remMsg}
                    onChange={e=>setRemMsg(e.target.value)}
                  />
                </div>
                <button className="add-reminder-btn" onClick={addReminder}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="6.5" cy="6.5" r="5.5"/>
                    <line x1="6.5" y1="4" x2="6.5" y2="9"/><line x1="4" y1="6.5" x2="9" y2="6.5"/>
                  </svg>
                  Add Reminder — Triggers Bot Message
                </button>
              </div>

              {reminders.length > 0 && (
                <div className="reminders-list">
                  {reminders.map(r => (
                    <div key={r.id} className="reminder-item">
                      <div className="reminder-bot-icon">🤖</div>
                      <div className="reminder-info">
                        <div className="reminder-when">{r.date} · {r.time}</div>
                        <div className="reminder-msg">{r.msg}</div>
                      </div>
                      <div className="reminder-trigger">Bot trigger</div>
                      <button className="reminder-del" onClick={()=>setReminders(p=>p.filter(x=>x.id!==r.id))}>
                        <TrashIcon/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SAVE BAR */}
        <div className="save-bar">
          <span className="save-hint">{saved ? "Settings saved" : "Changes are saved locally"}</span>
          <button className="save-btn" onClick={saveSettings}>{saved ? "Saved" : "Save Settings"}</button>
        </div>
      </div>
    </>
  );
}
