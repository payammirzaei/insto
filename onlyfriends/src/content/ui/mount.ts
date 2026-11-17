import { OF_CSS } from "./styles.js";
import type { Language, ThemePreference } from "../../shared/types.js";
import { dirForLanguage } from "../../shared/i18n.js";

export interface OfRoot {
  host: HTMLDivElement;
  shadow: ShadowRoot;
  root: HTMLDivElement;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
}

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function mountOfRoot(): OfRoot {
  const existing = document.getElementById("onlyfriends-host");
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = "onlyfriends-host";
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.zIndex = "2147483646";
  host.style.inset = "0";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = OF_CSS;

  const root = document.createElement("div");
  root.id = "onlyfriends-root";
  root.dataset.theme = resolveTheme("system");
  root.setAttribute("dir", "ltr");

  shadow.append(style, root);
  document.documentElement.append(host);

  return {
    host,
    shadow,
    root,
    setTheme(theme) {
      root.dataset.theme = resolveTheme(theme);
    },
    setLanguage(language) {
      root.setAttribute("dir", dirForLanguage(language));
      root.dataset.lang = language;
    },
  };
}
