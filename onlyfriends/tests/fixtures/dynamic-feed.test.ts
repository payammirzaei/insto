import { describe, expect, it } from "vitest";
import { filterFeedArticles } from "../../src/content/filtering/posts";
import { filterStoryTray } from "../../src/content/filtering/stories";
import { buildAllowlist } from "../../src/shared/username";

describe("dynamic DOM updates (MutationObserver contract)", () => {
  it("re-filters newly inserted posts fail-closed", () => {
    document.body.innerHTML = `
      <main>
        <article data-id="1"><header><a href="/alice/">alice</a></header><img /></article>
      </main>
    `;
    const allow = buildAllowlist(["alice"]);
    filterFeedArticles(document, allow, { strict: true, hideSuggested: true });

    // Simulate Instagram inserting a post without author + a non-friend
    document.querySelector("main")!.insertAdjacentHTML(
      "beforeend",
      `
      <article data-id="2"><div>no author</div><img /></article>
      <article data-id="3"><header><a href="/carol/">carol</a></header><img /></article>
      `
    );

    const result = filterFeedArticles(document, allow, {
      strict: true,
      hideSuggested: true,
    });

    expect(document.querySelector('[data-id="1"]')!.getAttribute("data-of-filtered")).toBe(
      "show"
    );
    expect(document.querySelector('[data-id="2"]')!.getAttribute("data-of-hidden")).toBe(
      "true"
    );
    expect(document.querySelector('[data-id="3"]')!.getAttribute("data-of-hidden")).toBe(
      "true"
    );
    expect(result.unknownAuthor).toBeGreaterThanOrEqual(1);
  });

  it("re-filters newly inserted story rings", () => {
    document.body.innerHTML = `
      <div id="tray">
        <a href="/stories/alice/1/" aria-label="alice's story">alice</a>
      </div>
    `;
    const allow = buildAllowlist(["alice"]);
    filterStoryTray(document, allow, { strict: true });

    document.querySelector("#tray")!.insertAdjacentHTML(
      "beforeend",
      `<a href="/stories/bob/2/" aria-label="bob's story">bob</a>
       <a href="/stories/" aria-label="unknown">?</a>`
    );

    const result = filterStoryTray(document, allow, { strict: true });
    expect(
      (document.querySelector('a[href*="/stories/bob/"]') as HTMLElement).getAttribute(
        "data-of-hidden"
      )
    ).toBe("true");
    expect(result.unknown).toBeGreaterThanOrEqual(1);
    expect(result.matching).toBe("partial");
  });
});
