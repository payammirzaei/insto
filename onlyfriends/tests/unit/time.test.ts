import { describe, expect, it } from "vitest";
import {
  claimOrRenewOwner,
  currentSessionUsedMs,
  expireSession,
  isTimeExpired,
  localDayKey,
  ownerHeartbeat,
  remainingSessionMs,
  releaseOwner,
  resetSession,
  sanitizeTimeState,
  startSessionSlice,
  pauseSessionSlice,
} from "../../src/shared/time";
import { DEFAULT_SETTINGS } from "../../src/shared/types";

describe("localDayKey", () => {
  it("formats YYYY-MM-DD", () => {
    expect(localDayKey(new Date("2026-11-16T12:00:00"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("session accounting", () => {
  const settings = { ...DEFAULT_SETTINGS, sessionMinutes: 15, dailyBudgetMinutes: null };

  it("accumulates slice time", () => {
    const t0 = 1_000_000;
    let time = sanitizeTimeState({}, t0);
    time = startSessionSlice(time, t0);
    expect(currentSessionUsedMs(time, t0 + 60_000)).toBe(60_000);
    time = pauseSessionSlice(time, t0 + 60_000);
    expect(time.sessionAccumulatedMs).toBe(60_000);
    expect(time.sessionSliceStartedAt).toBeNull();
  });

  it("expires after session limit", () => {
    const t0 = 1_000_000;
    let time = startSessionSlice(sanitizeTimeState({}, t0), t0);
    const later = t0 + 15 * 60_000 + 1;
    expect(isTimeExpired(settings, time, later)).toBe(true);
    time = expireSession(time, later);
    expect(time.sessionExpired).toBe(true);
  });

  it("override disables expiry", () => {
    const t0 = 1_000_000;
    const time = startSessionSlice(sanitizeTimeState({}, t0), t0);
    const later = t0 + 20 * 60_000;
    const overridden = {
      ...settings,
      limitOverrideUntil: later + 60_000,
    };
    expect(isTimeExpired(overridden, time, later)).toBe(false);
    expect(remainingSessionMs(overridden, time, later)).toBe(Number.POSITIVE_INFINITY);
  });

  it("resetSession clears session counters", () => {
    const t0 = 2_000_000;
    const time = resetSession(
      {
        dayKey: localDayKey(new Date(t0)),
        dailyUsedMs: 5_000,
        sessionSliceStartedAt: null,
        sessionAccumulatedMs: 9_000,
        sessionExpired: true,
        timerOwnerId: "x",
        timerOwnerExpiresAt: t0,
      },
      t0
    );
    expect(time.sessionAccumulatedMs).toBe(0);
    expect(time.sessionExpired).toBe(false);
    expect(time.sessionSliceStartedAt).toBe(t0);
    expect(time.timerOwnerId).toBeNull();
  });

  it("rolls daily usage on new day", () => {
    const time = sanitizeTimeState(
      {
        dayKey: "2000-01-01",
        dailyUsedMs: 999_999,
        sessionSliceStartedAt: null,
        sessionAccumulatedMs: 0,
        sessionExpired: false,
      },
      Date.now()
    );
    expect(time.dailyUsedMs).toBe(0);
    expect(time.dayKey).toBe(localDayKey());
  });
});

describe("multi-tab lease", () => {
  it("only one owner holds the lease", () => {
    const t0 = 5_000_000;
    let time = sanitizeTimeState({}, t0);
    const a = claimOrRenewOwner(time, "tab-a", t0);
    expect(a.isOwner).toBe(true);
    time = a.time;
    const b = claimOrRenewOwner(time, "tab-b", t0 + 100);
    expect(b.isOwner).toBe(false);
  });

  it("expired lease can be claimed by another tab", () => {
    const t0 = 5_000_000;
    let time = sanitizeTimeState(
      {
        timerOwnerId: "tab-a",
        timerOwnerExpiresAt: t0 - 1,
      },
      t0
    );
    const b = claimOrRenewOwner(time, "tab-b", t0);
    expect(b.isOwner).toBe(true);
  });

  it("ownerHeartbeat does not double-count when folded", () => {
    const t0 = 5_000_000;
    let time = sanitizeTimeState({}, t0);
    time = { ...time, sessionSliceStartedAt: t0, sessionAccumulatedMs: 0 };
    time = ownerHeartbeat(time, t0 + 2_000, { active: true });
    expect(time.sessionAccumulatedMs).toBe(2_000);
    expect(time.sessionSliceStartedAt).toBe(t0 + 2_000);
    // Second heartbeat shortly after
    time = ownerHeartbeat(time, t0 + 3_000, { active: true });
    expect(time.sessionAccumulatedMs).toBe(3_000);
  });

  it("releaseOwner pauses for the owning tab only", () => {
    const t0 = 5_000_000;
    let time = sanitizeTimeState({}, t0);
    time = claimOrRenewOwner(time, "tab-a", t0).time;
    time = { ...time, sessionSliceStartedAt: t0 };
    const other = releaseOwner(time, "tab-b", t0 + 1_000);
    expect(other.sessionSliceStartedAt).toBe(t0);
    const self = releaseOwner(time, "tab-a", t0 + 1_000);
    expect(self.sessionSliceStartedAt).toBeNull();
    expect(self.sessionAccumulatedMs).toBe(1_000);
  });
});
