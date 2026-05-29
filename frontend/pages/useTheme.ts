import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  try {
    const storedSettings = localStorage.getItem("moodchat.settings");
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      return settings.theme || "dark";
    }
  } catch (e) {
    // ignore
  }
  return "dark";
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);

    const storedSettings = localStorage.getItem("moodchat.settings");
    const settings = storedSettings ? JSON.parse(storedSettings) : {};

    localStorage.setItem(
      "moodchat.settings",
      JSON.stringify({
        ...settings,
        theme,
      })
    );
  }, [theme]);

  return {
    mode: theme,
    setMode: setTheme,
  };
}