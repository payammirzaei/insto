/**
 * Username normalization and matching for Strict Friends mode.
 * Instagram usernames are case-insensitive; we strip leading @ and whitespace.
 */

const USERNAME_RE = /^[a-z0-9._]{1,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  const n = normalizeUsername(raw);
  return n.length > 0 && USERNAME_RE.test(n);
}

export function buildAllowlist(friends: string[]): Set<string> {
  const set = new Set<string>();
  for (const f of friends) {
    const n = normalizeUsername(f);
    if (n && USERNAME_RE.test(n)) set.add(n);
  }
  return set;
}

/**
 * Extract a username from an Instagram profile href.
 * Accepts /username/, /username, https://www.instagram.com/username/, etc.
 * Rejects known non-profile path segments.
 */
const RESERVED_PATHS = new Set([
  "explore",
  "reels",
  "reel",
  "stories",
  "direct",
  "accounts",
  "about",
  "legal",
  "developer",
  "directory",
  "web",
  "graphql",
  "api",
  "p",
  "tv",
  "tagged",
  "guide",
  "live",
  "challenge",
  "session",
  "privacy",
  "terms",
  "emails",
  "push",
  "nametag",
  "create",
  // Mobile web app shell — not a username
  "u",
]);

export function usernameFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const url = href.startsWith("http")
      ? new URL(href)
      : new URL(href, "https://www.instagram.com");
    if (!url.hostname.includes("instagram.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const candidate = parts[0].toLowerCase();
    // /stories/username/... must be handled before the reserved-path reject
    if (candidate === "stories") {
      const storyUser = parts[1]?.toLowerCase();
      if (!storyUser) return null;
      if (RESERVED_PATHS.has(storyUser) || storyUser === "viewer") return null;
      if (!USERNAME_RE.test(storyUser)) return null;
      return storyUser;
    }
    if (RESERVED_PATHS.has(candidate)) return null;
    if (parts.length >= 2 && (parts[1] === "reel" || parts[1] === "p")) return null;
    if (!USERNAME_RE.test(candidate)) return null;
    return candidate;
  } catch {
    return null;
  }
}

export function isAllowedUsername(
  username: string | null | undefined,
  allowlist: Set<string>
): boolean {
  if (!username) return false;
  return allowlist.has(normalizeUsername(username));
}

/**
 * Decide whether a post/story should be shown in Strict Friends mode.
 * failClosed: if author cannot be determined, hide (do not show unrelated content).
 */
export type MatchDecision =
  | { action: "show"; reason: "allowlisted"; username: string }
  | { action: "hide"; reason: "not_allowlisted"; username: string }
  | { action: "hide"; reason: "unknown_author" }
  | { action: "show"; reason: "empty_allowlist_passthrough" };

export function decideVisibility(
  authorUsername: string | null | undefined,
  allowlist: Set<string>,
  options: { failClosed?: boolean; emptyAllowlistPassthrough?: boolean } = {}
): MatchDecision {
  const failClosed = options.failClosed !== false;
  const emptyPassthrough = options.emptyAllowlistPassthrough === true;

  if (allowlist.size === 0) {
    if (emptyPassthrough) {
      return { action: "show", reason: "empty_allowlist_passthrough" };
    }
    // Empty allowlist in strict mode: fail closed (show nothing from feed)
    return { action: "hide", reason: "unknown_author" };
  }

  if (!authorUsername) {
    return failClosed
      ? { action: "hide", reason: "unknown_author" }
      : { action: "show", reason: "empty_allowlist_passthrough" };
  }

  const n = normalizeUsername(authorUsername);
  if (allowlist.has(n)) {
    return { action: "show", reason: "allowlisted", username: n };
  }
  return { action: "hide", reason: "not_allowlisted", username: n };
}
