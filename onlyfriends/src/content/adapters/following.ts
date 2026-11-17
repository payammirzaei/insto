import {
  followingVariantHomeUrl,
  isFollowingVariantUrl,
} from "../../shared/navigation.js";

export interface FollowingProbeResult {
  variantAvailable: boolean | null;
  tabDetected: boolean;
  activated: boolean;
  method: "variant_url" | "tab_click" | "none";
}

const FOLLOWING_LABEL_RE = /^(following|دنبال[‌\s]?شده|دنبال\s*می‌کنید)$/i;

/**
 * Probe whether Instagram exposes a Following feed control or ?variant=following.
 * Does not scrape APIs — only DOM + navigation on the already-authorized page.
 */
export function detectFollowingTab(root: ParentNode = document): HTMLElement | null {
  const candidates = Array.from(
    root.querySelectorAll('a, button, div[role="tab"], span[role="button"]')
  );
  for (const el of candidates) {
    const label = (el.textContent || "").trim();
    if (!FOLLOWING_LABEL_RE.test(label)) continue;
    // Prefer elements near the top of the main feed
    return el as HTMLElement;
  }
  return null;
}

export async function tryActivateFollowingFeed(
  options: { navigateVariant?: boolean } = {}
): Promise<FollowingProbeResult> {
  const tab = detectFollowingTab(document);
  if (tab) {
    try {
      tab.click();
      return {
        variantAvailable: isFollowingVariantUrl(location.href) ? true : null,
        tabDetected: true,
        activated: true,
        method: "tab_click",
      };
    } catch {
      // fall through
    }
  }

  if (options.navigateVariant !== false) {
    // Soft probe: only navigate if we are on home and not already on variant
    const onHome =
      location.pathname === "/" || location.pathname === "";
    if (onHome && !isFollowingVariantUrl(location.href)) {
      // Do not auto-navigate aggressively — mark as probe candidate only.
      // Caller may choose to navigate. We report availability as null (unverified).
      return {
        variantAvailable: null,
        tabDetected: Boolean(tab),
        activated: false,
        method: "none",
      };
    }
    if (isFollowingVariantUrl(location.href)) {
      return {
        variantAvailable: true,
        tabDetected: Boolean(tab),
        activated: true,
        method: "variant_url",
      };
    }
  }

  return {
    variantAvailable: null,
    tabDetected: Boolean(tab),
    activated: false,
    method: "none",
  };
}

export function navigateToFollowingVariant(): void {
  location.assign(followingVariantHomeUrl());
}
