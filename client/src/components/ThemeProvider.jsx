import { useEffect } from "react";
import { useSchoolSettings } from "../context/SchoolSettingsContext";

const FALLBACK_THEME = {
  primaryColor: "#0f172a",
  secondaryColor: "#f59e0b",
  accentColor: "#2563eb",
  successColor: "#16a34a",
  logoHeight: "40",
  borderRadius: "12",
  footerStyle: "standard",
};

export default function ThemeProvider({ children }) {
  const { settings } = useSchoolSettings();
  const theme = { ...FALLBACK_THEME, ...(settings?.theme || {}) };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--school-primary", theme.primaryColor);
    root.style.setProperty("--school-secondary", theme.secondaryColor);
    root.style.setProperty("--school-accent", theme.accentColor);
    root.style.setProperty("--school-success", theme.successColor);
    root.style.setProperty("--school-radius", `${Number(theme.borderRadius) || 12}px`);
    root.style.setProperty("--school-logo-height", `${Number(theme.logoHeight) || 40}px`);
    root.style.setProperty("--school-footer-style", theme.footerStyle || "standard");

    return () => {
      root.style.removeProperty("--school-primary");
      root.style.removeProperty("--school-secondary");
      root.style.removeProperty("--school-accent");
      root.style.removeProperty("--school-success");
      root.style.removeProperty("--school-radius");
      root.style.removeProperty("--school-logo-height");
      root.style.removeProperty("--school-footer-style");
    };
  }, [theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.successColor, theme.borderRadius, theme.logoHeight, theme.footerStyle]);

  return children;
}
