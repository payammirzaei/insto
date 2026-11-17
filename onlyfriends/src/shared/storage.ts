import {
  DEFAULT_TIME_STATE,
  STORAGE_KEYS,
  type CapabilityReport,
  type Settings,
  type TimeState,
} from "./types.js";
import { sanitizeSettings } from "./settings.js";
import { sanitizeTimeState } from "./time.js";

export async function getSettings(): Promise<Settings> {
  const data = await browser.storage.local.get(STORAGE_KEYS.settings);
  return sanitizeSettings(data[STORAGE_KEYS.settings]);
}

export async function setSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEYS.settings]: sanitizeSettings(settings),
  });
}

export async function getTimeState(): Promise<TimeState> {
  const data = await browser.storage.local.get(STORAGE_KEYS.time);
  return sanitizeTimeState(data[STORAGE_KEYS.time] ?? DEFAULT_TIME_STATE);
}

export async function setTimeState(time: TimeState): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEYS.time]: sanitizeTimeState(time),
  });
}

export async function getCapabilities(): Promise<CapabilityReport | null> {
  const data = await browser.storage.local.get(STORAGE_KEYS.capabilities);
  const raw = data[STORAGE_KEYS.capabilities];
  if (!raw || typeof raw !== "object") return null;
  return raw as CapabilityReport;
}

export async function setCapabilities(report: CapabilityReport): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.capabilities]: report });
}

export function onStorageChanged(
  handler: (changes: { settings?: Settings; time?: TimeState }) => void
): () => void {
  const listener = (
    changes: Record<string, browser.storage.StorageChange>,
    area: string
  ) => {
    if (area !== "local") return;
    const out: { settings?: Settings; time?: TimeState } = {};
    if (changes[STORAGE_KEYS.settings]) {
      out.settings = sanitizeSettings(changes[STORAGE_KEYS.settings].newValue);
    }
    if (changes[STORAGE_KEYS.time]) {
      out.time = sanitizeTimeState(changes[STORAGE_KEYS.time].newValue);
    }
    if (out.settings || out.time) handler(out);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
