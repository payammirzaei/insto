import { buildAllowlist } from "../shared/username.js";
import { t, dirForLanguage } from "../shared/i18n.js";
import { formatRemaining } from "../shared/time.js";
import {
  getCapabilities,
  getSettings,
  onStorageChanged,
  setCapabilities,
} from "../shared/storage.js";
import { mergeSettings, saveSettings } from "../shared/settings.js";
import type { CapabilityReport, Settings } from "../shared/types.js";
import {
  isFollowingVariantUrl,
  messagesUrlMobilePreferred,
  shouldFilterFeed,
} from "../shared/navigation.js";
import { filterFeedArticles } from "./filtering/posts.js";
import {
  canSafelyFilterStoryViewer,
  filterStoryTray,
} from "./filtering/stories.js";
import {
  hideDistractionNav,
  hideSuggestionPanels,
  installClickGuard,
  installHistoryGuard,
} from "./adapters/distractions.js";
import { detectFollowingTab, tryActivateFollowingFeed } from "./adapters/following.js";
import { createDebouncedObserver } from "./adapters/observer.js";
import { mountOfRoot, type OfRoot } from "./ui/mount.js";
import { renderSettingsPanel } from "./ui/settings-panel.js";
import { renderSessionEnd } from "./ui/session-end.js";
import { renderBlockedNotice } from "./ui/blocked.js";
import { createTracker } from "./time/tracker.js";

let settings: Settings;
let ui: OfRoot;
let tracker = createTracker();
let unsubSettings: (() => void) | null = null;
let unmountPanel: (() => void) | null = null;
let unmountEnd: (() => void) | null = null;
let unmountBlocked: (() => void) | null = null;
let timerEl: HTMLButtonElement | null = null;
let fabEl: HTMLButtonElement | null = null;
let caps: CapabilityReport = {
  followingVariantAvailable: null,
  followingTabDetected: null,
  feedAuthorMatching: "unavailable",
  storyUsernameMatching: "unavailable",
  storyViewerFiltering: "unsafe",
  lastCheckedAt: null,
};
let followingAttempted = false;
let statusBanner: HTMLElement | null = null;

async function main(): Promise<void> {
  settings = await getSettings();
  const storedCaps = await getCapabilities();
  if (storedCaps) caps = storedCaps;

  ui = mountOfRoot();
  ui.setTheme(settings.theme);
  ui.setLanguage(settings.language);

  ensureChrome();
  await tracker.start(settings);

  const observer = createDebouncedObserver({
    debounceMs: 140,
    onMutate: () => applyPageFilters(),
  });
  observer.start();

  installClickGuard((url) => showBlocked(url));
  installHistoryGuard((url) => showBlocked(url));

  unsubSettings = onStorageChanged(async (changes) => {
    if (changes.settings) {
      settings = changes.settings;
      ui.setTheme(settings.theme);
      ui.setLanguage(settings.language);
      followingAttempted = false;
      ensureChrome();
      applyPageFilters();
      await tracker.tick(settings);
      updateTimer();
    }
    if (changes.time) {
      tracker.adopt(changes.time);
      updateTimer();
      if (changes.time.sessionExpired) showSessionEnd();
      else if (!changes.time.sessionExpired) hideSessionEnd();
    }
  });

  browser.runtime.onMessage.addListener((msg: { type?: string }) => {
    if (msg?.type === "OF_OPEN_SETTINGS") {
      openSettings();
    }
    if (msg?.type === "OF_PING") {
      return Promise.resolve({ ok: true });
    }
  });

  applyPageFilters();
  void maybeActivateFollowing();

  setInterval(async () => {
    const { expired } = await tracker.tick(settings);
    updateTimer();
    if (expired) showSessionEnd();
    else hideSessionEnd();
  }, 1000);

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden") {
      await tracker.pause();
    } else {
      await tracker.start(settings);
      applyPageFilters();
    }
  });
}

function ensureChrome(): void {
  if (!fabEl) {
    fabEl = document.createElement("button");
    fabEl.type = "button";
    fabEl.className = "of-fab of-interactive";
    fabEl.textContent = "OF";
    fabEl.title = t("settings", settings.language);
    fabEl.setAttribute("aria-label", t("settings", settings.language));
    fabEl.addEventListener("click", () => openSettings());
    ui.root.append(fabEl);
  }
  fabEl.title = t("settings", settings.language);
  fabEl.setAttribute("aria-label", t("settings", settings.language));

  if (!timerEl) {
    // Button so mobile users can open settings if FAB is covered by IG/Firefox chrome
    timerEl = document.createElement("button");
    timerEl.type = "button";
    timerEl.className = "of-timer of-interactive";
    timerEl.setAttribute("role", "status");
    timerEl.title = t("settings", settings.language);
    timerEl.addEventListener("click", () => openSettings());
    ui.root.append(timerEl);
  }
  timerEl.title = t("settings", settings.language);
  updateTimer();
}

function updateTimer(): void {
  if (!timerEl) return;
  if (!settings.enabled) {
    timerEl.textContent = t("appName", settings.language);
    return;
  }
  const { sessionMs, dailyMs } = tracker.remainingLabelParts(settings);
  const sessionLabel = formatRemaining(sessionMs, settings.language);
  let text = `${t("timeRemaining", settings.language)}: ${sessionLabel}`;
  if (dailyMs !== null) {
    text += ` · ${formatRemaining(dailyMs, settings.language)}`;
  }
  timerEl.textContent = text;
}

