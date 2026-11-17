import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canSafelyFilterStoryViewer,
  extractStoryUsername,
  filterStoryTray,
} from "../../src/content/filtering/stories";
import { buildAllowlist } from "../../src/shared/username";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "stories.html"), "utf8");

describe("stories DOM fixtures", () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it("extracts usernames from story hrefs", () => {
    const alice = document.querySelector('a[href*="/stories/alice/"]')!;
    expect(extractStoryUsername(alice)).toBe("alice");
  });

  it("filters tray in strict mode and keeps own story", () => {
    const allow = buildAllowlist(["alice"]);
    const result = filterStoryTray(document, allow, { strict: true });

    const own = document.querySelector('[aria-label="Your story"]') as HTMLElement;
    const alice = document.querySelector('a[href*="/stories/alice/"]') as HTMLElement;
    const bob = document.querySelector('a[href*="/stories/bob/"]') as HTMLElement;
    const mystery = document.querySelector('[aria-label="mystery ring"]') as HTMLElement;

    expect(own.getAttribute("data-of-hidden")).toBeNull();
    expect(alice.getAttribute("data-of-hidden")).toBeNull();
    expect(bob.getAttribute("data-of-hidden")).toBe("true");
    expect(mystery.getAttribute("data-of-hidden")).toBe("true");
    expect(result.matching).toBe("partial");
    expect(result.unknown).toBeGreaterThanOrEqual(1);
  });

  it("documents unsafe story viewer filtering", () => {
    expect(canSafelyFilterStoryViewer()).toBe(false);
  });
});
