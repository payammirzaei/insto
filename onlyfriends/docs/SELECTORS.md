# Fragile Instagram DOM selectors — verification log

OnlyFriends matches Instagram’s **public website DOM**. Prefer semantic hooks (`href`, `aria-label`, roles) over hashed class names.

**Legend**
- **Verified** — observed live in browser during this project’s validation (date noted)
- **Assumed** — based on historical Instagram web patterns / fixtures; not confirmed on a signed-in feed in this session
- **Blocked** — could not be validated without a signed-in session (no account access)

## Live probe (2026-11-16)

Environment: Chrome DevTools MCP, mobile viewport `390×844`, Firefox Android UA, Instagram home **logged out** (cookie dialog cleared). No Instagram account was used.

### Bottom navigation (mobile shell) — Verified

| Label in UI | `href` | OnlyFriends handling |
|-------------|--------|----------------------|
| Home | `/?nb=l` | Permitted |
| Direct | `/u/direct/` | Permitted (must never block) |
| Reels | `/reels/` | Hidden + click/history guard |
| Search & Explore | `/explore/` | Hidden + click/history guard |
| Profile | `/u/profile/` | Permitted |

### Desktop logged-out home — Partial

Desktop logged-out marketing/login page did **not** expose the same bottom nav. Classic paths (`/direct/inbox/`, `/`) remain **Assumed** for signed-in desktop.

### Feed posts (`article` + author `a[href]`) — Blocked / Assumed

| Intent | Strategy | Status |
|--------|----------|--------|
| Post container | `article` | **Assumed** (historical). Logged-out page had 1 empty `article` with **0** profile links — not a real feed. |
| Author link | first profile `href` before media | **Assumed**; fail closed if missing |
| Suggested / Sponsored | text/aria heuristics | **Assumed**; never complete |

### Stories tray — Blocked / Assumed

| Intent | Strategy | Status |
|--------|----------|--------|
| Story ring | `a[href*="/stories/"]` | **Assumed** — no story links on logged-out shell |
| Own story | “Your story” aria/text | **Assumed** |
| Viewer swipe filter | — | **Unsafe by design** — not implemented |

### Following feed — Unverified

| Intent | Strategy | Status |
|--------|----------|--------|
| `/?variant=following` | query detect | **Unverified** on live accounts |
| “Following” tab label | DOM text match | **Assumed** / locale-sensitive |

## MutationObserver

- Observe `document.body`, debounce ≥ 100ms
- Skip `#onlyfriends-root` / host mutations
- **Fixture-tested**: newly inserted posts/stories re-filtered (see `tests/fixtures/dynamic-feed.test.ts`)

## Safety rules confirmed in code (unit-tested)

1. `/u/direct/` and `/direct/…` are **not** blocked and **skip** feed/story filtering.
2. `/explore/` and `/reels/` **are** blocked.
3. Global `[role=listbox] { display:none }` was **removed** — it risked breaking DM search UI.

## Re-verify after Instagram updates (signed-in)

1. Confirm bottom nav hrefs still match the table above (especially Direct).
2. Confirm home `article` posts expose a profile `href` in the header.
3. Confirm story tray links include `/stories/{user}`.
4. Open a DM, search a recipient, send a message — UI must remain usable.
5. Run `docs/MANUAL_TEST_CHECKLIST.md`.
