import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "moodchatting-theme";

/**
 * Theme Provider Component
 * Manages theme state, persistence, and application
 * Applies theme to body element for CSS variable propagation
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const preferredTheme = (stored === "light" || stored === "dark" ? stored : "dark") as ThemeMode;
    setModeState(preferredTheme);
    setMounted(true);
  }, []);

  // Apply theme to DOM whenever mode changes
  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to body element for CSS variable selector
    document.body.dataset.theme = mode;
    document.documentElement.dataset.theme = mode;
    
    // Persist to localStorage
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, mounted]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme: () => setModeState((current) => (current === "dark" ? "light" : "dark")),
      setMode: (next: ThemeMode) => setModeState(next),
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
