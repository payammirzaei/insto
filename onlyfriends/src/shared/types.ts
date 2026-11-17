export type FeedMode = "strict" | "following";
export type ThemePreference = "light" | "dark" | "system";
export type Language = "en" | "fa";

export interface Settings {
  enabled: boolean;
  friends: string[];
  mode: FeedMode;
  sessionMinutes: number;
  dailyBudgetMinutes: number | null;
  theme: ThemePreference;
  language: Language;
  /** Soft override: ignore session/daily limits until this timestamp (ms). */
  limitOverrideUntil: number | null;
}

export interface TimeState {
  /** Calendar day key YYYY-MM-DD in local time. */
  dayKey: string;
  /** Milliseconds of active usage counted today. */
  dailyUsedMs: number;
  /** Wall-clock when the current session slice started, or null if paused/expired. */
  sessionSliceStartedAt: number | null;
  /** Milliseconds accumulated in the current session (before current slice). */
  sessionAccumulatedMs: number;
  /** Whether the end-of-session overlay is active. */
  sessionExpired: boolean;
  /**
   * Multi-tab lease: only the owning content-script instance advances the clock.
   * Prevents double-counting when several Instagram tabs are open.
   */
  timerOwnerId: string | null;
  timerOwnerExpiresAt: number | null;
}

export interface CapabilityReport {
  followingVariantAvailable: boolean | null;
  followingTabDetected: boolean | null;
  feedAuthorMatching: "reliable" | "partial" | "unavailable";
  storyUsernameMatching: "reliable" | "partial" | "unavailable";
  storyViewerFiltering: "safe" | "unsafe" | "unknown";
  lastCheckedAt: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  friends: [],
  mode: "strict",
  sessionMinutes: 15,
  dailyBudgetMinutes: null,
  theme: "system",
  language: "en",
  limitOverrideUntil: null,
};

export const DEFAULT_TIME_STATE: TimeState = {
  dayKey: "",
  dailyUsedMs: 0,
  sessionSliceStartedAt: null,
  sessionAccumulatedMs: 0,
  sessionExpired: false,
  timerOwnerId: null,
  timerOwnerExpiresAt: null,
};

export const STORAGE_KEYS = {
  settings: "of_settings",
  time: "of_time",
  capabilities: "of_capabilities",
} as const;

export type Message =
  | { type: "OF_GET_STATE" }
  | { type: "OF_SETTINGS_UPDATED"; settings: Settings }
  | { type: "OF_TIME_UPDATED"; time: TimeState }
  | { type: "OF_OPEN_SETTINGS" }
  | { type: "OF_OVERRIDE_LIMIT" }
  | { type: "OF_START_SESSION" }
  | { type: "OF_PING" };
