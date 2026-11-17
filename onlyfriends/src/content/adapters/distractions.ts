import {
  isBlockedUrl,
  isDirectMessagesPath,
} from "../../shared/navigation.js";

const HIDE_HREF_SELECTORS = [
  'a[href="/explore/"]',
  'a[href^="/explore/"]',
  'a[href="/reels/"]',
  'a[href^="/reels/"]',
  'a[href^="/reel/"]',
  // Mobile shell variants (defensive — verified Explore/Reels use classic paths)
  'a[href="/u/explore/"]',
  'a[href^="/u/explore/"]',
  'a[href="/u/reels/"]',
  'a[href^="/u/reels/"]',
];

const SUGGESTION_TEXT_RE =
  /suggested\s+for\s+you|people\s+you\s+may\s+know|suggested\s+accounts|discover\s+people|پیشنهاد\s+برای\s+شما|افرادی\s+که\s+ممکن/i;

/**
 * Apply CSS classes / inline hides for known distraction entry points.
 * Idempotent; safe to call on every debounced mutation pass.
 * Never hides Direct (/direct/… or /u/direct/) or profile links.
 */
export function hideDistractionNav(root: ParentNode = document): number {
  let count = 0;
  for (const sel of HIDE_HREF_SELECTORS) {
    for (const el of Array.from(root.querySelectorAll(sel))) {
      const html = el as HTMLElement;
      const href = html.getAttribute("href") || "";
      // Belt-and-suspenders: never hide DM or profile shell links
      if (/\/direct\//i.test(href) || /\/u\/direct/i.test(href)) continue;
      if (/\/u\/profile/i.test(href)) continue;
      if (html.dataset.ofNavHidden === "1") continue;
      html.dataset.ofNavHidden = "1";
      html.style.display = "none";
      html.setAttribute("aria-hidden", "true");
      html.tabIndex = -1;
      count++;
    }
  }
  return count;
}

export function hideSuggestionPanels(root: ParentNode = document): number {
  // Never run aggressive suggestion hiding on messaging surfaces
  if (isDirectMessagesPath(location.pathname)) return 0;

  let count = 0;
  const candidates = root.querySelectorAll("aside, section");
  for (const el of Array.from(candidates)) {
    const html = el as HTMLElement;
    if (html.closest("#onlyfriends-root")) continue;
    if (html.dataset.ofSuggestionHidden === "1") continue;
    const text = (html.textContent || "").slice(0, 200);
    if (!SUGGESTION_TEXT_RE.test(text)) continue;
    if (html.querySelectorAll("article").length > 2) continue;
    if ((html.textContent || "").length > 4000) continue;
    html.dataset.ofSuggestionHidden = "1";
    html.style.display = "none";
    count++;
  }
  return count;
}

export function installClickGuard(
  onBlocked: (url: string) => void
): () => void {
  const handler = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target) return;
    if (target.closest("#onlyfriends-root")) return;
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.href || anchor.getAttribute("href") || "";
    if (!isBlockedUrl(href)) return;
    // From DMs, allow opening a shared Reel/Explore link (messaging must stay usable).
    if (isDirectMessagesPath(location.pathname)) return;
    event.preventDefault();
    event.stopPropagation();
    onBlocked(href);
  };

  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
}

/** Soft-block SPA pushes to explore/reels via history when detectable. */
export function installHistoryGuard(
  onBlocked: (url: string) => void
): () => void {
  const check = () => {
    const url = location.href;
    if (!isBlockedUrl(url)) return;
    onBlocked(url);
    history.replaceState(history.state, "", "/");
  };

  const wrap = (fn: typeof history.pushState) =>
    function (this: History, ...args: Parameters<typeof history.pushState>) {
      const result = fn.apply(this, args);
      queueMicrotask(check);
      return result;
    };

  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);
  history.pushState = wrap(originalPush);
  history.replaceState = wrap(originalReplace);

  window.addEventListener("popstate", check);
  check();

  return () => {
    history.pushState = originalPush;
    history.replaceState = originalReplace;
    window.removeEventListener("popstate", check);
  };
}
