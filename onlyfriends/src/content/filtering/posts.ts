import {
  decideVisibility,
  usernameFromHref,
  type MatchDecision,
} from "../../shared/username.js";

export interface PostFilterResult {
  shown: number;
  hidden: number;
  unknownAuthor: number;
  decisions: MatchDecision[];
}

const SUGGESTED_RE =
  /suggested\s+for\s+you|suggested\s+posts|sponsored|advertisement|پست‌های\s+پیشنهادی|پیشنهاد\s+شده|حامی\s+مالی/i;

/**
 * Find a plausible author username from a post article.
 * Returns null when no reliable profile link is found (fail closed).
 */
export function extractAuthorFromArticle(article: Element): string | null {
  // Prefer header-ish links: early anchors that look like profiles
  const anchors = Array.from(article.querySelectorAll("a[href]"));
  for (const a of anchors) {
    const href = a.getAttribute("href");
    const user = usernameFromHref(href);
    if (!user) continue;
    // Skip in-content mentions that appear deep in the tree after media
    // Heuristic: author links usually appear before the main image/video
    const media = article.querySelector("img, video");
    if (media && a.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING) {
      return user;
    }
    // No media yet — take first valid profile link
    return user;
  }
  return null;
}

export function looksLikeSuggestedOrAd(article: Element): boolean {
  const text = (article.textContent || "").slice(0, 800);
  if (SUGGESTED_RE.test(text)) return true;
  const labeled = article.querySelector(
    '[aria-label*="Sponsored" i], [aria-label*="Suggested" i]'
  );
  return Boolean(labeled);
}

export function filterFeedArticles(
  root: ParentNode,
  allowlist: Set<string>,
  options: { strict: boolean; hideSuggested: boolean }
): PostFilterResult {
  const articles = Array.from(root.querySelectorAll("article"));
  const decisions: MatchDecision[] = [];
  let shown = 0;
  let hidden = 0;
  let unknownAuthor = 0;

  for (const article of articles) {
    if (options.hideSuggested && looksLikeSuggestedOrAd(article)) {
      setPostVisibility(article, false, "suggested_or_ad");
      hidden++;
      continue;
    }

    if (!options.strict) {
      setPostVisibility(article, true, "non_strict");
      shown++;
      continue;
    }

    const author = extractAuthorFromArticle(article);
    const decision = decideVisibility(author, allowlist, { failClosed: true });
    decisions.push(decision);

    if (decision.action === "show") {
      setPostVisibility(article, true, decision.reason);
      shown++;
    } else {
      setPostVisibility(article, false, decision.reason);
      hidden++;
      if (decision.reason === "unknown_author") unknownAuthor++;
    }
  }

  return { shown, hidden, unknownAuthor, decisions };
}

export function setPostVisibility(
  el: Element,
  visible: boolean,
  reason: string
): void {
  const html = el as HTMLElement;
  if (visible) {
    html.style.removeProperty("display");
    html.removeAttribute("data-of-hidden");
    html.removeAttribute("data-of-reason");
    html.setAttribute("data-of-filtered", "show");
  } else {
    html.style.display = "none";
    html.setAttribute("data-of-hidden", "true");
    html.setAttribute("data-of-reason", reason);
    html.setAttribute("data-of-filtered", "hide");
  }
}
