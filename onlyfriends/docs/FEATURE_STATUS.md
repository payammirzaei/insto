# Feature status (v0.1.1)

| Feature | Status | Notes |
|---------|--------|-------|
| Manual friends allowlist | **Working** | Local storage |
| Strict Friends post filter | **Partial** — code + fixtures OK; **live signed-in feed blocked** | Fail closed; needs your session to confirm DOM |
| Hide suggested/sponsored | **Partial** | Heuristics; never complete |
| Following mode | **Partial / unverified live** | Tab click + variant probe; not assumed |
| Stories tray filter | **Partial** — fixtures OK; **live blocked** | Needs signed-in tray |
| Story viewer swipe filter | **Blocked (by design)** | Unsafe |
| Hide Explore/Reels nav | **Working** for verified hrefs `/explore/`, `/reels/` | Live mobile shell verified 2026-11-16 |
| Preserve DMs | **Code-hardened**; **live send/open blocked** | Supports `/u/direct/` + `/direct/`; skips feed filter on DM |
| Preserve profiles | **Working** (policy + `/u/profile/` verified) | |
| Session timer + end screen | **Working** (unit + multi-tab lease) | Live multi-tab needs manual confirm |
| Daily budget | **Working** | Local day rollover |
| Light/dark + EN/FA | **Working** | |
| Android settings reachability | **Improved** | FAB safe-area + timer opens settings; live Android confirm needed |
| Unsigned Android install | **Blocked** | Needs Mozilla-signed XPI |
| AMO unlisted submit | **Prepared, not submitted** | See `AMO_UNLISTED_SIGNING.md` |
