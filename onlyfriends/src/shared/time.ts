import { DEFAULT_TIME_STATE, type Settings, type TimeState } from "./types.js";
import { isLimitOverridden } from "./settings.js";

export function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sanitizeTimeState(raw: unknown, now = Date.now()): TimeState {
  const day = localDayKey(new Date(now));
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_TIME_STATE, dayKey: day };
  }
  const r = raw as Record<string, unknown>;
  const dayKey = typeof r.dayKey === "string" ? r.dayKey : day;

  // Roll over at local midnight
  if (dayKey !== day) {
    return {
      dayKey: day,
      dailyUsedMs: 0,
      sessionSliceStartedAt:
        typeof r.sessionSliceStartedAt === "number" ? r.sessionSliceStartedAt : null,
      sessionAccumulatedMs:
        typeof r.sessionAccumulatedMs === "number"
          ? Math.max(0, r.sessionAccumulatedMs)
          : 0,
      sessionExpired: Boolean(r.sessionExpired),
      timerOwnerId: typeof r.timerOwnerId === "string" ? r.timerOwnerId : null,
      timerOwnerExpiresAt:
        typeof r.timerOwnerExpiresAt === "number" ? r.timerOwnerExpiresAt : null,
    };
  }

  return {
    dayKey,
    dailyUsedMs: typeof r.dailyUsedMs === "number" ? Math.max(0, r.dailyUsedMs) : 0,
    sessionSliceStartedAt:
      typeof r.sessionSliceStartedAt === "number" ? r.sessionSliceStartedAt : null,
    sessionAccumulatedMs:
      typeof r.sessionAccumulatedMs === "number"
        ? Math.max(0, r.sessionAccumulatedMs)
        : 0,
    sessionExpired: Boolean(r.sessionExpired),
    timerOwnerId: typeof r.timerOwnerId === "string" ? r.timerOwnerId : null,
    timerOwnerExpiresAt:
      typeof r.timerOwnerExpiresAt === "number" ? r.timerOwnerExpiresAt : null,
  };
}

export function sessionLimitMs(settings: Settings): number {
  return settings.sessionMinutes * 60_000;
}

export function dailyLimitMs(settings: Settings): number | null {
  if (settings.dailyBudgetMinutes === null) return null;
  return settings.dailyBudgetMinutes * 60_000;
}

/** Current session usage including active slice. */
export function currentSessionUsedMs(time: TimeState, now = Date.now()): number {
  let used = time.sessionAccumulatedMs;
  if (time.sessionSliceStartedAt !== null) {
    used += Math.max(0, now - time.sessionSliceStartedAt);
  }
  return used;
}

export function currentDailyUsedMs(time: TimeState, now = Date.now()): number {
  let used = time.dailyUsedMs;
  if (time.sessionSliceStartedAt !== null) {
    used += Math.max(0, now - time.sessionSliceStartedAt);
  }
  return used;
}

export function remainingSessionMs(
  settings: Settings,
  time: TimeState,
  now = Date.now()
): number {
  if (isLimitOverridden(settings, now)) return Number.POSITIVE_INFINITY;
  return Math.max(0, sessionLimitMs(settings) - currentSessionUsedMs(time, now));
}

export function remainingDailyMs(
  settings: Settings,
  time: TimeState,
  now = Date.now()
): number | null {
  const limit = dailyLimitMs(settings);
  if (limit === null) return null;
  if (isLimitOverridden(settings, now)) return Number.POSITIVE_INFINITY;
  return Math.max(0, limit - currentDailyUsedMs(time, now));
}

export function isTimeExpired(
  settings: Settings,
  time: TimeState,
  now = Date.now()
): boolean {
  if (!settings.enabled) return false;
  if (isLimitOverridden(settings, now)) return false;
  if (remainingSessionMs(settings, time, now) <= 0) return true;
  const daily = remainingDailyMs(settings, time, now);
  if (daily !== null && daily <= 0) return true;
  return false;
}

