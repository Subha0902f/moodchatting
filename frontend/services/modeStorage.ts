export type ModeKey = "professional" | "fun" | "private" | "relaxment" | "allinone";

export interface ModeMeta {
  label: string;
  icon: string;
  accent: string;
}

export interface Friend {
  id: number;
  name: string;
  emoji: string;
  bg: string;
  online: boolean;
}

export interface ModeState {
  users: number[];
}

export const MODE_STORAGE_KEY = "moodchat.modeAssignments";

export const ALL_FRIENDS: Friend[] = [
  { id: 1, name: "Aria Nakamura", emoji: "🌸", bg: "#2a1e0a", online: true },
  { id: 2, name: "Dev Sharma", emoji: "🔥", bg: "#0a1e2a", online: false },
  { id: 3, name: "Zoe Ellis", emoji: "⚡", bg: "#1e0a2a", online: true },
  { id: 4, name: "Kai Watanabe", emoji: "🌊", bg: "#2a2a0a", online: false },
];

export const MODE_META: Record<ModeKey, ModeMeta> = {
  professional: { label: "Professional", icon: "💼", accent: "#60a5fa" },
  fun:          { label: "Fun",          icon: "🎉", accent: "#f472b6" },
  private:      { label: "Private",      icon: "🔒", accent: "#a78bfa" },
  relaxment:    { label: "Relaxment",    icon: "🌿", accent: "#4ade80" },
  allinone:     { label: "All-in-One",   icon: "⚡", accent: "#c8f53d" },
};

export const INIT_MODES: Record<ModeKey, ModeState> = {
  professional: { users: [] },
  fun:          { users: [] },
  private:      { users: [] },
  relaxment:    { users: [] },
  allinone:     { users: [] },
};

export const loadModeAssignments = (): Record<ModeKey, ModeState> => {
  if (typeof window === "undefined") return INIT_MODES;

  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return (Object.keys(INIT_MODES) as ModeKey[]).reduce((acc, key) => {
      const users = Array.isArray(parsed?.[key]?.users)
        ? parsed[key].users.filter((id: unknown): id is number => typeof id === "number")
        : INIT_MODES[key].users;
      acc[key] = { users };
      return acc;
    }, {} as Record<ModeKey, ModeState>);
  } catch {
    return INIT_MODES;
  }
};

export const saveModeAssignments = (modes: Record<ModeKey, ModeState>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(modes));
};
