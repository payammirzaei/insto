import { describe, expect, it } from "vitest";
import {
  buildAllowlist,
  decideVisibility,
  isAllowedUsername,
  isValidUsername,
  normalizeUsername,
  usernameFromHref,
} from "../../src/shared/username";

describe("normalizeUsername", () => {
  it("strips @ and lowercases", () => {
    expect(normalizeUsername("  @Alice_01 ")).toBe("alice_01");
  });
});

describe("isValidUsername", () => {
  it("accepts typical Instagram usernames", () => {
    expect(isValidUsername("fun.friend")).toBe(true);
    expect(isValidUsername("a")).toBe(true);
  });
  it("rejects invalid", () => {
    expect(isValidUsername("")).toBe(false);
    expect(isValidUsername("has space")).toBe(false);
    expect(isValidUsername("bad!")).toBe(false);
  });
});

describe("usernameFromHref", () => {
  it("parses profile paths", () => {
    expect(usernameFromHref("/alice/")).toBe("alice");
    expect(usernameFromHref("https://www.instagram.com/Bob.Cat")).toBe("bob.cat");
  });
  it("parses stories paths", () => {
    expect(usernameFromHref("/stories/alice/123/")).toBe("alice");
  });
  it("rejects reserved paths including mobile shell", () => {
    expect(usernameFromHref("/explore/")).toBeNull();
    expect(usernameFromHref("/reels/")).toBeNull();
    expect(usernameFromHref("/direct/inbox/")).toBeNull();
    expect(usernameFromHref("/p/AbCdEf/")).toBeNull();
    expect(usernameFromHref("/u/direct/")).toBeNull();
    expect(usernameFromHref("/u/profile/")).toBeNull();
  });
});

describe("decideVisibility", () => {
  const allow = buildAllowlist(["alice", "@Bob"]);

  it("shows allowlisted authors", () => {
    expect(decideVisibility("alice", allow)).toEqual({
      action: "show",
      reason: "allowlisted",
      username: "alice",
    });
  });

  it("hides non-allowlisted", () => {
    expect(decideVisibility("carol", allow)).toEqual({
      action: "hide",
      reason: "not_allowlisted",
      username: "carol",
    });
  });

  it("fails closed on unknown author", () => {
    expect(decideVisibility(null, allow)).toEqual({
      action: "hide",
      reason: "unknown_author",
    });
  });

  it("fails closed on empty allowlist by default", () => {
    expect(decideVisibility("alice", new Set())).toEqual({
      action: "hide",
      reason: "unknown_author",
    });
  });

  it("isAllowedUsername helper", () => {
    expect(isAllowedUsername("BOB", allow)).toBe(true);
    expect(isAllowedUsername("nope", allow)).toBe(false);
  });
});
