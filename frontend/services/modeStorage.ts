export type ModeKey = "professional" | "fun" | "private" | "relaxment" | "allinone";

export interface ModeMeta {
  label: string;
  icon: string;
  accent: string;
}

export interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  online?: boolean;
}

export interface ModeState {
  users: string[];
}

export const MODE_STORAGE_KEY = "moodchat.modeAssignments";

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
        ? parsed[key].users.filter((id: unknown): id is string => typeof id === "string")
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
