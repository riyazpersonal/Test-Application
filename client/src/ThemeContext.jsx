import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = {
  gold: { label: "Gold", dot: "#e8b13a", accent: "#e8b13a", accentInk: "#1a1408" },
  pink: { label: "Pink", dot: "#e0559c", accent: "#e0559c", accentInk: "#210014" },
  red: { label: "Red", dot: "#e64848", accent: "#e64848", accentInk: "#210000" },
  black: { label: "Black", dot: "#f2f2f2", accent: "#f2f2f2", accentInk: "#0a0a0a" },
  white: { label: "White", dot: "#ffffff", accent: "#ffffff", accentInk: "#0a0a0a" },
};

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem("qa-theme") || "gold"
  );

  useEffect(() => {
    const t = THEMES[themeKey] || THEMES.gold;
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-ink", t.accentInk);
    localStorage.setItem("qa-theme", themeKey);
  }, [themeKey]);

  return (
    <ThemeCtx.Provider value={{ themeKey, setThemeKey }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
