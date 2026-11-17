import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type FeedMode,
  type Language,
  type Settings,
  type ThemePreference,
} from "./types.js";
import { isValidUsername, normalizeUsername } from "./username.js";

export function clampSessionMinutes(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.sessionMinutes;
  return Math.min(180, Math.max(1, Math.round(n)));
}

export function clampDailyBudget(n: number | null): number | null {
  if (n === null || n === undefined) return null;
  if (!Number.isFinite(n)) return null;
  return Math.min(720, Math.max(5, Math.round(n)));
}

export function sanitizeFriends(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const n = normalizeUsername(item);
    if (!isValidUsername(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.slice(0, 200);
}

export function sanitizeSettings(raw: unknown): Settings {
  const base = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;

  const mode: FeedMode =
    r.mode === "following" || r.mode === "strict" ? r.mode : base.mode;
  const theme: ThemePreference =
    r.theme === "light" || r.theme === "dark" || r.theme === "system"
      ? r.theme
      : base.theme;
  const language: Language =
    r.language === "fa" || r.language === "en" ? r.language : base.language;

  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : base.enabled,
    friends: sanitizeFriends(r.friends),
    mode,
    sessionMinutes: clampSessionMinutes(
      typeof r.sessionMinutes === "number" ? r.sessionMinutes : base.sessionMinutes
    ),
    dailyBudgetMinutes: clampDailyBudget(
      r.dailyBudgetMinutes === null
        ? null
        : typeof r.dailyBudgetMinutes === "number"
          ? r.dailyBudgetMinutes
          : base.dailyBudgetMinutes
    ),
    theme,
    language,
    limitOverrideUntil:
      typeof r.limitOverrideUntil === "number" || r.limitOverrideUntil === null
        ? (r.limitOverrideUntil as number | null)
        : base.limitOverrideUntil,
  };
}

export async function loadSettings(): Promise<Settings> {
  const data = await browser.storage.local.get(STORAGE_KEYS.settings);
  return sanitizeSettings(data[STORAGE_KEYS.settings]);
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const clean = sanitizeSettings(settings);
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: clean });
  return clean;
}

export function mergeSettings(current: Settings, patch: Partial<Settings>): Settings {
  return sanitizeSettings({ ...current, ...patch });
}

export function isLimitOverridden(settings: Settings, now = Date.now()): boolean {
  return (
    typeof settings.limitOverrideUntil === "number" &&
    settings.limitOverrideUntil > now
  );
}
