import { useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { ThemeSettings } from "../types";

// Helper to convert hex to an "R G B" string for Tailwind opacity modifiers
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(
        result[3],
        16
      )}`
    : null;
};

// Helper to darken a hex color for hover states
const darkenColor = (hex: string, percent: number): string => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.floor((r * (100 - percent)) / 100);
  g = Math.floor((g * (100 - percent)) / 100);
  b = Math.floor((b * (100 - percent)) / 100);

  const toHex = (c: number) => `0${c.toString(16)}`.slice(-2);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const applyTheme = (theme: ThemeSettings) => {
  const root = document.documentElement;

  const primaryRgb = hexToRgb(theme.primaryColor);
  const secondaryRgb = hexToRgb(theme.secondaryColor);
  const secondaryHoverHex = darkenColor(theme.secondaryColor, 20);
  const secondaryHoverRgb = hexToRgb(secondaryHoverHex);

  if (primaryRgb) root.style.setProperty("--color-primary", primaryRgb);
  if (secondaryRgb) root.style.setProperty("--color-secondary", secondaryRgb);
  if (secondaryHoverRgb)
    root.style.setProperty("--color-secondary-hover", secondaryHoverRgb);

  root.style.setProperty("--font-sans", theme.sansFont);
  root.style.setProperty("--font-display", theme.displayFont);
};

const ThemeApplicator = () => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (!loading && settings) {
      applyTheme(settings.theme);
    }
  }, [settings, loading]);

  return null; // This component does not render anything
};

export default ThemeApplicator;
