import type { Settings, TimeState } from "../../shared/types.js";
import {
  claimOrRenewOwner,
  currentSessionUsedMs,
  expireSession,
  isTimeExpired,
  ownerHeartbeat,
  releaseOwner,
  remainingDailyMs,
  remainingSessionMs,
  resetSession,
} from "../../shared/time.js";
import { getTimeState, setTimeState } from "../../shared/storage.js";
import { mergeSettings, saveSettings } from "../../shared/settings.js";

export interface TrackerController {
  getTime: () => TimeState;
  tick: (settings: Settings) => Promise<{ expired: boolean; time: TimeState }>;
  start: (settings: Settings) => Promise<TimeState>;
  pause: () => Promise<TimeState>;
  override: (settings: Settings, minutes?: number) => Promise<Settings>;
  newSession: (settings: Settings) => Promise<TimeState>;
  remainingLabelParts: (settings: Settings) => {
    sessionMs: number;
    dailyMs: number | null;
  };
  /** Adopt time written by another tab. */
  adopt: (time: TimeState) => void;
}

function newOwnerId(): string {
  return `of_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createTracker(): TrackerController {
  let cache: TimeState | null = null;
  const ownerId = newOwnerId();
  let visible = document.visibilityState === "visible";

  const ensure = async () => {
    // Always re-read so multi-tab / reload state stays coherent
    cache = await getTimeState();
    return cache;
  };

  const persist = async (time: TimeState) => {
    cache = time;
    await setTimeState(time);
    return time;
  };

  document.addEventListener("visibilitychange", () => {
    visible = document.visibilityState === "visible";
  });

  return {
    getTime: () =>
      cache ?? {
        dayKey: "",
        dailyUsedMs: 0,
        sessionSliceStartedAt: null,
        sessionAccumulatedMs: 0,
        sessionExpired: false,
        timerOwnerId: null,
        timerOwnerExpiresAt: null,
      },

    adopt(time) {
      cache = time;
    },

    async start(settings) {
      let time = await ensure();
      if (!settings.enabled || !visible || isTimeExpired(settings, time)) {
        return time;
      }
      const claimed = claimOrRenewOwner(time, ownerId);
      time = claimed.time;
      if (claimed.isOwner) {
        time = ownerHeartbeat(time, Date.now(), { active: true });
      }
      return persist(time);
    },

    async pause() {
      let time = await ensure();
      if (time.timerOwnerId === ownerId) {
        time = releaseOwner(time, ownerId);
        return persist(time);
      }
      return time;
    },

    async tick(settings) {
      let time = await ensure();

      if (!settings.enabled) {
        if (time.timerOwnerId === ownerId) {
          time = await persist(releaseOwner(time, ownerId));
        }
        return { expired: false, time };
      }

      if (!visible) {
        if (time.timerOwnerId === ownerId) {
          time = await persist(releaseOwner(time, ownerId));
        } else {
          // Refresh display-only from storage
          cache = time;
        }
        return {
          expired: time.sessionExpired || isTimeExpired(settings, time),
          time,
        };
      }

      // Visible tab: try to own the lease and advance
      const claimed = claimOrRenewOwner(time, ownerId);
      time = claimed.time;

      if (claimed.isOwner) {
        time = ownerHeartbeat(time, Date.now(), {
          active: !time.sessionExpired,
        });
        if (isTimeExpired(settings, time)) {
          time = expireSession(time);
          await persist(time);
          return { expired: true, time };
        }
        await persist(time);
        return { expired: false, time };
      }

      // Non-owner: display only
      cache = time;
      const expired = time.sessionExpired || isTimeExpired(settings, time);
      return { expired, time };
    },

    async override(settings, minutes = 10) {
      const until = Date.now() + minutes * 60_000;
      const next = await saveSettings(
        mergeSettings(settings, {
          limitOverrideUntil: until,
        })
      );
      let time = await ensure();
      const claimed = claimOrRenewOwner(time, ownerId);
      time = {
        ...claimed.time,
        sessionExpired: false,
        sessionSliceStartedAt: Date.now(),
        timerOwnerId: ownerId,
        timerOwnerExpiresAt: Date.now() + 3_000,
      };
      await persist(time);
      return next;
    },

    async newSession(settings) {
      let time = await ensure();
      time = resetSession(time);
      if (settings.enabled && visible) {
        const claimed = claimOrRenewOwner(time, ownerId);
        time = ownerHeartbeat(claimed.time, Date.now(), { active: true });
      }
      return persist(time);
    },

    remainingLabelParts(settings) {
      const time = cache;
      if (!time) return { sessionMs: settings.sessionMinutes * 60_000, dailyMs: null };
      return {
        sessionMs: remainingSessionMs(settings, time),
        dailyMs: remainingDailyMs(settings, time),
      };
    },
  };
}

export function summarizeUsage(settings: Settings, time: TimeState): string {
  const used = Math.round(currentSessionUsedMs(time) / 60_000);
  return `${used}/${settings.sessionMinutes}`;
}
