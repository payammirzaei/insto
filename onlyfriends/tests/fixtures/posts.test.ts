import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractAuthorFromArticle,
  filterFeedArticles,
} from "../../src/content/filtering/posts";
import { buildAllowlist } from "../../src/shared/username";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "feed.html"), "utf8");

describe("feed DOM fixtures", () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it("extracts authors when profile links exist", () => {
    const alice = document.querySelector('[data-testid="post-alice"]')!;
    const unknown = document.querySelector('[data-testid="post-unknown"]')!;
    expect(extractAuthorFromArticle(alice)).toBe("alice");
    expect(extractAuthorFromArticle(unknown)).toBeNull();
  });

  it("strict mode shows allowlist only and fails closed on unknown", () => {
    const allow = buildAllowlist(["alice"]);
    const result = filterFeedArticles(document, allow, {
      strict: true,
      hideSuggested: true,
    });

    expect(
      document.querySelector('[data-testid="post-alice"]')!.getAttribute("data-of-filtered")
    ).toBe("show");
    expect(
      document.querySelector('[data-testid="post-bob"]')!.getAttribute("data-of-hidden")
    ).toBe("true");
    expect(
      document.querySelector('[data-testid="post-unknown"]')!.getAttribute("data-of-hidden")
    ).toBe("true");
    expect(
      document.querySelector('[data-testid="post-suggested"]')!.getAttribute("data-of-hidden")
    ).toBe("true");
    expect(result.unknownAuthor).toBeGreaterThanOrEqual(1);
    expect(result.shown).toBe(1);
  });

  it("non-strict still hides suggested when requested", () => {
    const result = filterFeedArticles(document, new Set(), {
      strict: false,
      hideSuggested: true,
    });
    expect(
      document.querySelector('[data-testid="post-suggested"]')!.getAttribute("data-of-hidden")
    ).toBe("true");
    expect(result.shown).toBeGreaterThanOrEqual(2);
  });
});
