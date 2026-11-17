import { describe, expect, it } from "vitest";
import {
  followingVariantHomeUrl,
  isBlockedPath,
  isBlockedUrl,
  isDirectMessagesPath,
  isFollowingVariantUrl,
  isPermittedPath,
  parseInstagramPath,
  safeRedirectPath,
  shouldFilterFeed,
} from "../../src/shared/navigation";

describe("parseInstagramPath", () => {
  it("detects classic sections", () => {
    expect(parseInstagramPath("/").section).toBe("home");
    expect(parseInstagramPath("/explore/").section).toBe("explore");
    expect(parseInstagramPath("/reels/").section).toBe("reels");
    expect(parseInstagramPath("/direct/inbox/").section).toBe("direct");
    expect(parseInstagramPath("/stories/alice/1").section).toBe("stories");
    expect(parseInstagramPath("/alice/").section).toBe("profile");
  });

  it("detects verified mobile shell paths", () => {
    expect(parseInstagramPath("/u/direct/").section).toBe("direct");
    expect(parseInstagramPath("/u/direct/t/123/").section).toBe("direct");
    expect(parseInstagramPath("/u/profile/").section).toBe("profile");
  });
});

describe("block rules", () => {
  it("blocks explore and reels only", () => {
    expect(isBlockedPath("/explore/")).toBe(true);
    expect(isBlockedPath("/reels/")).toBe(true);
    expect(isBlockedUrl("https://www.instagram.com/reel/abc/")).toBe(true);
    expect(isBlockedPath("/direct/inbox/")).toBe(false);
    expect(isBlockedPath("/u/direct/")).toBe(false);
    expect(isBlockedPath("/u/profile/")).toBe(false);
    expect(isBlockedPath("/alice/")).toBe(false);
    expect(isPermittedPath("/direct/t/123/")).toBe(true);
  });

  it("safeRedirectPath sends blocked to home", () => {
    expect(safeRedirectPath("/explore/")).toBe("/");
    expect(safeRedirectPath("/direct/inbox/")).toBe("/direct/inbox/");
    expect(safeRedirectPath("/u/direct/")).toBe("/u/direct/");
  });
});

describe("DM surfaces must not be feed-filtered", () => {
  it("recognizes classic and mobile DM paths", () => {
    expect(isDirectMessagesPath("/direct/inbox/")).toBe(true);
    expect(isDirectMessagesPath("/u/direct/")).toBe(true);
    expect(shouldFilterFeed("/direct/inbox/")).toBe(false);
    expect(shouldFilterFeed("/u/direct/")).toBe(false);
    expect(shouldFilterFeed("/")).toBe(true);
    expect(shouldFilterFeed("/alice/")).toBe(true);
  });
});

describe("following variant", () => {
  it("detects query param without assuming availability", () => {
    expect(isFollowingVariantUrl("https://www.instagram.com/?variant=following")).toBe(
      true
    );
    expect(isFollowingVariantUrl("https://www.instagram.com/")).toBe(false);
    expect(followingVariantHomeUrl()).toContain("variant=following");
  });
});
