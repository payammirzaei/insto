import { describe, expect, it } from "vitest";
import {
  clampDailyBudget,
  clampSessionMinutes,
  isLimitOverridden,
  mergeSettings,
  sanitizeFriends,
  sanitizeSettings,
} from "../../src/shared/settings";
import { DEFAULT_SETTINGS } from "../../src/shared/types";

describe("sanitizeFriends", () => {
  it("normalizes and dedupes", () => {
    expect(sanitizeFriends(["@Alice", "alice", "Bob", "bad!"])).toEqual([
      "alice",
      "bob",
    ]);
  });
});

describe("sanitizeSettings", () => {
  it("fills defaults for junk", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps session and daily", () => {
    const s = sanitizeSettings({
      ...DEFAULT_SETTINGS,
      sessionMinutes: 999,
      dailyBudgetMinutes: 2,
    });
    expect(s.sessionMinutes).toBe(180);
    expect(s.dailyBudgetMinutes).toBe(5);
  });
});

describe("clamp helpers", () => {
  it("session", () => {
    expect(clampSessionMinutes(0)).toBe(1);
    expect(clampSessionMinutes(15.4)).toBe(15);
  });
  it("daily", () => {
    expect(clampDailyBudget(null)).toBeNull();
    expect(clampDailyBudget(1000)).toBe(720);
  });
});

describe("merge and override", () => {
  it("merges patches", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, { language: "fa", friends: ["a"] });
    expect(next.language).toBe("fa");
    expect(next.friends).toEqual(["a"]);
  });

  it("detects override window", () => {
    const now = 1_000_000;
    expect(
      isLimitOverridden({ ...DEFAULT_SETTINGS, limitOverrideUntil: now + 10 }, now)
    ).toBe(true);
    expect(
      isLimitOverridden({ ...DEFAULT_SETTINGS, limitOverrideUntil: now - 1 }, now)
    ).toBe(false);
  });
});
