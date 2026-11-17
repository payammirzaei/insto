# OnlyFriends 0.1.1 — validation report

Date: 2026-11-16  
Scope: real-world validation + hardening before Mozilla unlisted signing prep  
Account access: **none** (explicitly not used)

## Automated

| Check | Result |
|-------|--------|
| Unit + fixture tests | Run in this pass (`npm test`) |
| Typecheck | Run in this pass (`npm run typecheck`) |
| Build + unsigned package | Run in this pass (`npm run package`) |

## Live Instagram DOM

| Area | Result | Notes |
|------|--------|-------|
| Mobile nav Explore `/explore/` | **Verified** | Logged-out mobile shell |
| Mobile nav Reels `/reels/` | **Verified** | Logged-out mobile shell |
| Mobile nav Direct `/u/direct/` | **Verified** | Critical path; code updated |
| Mobile nav Profile `/u/profile/` | **Verified** | Treated as permitted profile shell |
| Mobile Home `/?nb=l` | **Verified** | Permitted |
| Signed-in feed `article` authors | **Blocked** | Requires your session |
| Signed-in stories tray | **Blocked** | Requires your session |
| Open DM + send message | **Blocked** | Requires your session; code audited to avoid blocking |
| Following tab / `?variant=following` | **Unverified** | Not assumed |

## Code audits performed without login

1. **DM safety** — feed/story filtering skipped on `/direct/*` and `/u/direct/*`; click-guard allows Explore/Reels links while already on DM pages; removed global listbox CSS hide.
2. **Strict Friends** — fail-closed for missing authors; dynamic insert fixtures added.
3. **Timers** — multi-tab lease so two visible tabs do not double-count; storage reload each tick; visibility pause.
4. **Android UI** — FAB raised above bottom nav + safe-area; timer chip also opens settings; panel uses `dvh` + touch scrolling.

## Honest gaps (manual, signed-in, on your device)

You must confirm on Firefox Android with your Instagram session:

1. Strict Friends shows only allowlisted posts when authors are readable.
2. Story tray filters correctly when `/stories/{user}` is present.
3. DMs: open inbox via `/u/direct/`, open a thread, send a message.
4. Explore/Reels icons gone; accidental navigation shows calm block screen.
5. OF button / timer chip reachable above Instagram + Firefox chrome.
6. Session timer survives reload; second tab does not burn time twice; end screen appears.

See `MANUAL_TEST_CHECKLIST.md` and `AMO_UNLISTED_SIGNING.md` (no submit).
