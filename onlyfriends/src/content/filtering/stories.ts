import { usernameFromHref, decideVisibility } from "../../shared/username.js";

export interface StoryFilterResult {
  shown: number;
  hidden: number;
  unknown: number;
  matching: "reliable" | "partial" | "unavailable";
}

const OWN_STORY_RE = /your\s+story|استوری\s+تو|داستان\s+شما/i;

export function extractStoryUsername(link: Element): string | null {
  const href = link.getAttribute("href");
  const fromHref = usernameFromHref(href);
  if (fromHref) return fromHref;

  // Some trays put username in aria-label: "username's story"
  const label = link.getAttribute("aria-label") || "";
  const m = label.match(/^([a-z0-9._]{1,30})(?:'s)?\s+story/i);
  if (m) return m[1].toLowerCase();

  return null;
}

export function isOwnStoryEntry(link: Element): boolean {
  const label = `${link.getAttribute("aria-label") || ""} ${link.textContent || ""}`;
  return OWN_STORY_RE.test(label);
}

/**
 * Filter story tray links. Fail closed for unknown usernames in strict mode.
 * Does NOT attempt to filter the fullscreen story viewer swipe chain.
 */
export function filterStoryTray(
  root: ParentNode,
  allowlist: Set<string>,
  options: { strict: boolean }
): StoryFilterResult {
  const links = Array.from(root.querySelectorAll('a[href*="/stories/"]'));
  if (links.length === 0) {
    return { shown: 0, hidden: 0, unknown: 0, matching: "unavailable" };
  }

  let shown = 0;
  let hidden = 0;
  let unknown = 0;
  let identified = 0;

  for (const link of links) {
    const el = link as HTMLElement;

    if (isOwnStoryEntry(link)) {
      showStory(el);
      shown++;
      identified++;
      continue;
    }

    if (!options.strict) {
      showStory(el);
      shown++;
      continue;
    }

    const user = extractStoryUsername(link);
    if (!user) {
      hideStory(el, "unknown_author");
      hidden++;
      unknown++;
      continue;
    }

    identified++;
    const decision = decideVisibility(user, allowlist, { failClosed: true });
    if (decision.action === "show") {
      showStory(el);
      shown++;
    } else {
      hideStory(el, decision.reason);
      hidden++;
    }
  }

  let matching: StoryFilterResult["matching"] = "reliable";
  if (identified === 0) matching = "unavailable";
  else if (unknown > 0) matching = "partial";

  return { shown, hidden, unknown, matching };
}

function showStory(el: HTMLElement): void {
  // Hide the clickable ring and try to collapse its nearest list item wrapper
  el.style.removeProperty("display");
  el.removeAttribute("data-of-hidden");
  const wrap = el.closest("li, [role='listitem'], div") as HTMLElement | null;
  if (wrap && wrap !== el && wrap.querySelectorAll('a[href*="/stories/"]').length <= 1) {
    wrap.style.removeProperty("display");
    wrap.removeAttribute("data-of-hidden");
  }
}

function hideStory(el: HTMLElement, reason: string): void {
  el.style.display = "none";
  el.setAttribute("data-of-hidden", "true");
  el.setAttribute("data-of-reason", reason);
  const wrap = el.closest("li, [role='listitem']") as HTMLElement | null;
  if (wrap && wrap.querySelectorAll('a[href*="/stories/"]').length <= 1) {
    wrap.style.display = "none";
    wrap.setAttribute("data-of-hidden", "true");
  }
}

/**
 * Story viewer navigation (next/prev) is unsafe to filter — Instagram may
 * advance to non-allowlisted users. Callers should document this and avoid
 * injecting fake next/prev interception that breaks accessibility.
 */
export function canSafelyFilterStoryViewer(): false {
  return false;
}