function applyPageFilters(): void {
  if (!settings.enabled) {
    clearStatus();
    return;
  }

  hideDistractionNav(document);

  const onMessaging = !shouldFilterFeed(location.pathname);
  if (onMessaging) {
    // Keep Explore/Reels nav hidden, but never filter DM DOM / suggestion panels.
    clearStatus();
    return;
  }

  hideSuggestionPanels(document);

  const allowlist = buildAllowlist(settings.friends);
  const strict = settings.mode === "strict";
  const useStrict = strict;

  if (settings.mode === "following" && followingAttempted && !isFollowingActive()) {
    showStatus(t("followingUnavailable", settings.language), "warn");
  }

  if (strict && allowlist.size === 0) {
    showStatus(t("emptyAllowlist", settings.language), "warn");
  }

  const feed = filterFeedArticles(document, allowlist, {
    strict: useStrict,
    hideSuggested: true,
  });

  const stories = filterStoryTray(document, allowlist, { strict: useStrict });

  if (feed.shown + feed.hidden > 0) {
    caps.feedAuthorMatching =
      feed.unknownAuthor === 0
        ? "reliable"
        : feed.unknownAuthor < feed.hidden
          ? "partial"
          : feed.shown === 0 && feed.unknownAuthor > 0
            ? "unavailable"
            : "partial";
  }
  caps.storyUsernameMatching = stories.matching;
  caps.storyViewerFiltering = canSafelyFilterStoryViewer() ? "safe" : "unsafe";
  caps.followingTabDetected = Boolean(detectFollowingTab(document));
  caps.followingVariantAvailable = isFollowingVariantUrl(location.href)
    ? true
    : caps.followingVariantAvailable;
  caps.lastCheckedAt = Date.now();
  void setCapabilities(caps);

  if (useStrict && feed.unknownAuthor > 0) {
    showStatus(t("unsupportedAuthors", settings.language), "warn");
  } else if (stories.matching === "partial") {
    showStatus(t("storyFilterPartial", settings.language), "warn");
  } else if (strict && allowlist.size > 0) {
    if (statusBanner && statusBanner.dataset.kind === "empty") clearStatus();
  }
}

function isFollowingActive(): boolean {
  return (
    isFollowingVariantUrl(location.href) ||
    detectFollowingTab(document)?.getAttribute("aria-selected") === "true"
  );
}

async function maybeActivateFollowing(): Promise<void> {
  if (!settings.enabled || settings.mode !== "following") return;
  if (followingAttempted) return;
  if (!shouldFilterFeed(location.pathname)) return;
  followingAttempted = true;
  const result = await tryActivateFollowingFeed({ navigateVariant: false });
  caps.followingTabDetected = result.tabDetected;
  caps.followingVariantAvailable = result.variantAvailable;
  await setCapabilities(caps);
  if (!result.activated) {
    showStatus(t("followingUnavailable", settings.language), "warn");
  }
  applyPageFilters();
}

function showStatus(message: string, kind: "info" | "warn" = "info"): void {
  if (!statusBanner) {
    statusBanner = document.createElement("div");
    statusBanner.className = "of-banner of-interactive";
    statusBanner.style.position = "fixed";
    statusBanner.style.left = "12px";
    statusBanner.style.right = "12px";
    statusBanner.style.bottom = "calc(160px + env(safe-area-inset-bottom, 0px))";
    statusBanner.style.zIndex = "1";
    ui.root.append(statusBanner);
  }
  statusBanner.dataset.kind = kind === "warn" ? "warn" : "info";
  statusBanner.classList.toggle("warn", kind === "warn");
  statusBanner.textContent = message;
  statusBanner.dir = dirForLanguage(settings.language);
}

function clearStatus(): void {
  statusBanner?.remove();
  statusBanner = null;
}

function openSettings(): void {
  unmountPanel?.();
  unmountPanel = renderSettingsPanel(ui.root, settings, caps, {
    onClose: () => {
      unmountPanel?.();
      unmountPanel = null;
    },
    onSave: async (next) => {
      settings = await saveSettings(next);
      ui.setTheme(settings.theme);
      ui.setLanguage(settings.language);
      followingAttempted = false;
      unmountPanel?.();
      unmountPanel = null;
      ensureChrome();
      applyPageFilters();
      void maybeActivateFollowing();
      await tracker.tick(settings);
      updateTimer();
    },
  });
}

function showSessionEnd(): void {
  if (unmountEnd) return;
  unmountEnd = renderSessionEnd(ui.root, settings.language, {
    onOverride: async () => {
      settings = await tracker.override(settings, 10);
      hideSessionEnd();
      updateTimer();
    },
    onNewSession: async () => {
      settings = await saveSettings(
        mergeSettings(settings, { limitOverrideUntil: null })
      );
      await tracker.newSession(settings);
      hideSessionEnd();
      updateTimer();
    },
    onMessages: () => {
      location.assign(messagesUrlMobilePreferred());
    },
  });
}

function hideSessionEnd(): void {
  unmountEnd?.();
  unmountEnd = null;
}

function showBlocked(_url: string): void {
  unmountBlocked?.();
  unmountBlocked = renderBlockedNotice(ui.root, settings.language, {
    onHome: () => {
      unmountBlocked?.();
      unmountBlocked = null;
      location.assign("https://www.instagram.com/");
    },
    onMessages: () => {
      unmountBlocked?.();
      unmountBlocked = null;
      location.assign(messagesUrlMobilePreferred());
    },
    onDismiss: () => {
      unmountBlocked?.();
      unmountBlocked = null;
    },
  });
}

void main().catch((err) => {
  console.warn("[OnlyFriends] init failed", err);
});
