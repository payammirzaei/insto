/**
 * URL / SPA route helpers for Instagram web.
 * Used by navigation guards and Following-mode detection.
 *
 * Live mobile (Android-style) nav verified 2026-11-16 (logged-out shell):
 *   Home    → /?nb=l
 *   Direct  → /u/direct/
 *   Reels   → /reels/
 *   Explore → /explore/  (aria/text: "Search & Explore")
 *   Profile → /u/profile/
 *
 * Classic desktop paths (/direct/inbox/, /) remain supported as assumed fallbacks.
 */

export type InstagramSection =
  | "home"
  | "explore"
  | "reels"
  | "direct"
  | "stories"
  | "profile"
  | "post"
  | "accounts"
  | "following_feed"
  | "other";

const BLOCKED_SECTIONS: InstagramSection[] = ["explore", "reels"];

/** App-shell prefixes used by Instagram mobile web (not usernames). */
const APP_SHELL = new Set(["u"]);

const RESERVED = new Set([
  "about",
  "legal",
  "developer",
  "directory",
  "web",
  "graphql",
  "api",
  "tv",
  "tagged",
  "guide",
  "live",
  "challenge",
  "session",
  "privacy",
  "terms",
  "create",
  "nametag",
]);

export function parseInstagramPath(pathname: string): {
  section: InstagramSection;
  username: string | null;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { section: "home", username: null };

  const head = parts[0].toLowerCase();

  // Mobile app shell: /u/direct/, /u/profile/, /u/…
  if (APP_SHELL.has(head)) {
    const second = parts[1]?.toLowerCase();
    if (second === "direct") return { section: "direct", username: null };
    if (second === "profile") return { section: "profile", username: null };
    if (second === "explore") return { section: "explore", username: null };
    if (second === "reels" || second === "reel") return { section: "reels", username: null };
    return { section: "other", username: null };
  }

  if (head === "explore") return { section: "explore", username: null };
  if (head === "reels" || head === "reel") return { section: "reels", username: null };
  if (head === "direct") return { section: "direct", username: null };
  if (head === "stories") {
    return { section: "stories", username: parts[1]?.toLowerCase() ?? null };
  }
  if (head === "accounts") return { section: "accounts", username: null };
  if (head === "p") return { section: "post", username: null };

  if (!RESERVED.has(head)) {
    return { section: "profile", username: head };
  }
  return { section: "other", username: null };
}

export function isBlockedSection(section: InstagramSection): boolean {
  return BLOCKED_SECTIONS.includes(section);
}

export function isBlockedPath(pathname: string): boolean {
  return isBlockedSection(parseInstagramPath(pathname).section);
}

export function isBlockedUrl(url: string): boolean {
  try {
    const u = new URL(url, "https://www.instagram.com");
    if (!u.hostname.includes("instagram.com")) return false;
    return isBlockedPath(u.pathname);
  } catch {
    return false;
  }
}

/**
 * Detect Following-feed variant query if Instagram exposes it.
 * Unverified across locales/experiments — callers must treat as optional.
 */
export function isFollowingVariantUrl(url: string): boolean {
  try {
    const u = new URL(url, "https://www.instagram.com");
    if (!u.hostname.includes("instagram.com")) return false;
    const variant = u.searchParams.get("variant");
    return variant === "following";
  } catch {
    return false;
  }
}

export function followingVariantHomeUrl(): string {
  return "https://www.instagram.com/?variant=following";
}

export function safeRedirectPath(pathname: string): string {
  if (isBlockedPath(pathname)) return "/";
  return pathname || "/";
}

export function isDirectMessagesPath(pathname: string): boolean {
  return parseInstagramPath(pathname).section === "direct";
}

/** Feed/story filtering should not run on messaging surfaces. */
export function shouldFilterFeed(pathname: string): boolean {
  const { section } = parseInstagramPath(pathname);
  return section !== "direct" && section !== "accounts";
}

export function isPermittedPath(pathname: string): boolean {
  const { section } = parseInstagramPath(pathname);
  return !isBlockedSection(section);
}

/** Prefer mobile shell URL when opening DMs from OnlyFriends UI. */
export function messagesUrl(): string {
  return "https://www.instagram.com/direct/inbox/";
}

export function messagesUrlMobilePreferred(): string {
  // Both work when signed in; mobile shell uses /u/direct/ in bottom nav.
  return "https://www.instagram.com/u/direct/";
}