export function startSessionSlice(time: TimeState, now = Date.now()): TimeState {
  const base = sanitizeTimeState(time, now);
  if (base.sessionSliceStartedAt !== null) return base;
  return {
    ...base,
    sessionSliceStartedAt: now,
    sessionExpired: false,
  };
}

export function pauseSessionSlice(time: TimeState, now = Date.now()): TimeState {
  const base = sanitizeTimeState(time, now);
  if (base.sessionSliceStartedAt === null) return base;
  const delta = Math.max(0, now - base.sessionSliceStartedAt);
  return {
    ...base,
    sessionSliceStartedAt: null,
    sessionAccumulatedMs: base.sessionAccumulatedMs + delta,
    dailyUsedMs: base.dailyUsedMs + delta,
  };
}

export function expireSession(time: TimeState, now = Date.now()): TimeState {
  const paused = pauseSessionSlice(time, now);
  return {
    ...paused,
    sessionExpired: true,
    timerOwnerId: null,
    timerOwnerExpiresAt: null,
  };
}

export function resetSession(time: TimeState, now = Date.now()): TimeState {
  const day = localDayKey(new Date(now));
  const base = sanitizeTimeState(time, now);
  return {
    dayKey: day,
    dailyUsedMs: base.dayKey === day ? base.dailyUsedMs : 0,
    sessionSliceStartedAt: now,
    sessionAccumulatedMs: 0,
    sessionExpired: false,
    timerOwnerId: null,
    timerOwnerExpiresAt: null,
  };
}

const OWNER_LEASE_MS = 3_000;

/**
 * Multi-tab safe heartbeat: only the lease owner advances the clock.
 * Other tabs refresh from storage and display remaining time without double-counting.
 */
export function claimOrRenewOwner(
  time: TimeState,
  ownerId: string,
  now = Date.now()
): { time: TimeState; isOwner: boolean } {
  const base = sanitizeTimeState(time, now);
  const leaseValid =
    typeof base.timerOwnerId === "string" &&
    typeof base.timerOwnerExpiresAt === "number" &&
    base.timerOwnerExpiresAt > now;

  if (leaseValid && base.timerOwnerId !== ownerId) {
    return { time: base, isOwner: false };
  }

  return {
    time: {
      ...base,
      timerOwnerId: ownerId,
      timerOwnerExpiresAt: now + OWNER_LEASE_MS,
    },
    isOwner: true,
  };
}

export function releaseOwner(time: TimeState, ownerId: string, now = Date.now()): TimeState {
  const base = sanitizeTimeState(time, now);
  if (base.timerOwnerId !== ownerId) return base;
  const paused = pauseSessionSlice(base, now);
  return {
    ...paused,
    timerOwnerId: null,
    timerOwnerExpiresAt: null,
  };
}

/**
 * Owner-only: fold elapsed slice into accumulators and restart slice if still active.
 * Caps a single heartbeat delta to avoid huge jumps after sleep.
 */
export function ownerHeartbeat(
  time: TimeState,
  now = Date.now(),
  options: { active: boolean; maxDeltaMs?: number } = { active: true }
): TimeState {
  const maxDelta = options.maxDeltaMs ?? 5_000;
  let base = sanitizeTimeState(time, now);

  if (base.sessionSliceStartedAt !== null) {
    const raw = Math.max(0, now - base.sessionSliceStartedAt);
    const delta = Math.min(raw, maxDelta);
    base = {
      ...base,
      sessionAccumulatedMs: base.sessionAccumulatedMs + delta,
      dailyUsedMs: base.dailyUsedMs + delta,
      sessionSliceStartedAt: null,
    };
  }

  if (options.active && !base.sessionExpired) {
    base = {
      ...base,
      sessionSliceStartedAt: now,
    };
  }

  return base;
}

export function formatRemaining(ms: number, language: "en" | "fa"): string {
  if (!Number.isFinite(ms)) {
    return language === "fa" ? "بدون محدودیت" : "No limit";
  }
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
